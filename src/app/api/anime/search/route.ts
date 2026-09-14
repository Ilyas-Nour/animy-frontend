export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { mapKitsuToAnime } from '@/lib/kitsu-mapper'
import { TOP_ANIME_STATIC } from '@/lib/static-anime-data'

const KITSU_API = 'https://kitsu.io/api/edge'

// Map Jikan/MAL sort params to Kitsu sort fields
const SORT_MAP: Record<string, string> = {
    score: '-averageRating',
    rank: 'ratingRank',
    popularity: '-userCount',
    episodes: '-episodeCount',
    title: 'canonicalTitle',
    // Kitsu only supports these sort options natively
}

const STATUS_MAP: Record<string, string> = {
    airing: 'current',
    complete: 'finished',
    upcoming: 'upcoming',
    // pass kitsu values through directly
    current: 'current',
    finished: 'finished',
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
    const limitNum = Math.min(parseInt(limit, 10), 20) // Kitsu max is 20
    const offset = (pageNum - 1) * limitNum

    // Build Kitsu sort param
    let kitsuSort = '-userCount' // default: most popular
    if (q) {
        kitsuSort = '-userCount' // When searching, rank by relevance + popularity
    } else if (orderBy && SORT_MAP[orderBy]) {
        const base = SORT_MAP[orderBy]
        // If sort is asc, remove the leading '-' if present; if desc, ensure '-' prefix
        kitsuSort = sort === 'asc' ? base.replace(/^-/, '') : (base.startsWith('-') ? base : `-${base}`)
    }

    try {
        let url = `${KITSU_API}/anime?page[limit]=${limitNum}&page[offset]=${offset}&include=mappings&sort=${kitsuSort}`

        if (q) {
            url += `&filter[text]=${encodeURIComponent(q)}`
        }

        if (type) {
            // Kitsu subtype values: TV, movie, OVA, ONA, special, music
            const kitsuType = type.toLowerCase() === 'movie' ? 'movie' : type.toUpperCase()
            url += `&filter[subtype]=${kitsuType}`
        }

        if (status && STATUS_MAP[status.toLowerCase()]) {
            url += `&filter[status]=${STATUS_MAP[status.toLowerCase()]}`
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 12000)

        const response = await fetch(url, {
            headers: { 'Accept': 'application/vnd.api+json' },
            signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
            throw new Error(`Kitsu API error: ${response.status}`)
        }

        const data = await response.json()
        const mappedData = mapKitsuToAnime(data.data, data.included)

        const totalCount = data.meta?.count || 1000
        const hasNextPage = offset + limitNum < totalCount

        return NextResponse.json({
            data: mappedData,
            pagination: {
                last_visible_page: Math.ceil(totalCount / limitNum),
                has_next_page: hasNextPage,
                current_page: pageNum,
                items: { count: mappedData.length, total: totalCount, per_page: limitNum },
            },
        })
    } catch (error: any) {
        console.warn('Anime search Kitsu unavailable, using static fallback:', error.message)
        let filtered = [...TOP_ANIME_STATIC]
        if (q) {
            const lq = q.toLowerCase()
            filtered = filtered.filter(a =>
                a.title.toLowerCase().includes(lq) ||
                (a.title_english && a.title_english.toLowerCase().includes(lq))
            )
        }
        if (type) {
            filtered = filtered.filter(a => a.type && a.type.toLowerCase() === type.toLowerCase())
        }

        return NextResponse.json({
            data: filtered,
            pagination: {
                last_visible_page: 1,
                has_next_page: false,
                current_page: 1,
                items: { count: filtered.length, total: filtered.length, per_page: filtered.length },
            },
            _fallback: true,
        })
    }
}
