export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { mapKitsuToAnime } from '@/lib/kitsu-mapper'
import { TOP_ANIME_STATIC } from '@/lib/static-anime-data'

const KITSU_API = 'https://kitsu.io/api/edge'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '20'
    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    const offset = (pageNum - 1) * limitNum

    try {
        const url = `${KITSU_API}/anime?filter[status]=upcoming&sort=startDate&page[limit]=${limitNum}&page[offset]=${offset}&include=mappings`

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

        const json = await response.json()
        const mapped = mapKitsuToAnime(json.data, json.included)

        const totalCount = json.meta?.count || 0
        const hasNextPage = offset + limitNum < totalCount

        return NextResponse.json({
            data: mapped,
            pagination: {
                last_visible_page: Math.ceil(totalCount / limitNum),
                has_next_page: hasNextPage,
                current_page: pageNum,
                items: { count: mapped.length, total: totalCount, per_page: limitNum },
            },
        })
    } catch (error: any) {
        console.warn('[Upcoming] Kitsu failed, using static fallback:', error.message)
        return NextResponse.json({
            data: TOP_ANIME_STATIC.slice(0, limitNum),
            pagination: { last_visible_page: 1, has_next_page: false, current_page: 1 },
            _fallback: true,
        })
    }
}
