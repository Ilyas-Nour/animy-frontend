export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { TOP_MOVIES_STATIC } from '@/lib/static-anime-data'

const JIKAN_API = 'https://api.jikan.moe/v4'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '24'

    try {
        // Call Jikan directly for movies with proper type filtering
        const url = `${JIKAN_API}/top/anime?type=movie&page=${page}&limit=${limit}`

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
        console.warn('Anime movies API unavailable, using static fallback:', error.message)
        return NextResponse.json({
            data: TOP_MOVIES_STATIC,
            pagination: {
                last_visible_page: 1,
                has_next_page: false,
                current_page: 1,
                items: { count: TOP_MOVIES_STATIC.length, total: TOP_MOVIES_STATIC.length, per_page: TOP_MOVIES_STATIC.length },
            },
            _fallback: true,
        })
    }
}
