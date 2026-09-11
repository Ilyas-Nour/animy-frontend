export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { TOP_ANIME_STATIC } from '@/lib/static-anime-data'

const JIKAN_API = 'https://api.jikan.moe/v4'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '24'

    try {
        // Call Jikan directly for TV series with proper type filtering
        const url = `${JIKAN_API}/top/anime?type=tv&page=${page}&limit=${limit}`

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
            throw new Error(`Jikan API error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json({
            data: data.data || [],
            pagination: data.pagination || null,
        })
    } catch (error: any) {
        console.warn('Anime series API unavailable, using static fallback:', error.message)
        // Static fallback — filter to TV type
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
