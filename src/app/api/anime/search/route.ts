export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { TOP_ANIME_STATIC } from '@/lib/static-anime-data'
import { anilistFetch, mapAniListToAnime } from '@/lib/anilist-client'

// Jikan v4 fallback for anime search when AniList is unavailable
async function searchJikan(q: string, page: number, limit: number) {
    const params = new URLSearchParams({
        q,
        page: String(page),
        limit: String(Math.min(limit, 25)), // Jikan max per page is 25
        sfw: 'false',
    })
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    try {
        const res = await fetch(`https://api.jikan.moe/v4/anime?${params}`, {
            headers: { 'Accept': 'application/json' },
            signal: controller.signal,
            cache: 'no-store',
        })
        clearTimeout(timeoutId)
        if (!res.ok) return null
        const json = await res.json()
        return { data: json.data || [], pagination: json.pagination }
    } catch {
        clearTimeout(timeoutId)
        return null
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || searchParams.get('query') || ''
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '24'
    const type = searchParams.get('type') || ''
    const orderBy = searchParams.get('order_by') || ''
    const sort = searchParams.get('sort') || 'desc'
    const status = searchParams.get('status') || searchParams.get('filter') || ''

    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)

    // 1. Try AniList first (best data quality)
    try {
        let sortOption = 'POPULARITY_DESC'
        if (orderBy === 'score') sortOption = sort === 'asc' ? 'SCORE' : 'SCORE_DESC'
        if (orderBy === 'favorites') sortOption = sort === 'asc' ? 'FAVORITES' : 'FAVORITES_DESC'

        const query = `
            query($search: String, $page: Int, $perPage: Int, $sort: [MediaSort], $status: MediaStatus, $format: MediaFormat) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo { total perPage currentPage lastPage hasNextPage }
                    media(type: ANIME, search: $search, sort: $sort, status: $status, format: $format) {
                        id idMal title { english romaji native } coverImage { extraLarge large medium color }
                        bannerImage format source episodes duration status meanScore popularity description
                        seasonYear season genres trailer { id site }
                        studios(isMain: true) { nodes { id name } }
                    }
                }
            }
        `
        const variables: any = {
            page: pageNum,
            perPage: limitNum,
            sort: [sortOption]
        }
        if (q) variables.search = q
        if (status) variables.status = status.toUpperCase()
        if (type) variables.format = type.toUpperCase()

        const data = await anilistFetch(query, variables)
        const mappedData = data.Page?.media?.map(mapAniListToAnime) || []
        const pageInfo = data.Page?.pageInfo || {}

        return NextResponse.json({
            data: mappedData,
            pagination: {
                last_visible_page: pageInfo.lastPage || 1,
                has_next_page: pageInfo.hasNextPage || false,
                current_page: pageInfo.currentPage || pageNum,
                items: { count: mappedData.length, total: pageInfo.total || mappedData.length, per_page: limitNum },
            },
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            }
        })
    } catch (anilistError: any) {
        console.warn('[anime/search] AniList unavailable, trying Jikan:', anilistError.message)
    }

    // 2. Fallback: Jikan v4 (official MAL API, reliable)
    if (q) {
        try {
            const jikanResult = await searchJikan(q, pageNum, limitNum)
            if (jikanResult && jikanResult.data.length > 0) {
                const mappedData = jikanResult.data.map((item: any) => ({
                    id: item.mal_id,
                    mal_id: item.mal_id,
                    title: item.title_english || item.title,
                    title_english: item.title_english,
                    title_japanese: item.title_japanese,
                    images: item.images,
                    bannerImage: null,
                    type: item.type,
                    episodes: item.episodes,
                    status: item.status,
                    airing: item.airing,
                    aired: item.aired,
                    duration: item.duration,
                    score: item.score,
                    scored_by: item.scored_by,
                    rank: item.rank,
                    popularity: item.popularity,
                    synopsis: item.synopsis,
                    genres: item.genres || [],
                    year: item.year,
                }))
                const p = jikanResult.pagination
                return NextResponse.json({
                    data: mappedData,
                    pagination: {
                        last_visible_page: p?.last_visible_page || 1,
                        has_next_page: p?.has_next_page || false,
                        current_page: p?.current_page || pageNum,
                        items: { count: mappedData.length, total: p?.items?.total || mappedData.length, per_page: limitNum },
                    },
                    _source: 'jikan',
                })
            }
        } catch (jikanError: any) {
            console.warn('[anime/search] Jikan also unavailable:', jikanError.message)
        }
    }

    // 3. Last resort: static data filter
    let filtered = TOP_ANIME_STATIC as any[]
    if (q) {
        const lq = q.toLowerCase()
        filtered = filtered.filter(a =>
            a.title.toLowerCase().includes(lq) ||
            (a.title_english && a.title_english.toLowerCase().includes(lq))
        )
    }
    const start = (pageNum - 1) * limitNum
    const paginated = filtered.slice(start, start + limitNum)

    return NextResponse.json({
        data: paginated,
        pagination: {
            last_visible_page: Math.ceil(filtered.length / limitNum),
            has_next_page: start + limitNum < filtered.length,
            current_page: pageNum,
            items: { count: paginated.length, total: filtered.length, per_page: limitNum },
        },
        _fallback: true,
    })
}
