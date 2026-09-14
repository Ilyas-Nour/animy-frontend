export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { TOP_ANIME_STATIC } from '@/lib/static-anime-data'

const JIKAN_API = 'https://api.jikan.moe/v4'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '24'
    
    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)

    try {
        const url = `${JIKAN_API}/anime?type=tv&order_by=members&sort=desc&limit=${limitNum}&page=${pageNum}`

        const response = await fetch(url, {
            signal: AbortSignal.timeout(10000),
            next: { revalidate: 3600 }
        })

        if (!response.ok) {
            throw new Error(`Jikan API error: ${response.status}`)
        }

        const data = await response.json()
        const mappedData = (data.data || []).map((a: any) => ({ ...a, id: a.mal_id }))
        
        const pagination = data.pagination || {}
        const totalCount = pagination.items?.total || 1000
        const hasNextPage = pagination.has_next_page || false

        return NextResponse.json({
            data: mappedData,
            pagination: {
                last_visible_page: pagination.last_visible_page || Math.ceil(totalCount / limitNum),
                has_next_page: hasNextPage,
                current_page: pageNum,
                items: { count: mappedData.length, total: totalCount, per_page: limitNum },
            },
        })
    } catch (error: any) {
        console.warn('Jikan series API unavailable, using static fallback:', error.message)
        const tvSeries = TOP_ANIME_STATIC.filter(a => a.type === 'TV')
        return NextResponse.json({
            data: tvSeries,
            pagination: {
                last_visible_page: 1,
                has_next_page: false,
                current_page: 1,
                items: { count: tvSeries.length, total: tvSeries.length, per_page: tvSeries.length },
            },
            _fallback: true,
        })
    }
}
