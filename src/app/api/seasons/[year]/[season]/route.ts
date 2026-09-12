export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { mapKitsuToAnime } from '@/lib/kitsu-mapper'
import { TOP_ANIME_STATIC } from '@/lib/static-anime-data'

const KITSU_API = 'https://kitsu.io/api/edge'

// Maps season names to Kitsu season filter
const SEASON_MAP: Record<string, string> = {
    winter: 'winter',
    spring: 'spring',
    summer: 'summer',
    fall: 'fall',
    autumn: 'fall',
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ year: string; season: string }> }
) {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '24'

    const { year, season } = await params
    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    const offset = (pageNum - 1) * limitNum

    const kitsuSeason = SEASON_MAP[season.toLowerCase()] || season.toLowerCase()

    try {
        const url = `${KITSU_API}/anime?filter[seasonYear]=${year}&filter[season]=${kitsuSeason}&sort=-userCount&page[limit]=${limitNum}&page[offset]=${offset}&include=mappings`

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

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

        const totalCount = data.meta?.count || 0
        const hasNextPage = offset + limitNum < totalCount

        return NextResponse.json({
            success: true,
            data: {
                data: mappedData,
                pagination: {
                    last_visible_page: Math.ceil(totalCount / limitNum),
                    has_next_page: hasNextPage,
                    current_page: pageNum,
                    items: { count: mappedData.length, total: totalCount, per_page: limitNum },
                },
            },
        })
    } catch (error: any) {
        console.warn(`Season ${season} ${year} fetch failed, returning empty:`, error.message)
        return NextResponse.json({
            success: true,
            data: { data: [], pagination: { last_visible_page: 1, has_next_page: false, current_page: 1 } },
        })
    }
}
