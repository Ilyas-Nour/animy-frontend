import { NextRequest, NextResponse } from 'next/server'
import { TOP_MOVIES_STATIC } from '@/lib/static-anime-data'
import { mapKitsuToAnime } from '@/lib/kitsu-mapper'

const KITSU_API = 'https://kitsu.io/api/edge'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '24'
    
    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    const offset = (pageNum - 1) * limitNum

    try {
        const url = `${KITSU_API}/anime?filter[subtype]=movie&sort=-userCount&page[limit]=${limitNum}&page[offset]=${offset}&include=mappings`

        const signal = AbortSignal.timeout(10000)

        const response = await fetch(url, {
            headers: { 'Accept': 'application/vnd.api+json' },
            signal,
        })

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
        console.warn('Kitsu movies API unavailable, using static fallback:', error.message)
        const movies = TOP_MOVIES_STATIC
        return NextResponse.json({
            data: movies,
            pagination: {
                last_visible_page: 1,
                has_next_page: false,
                current_page: 1,
                items: { count: movies.length, total: movies.length, per_page: movies.length },
            },
            _fallback: true,
        })
    }
}
