export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { TOP_MANGA_STATIC } from '@/lib/static-anime-data'
import { anilistFetch, mapAniListToManga } from '@/lib/anilist-client'

// MangaDex API v5 fallback - official, free, no auth needed for search
async function searchMangaDex(q: string, limit: number, offset: number) {
    const params = new URLSearchParams()
    params.set('title', q)
    params.set('limit', String(Math.min(limit, 100)))
    params.set('offset', String(offset))
    params.set('order[relevance]', 'desc')
    params.append('contentRating[]', 'safe')
    params.append('contentRating[]', 'suggestive')
    params.append('includes[]', 'cover_art')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    try {
        const res = await fetch(`https://api.mangadex.org/manga?${params}`, {
            headers: { 'Accept': 'application/json' },
            signal: controller.signal,
            cache: 'no-store',
        })
        clearTimeout(timeoutId)
        if (!res.ok) return null
        const json = await res.json()
        
        // Map MangaDex format to our Manga format
        const mapped = (json.data || []).map((item: any) => {
            const attrs = item.attributes
            // Find cover art relationship
            const coverRel = item.relationships?.find((r: any) => r.type === 'cover_art')
            const coverFile = coverRel?.attributes?.fileName
            const mangaId = item.id
            const coverUrl = coverFile 
                ? `https://uploads.mangadex.org/covers/${mangaId}/${coverFile}.512.jpg`
                : null
            
            const title = attrs.title?.en || 
                          Object.values(attrs.title || {})[0] || 
                          'Unknown Title'
            
            return {
                id: item.id,
                mal_id: null,
                mangadexId: item.id,
                title: String(title),
                title_english: attrs.title?.en || null,
                title_japanese: attrs.title?.ja || attrs.title?.['ja-ro'] || null,
                images: {
                    jpg: {
                        image_url: coverUrl,
                        large_image_url: coverUrl,
                        small_image_url: coverUrl ? `https://uploads.mangadex.org/covers/${mangaId}/${coverFile}.256.jpg` : null,
                    },
                    webp: {
                        image_url: coverUrl,
                        large_image_url: coverUrl,
                    }
                },
                type: attrs.publicationDemographic || attrs.format || 'Manga',
                chapters: attrs.lastChapter ? parseInt(attrs.lastChapter) : null,
                volumes: attrs.lastVolume ? parseInt(attrs.lastVolume) : null,
                status: attrs.status === 'completed' ? 'Finished' : attrs.status === 'ongoing' ? 'Publishing' : attrs.status,
                publishing: attrs.status === 'ongoing',
                score: null,
                popularity: null,
                synopsis: attrs.description?.en || Object.values(attrs.description || {})[0] || '',
                genres: (attrs.tags || [])
                    .filter((t: any) => t.attributes?.group === 'genre')
                    .map((t: any, i: number) => ({ 
                        mal_id: i, 
                        name: t.attributes?.name?.en || Object.values(t.attributes?.name || {})[0] || t.id 
                    })),
                authors: [],
                serializations: [],
                explicit_genres: [],
                themes: [],
                demographics: [],
            }
        })
        
        return { data: mapped, total: json.total || mapped.length }
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

    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)

    // 1. Try AniList first (best metadata quality)
    try {
        const query = `
            query($search: String, $page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo { total perPage currentPage lastPage hasNextPage }
                    media(type: MANGA, search: $search, sort: POPULARITY_DESC) {
                        id idMal title { english romaji native } coverImage { extraLarge large medium color }
                        format chapters volumes status meanScore popularity description
                        startDate { year month day } endDate { year month day } genres
                    }
                }
            }
        `
        const variables: any = { page: pageNum, perPage: limitNum }
        if (q) variables.search = q
        
        const data = await anilistFetch(query, variables)
        const mappedData = data.Page?.media?.map(mapAniListToManga) || []
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
        console.warn('[manga/search] AniList unavailable, trying MangaDex:', anilistError.message)
    }

    // 2. Fallback: MangaDex API v5 (free, no auth, official)
    if (q) {
        try {
            const offset = (pageNum - 1) * limitNum
            const mangaDexResult = await searchMangaDex(q, limitNum, offset)
            if (mangaDexResult && mangaDexResult.data.length > 0) {
                const total = mangaDexResult.total
                return NextResponse.json({
                    data: mangaDexResult.data,
                    pagination: {
                        last_visible_page: Math.ceil(total / limitNum),
                        has_next_page: offset + limitNum < total,
                        current_page: pageNum,
                        items: { count: mangaDexResult.data.length, total, per_page: limitNum },
                    },
                    _source: 'mangadex',
                })
            }
        } catch (mangadexError: any) {
            console.warn('[manga/search] MangaDex also unavailable:', mangadexError.message)
        }
    }

    // 3. Last resort: static data filter
    let filtered = TOP_MANGA_STATIC as any[]
    if (q) {
        const lq = q.toLowerCase()
        filtered = filtered.filter(m =>
            m.title.toLowerCase().includes(lq) ||
            (m.title_english && m.title_english.toLowerCase().includes(lq))
        )
    }

    const start = (pageNum - 1) * limitNum
    const paginatedFiltered = filtered.slice(start, start + limitNum)
    const hasNextPage = start + limitNum < filtered.length

    return NextResponse.json({
        data: paginatedFiltered,
        pagination: {
            last_visible_page: Math.ceil(filtered.length / limitNum),
            has_next_page: hasNextPage,
            current_page: pageNum,
            items: { count: paginatedFiltered.length, total: filtered.length, per_page: limitNum },
        },
        _fallback: true,
    })
}
