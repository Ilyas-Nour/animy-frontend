export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { TOP_ANIME_STATIC } from '@/lib/static-anime-data'

const JIKAN_API = 'https://api.jikan.moe/v4'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'airing'
    const limit = searchParams.get('limit') || '20'
    const limitNum = parseInt(limit, 10)

    let jikanFilter = ''
    if (filter === 'airing') {
        jikanFilter = '?filter=airing'
    } else if (filter === 'upcoming') {
        jikanFilter = '?filter=upcoming'
    } else if (filter === 'bypopularity') {
        jikanFilter = '?filter=bypopularity'
    }

    try {
        const url = `${JIKAN_API}/top/anime${jikanFilter}${jikanFilter ? '&' : '?'}limit=${limitNum}`

        const response = await fetch(url, {
            signal: AbortSignal.timeout(10000),
            next: { revalidate: 3600 }
        })

        if (!response.ok) {
            throw new Error(`Jikan API error: ${response.status}`)
        }

        const json = await response.json()
        const mapped = (json.data || []).map((a: any) => ({ ...a, id: a.mal_id }))

        return NextResponse.json({ data: mapped })
    } catch (error: any) {
        console.warn('[Top Anime] Jikan failed, using static fallback:', error.message)
        const staticData = TOP_ANIME_STATIC.slice(0, limitNum)
        return NextResponse.json({ data: staticData, _fallback: true })
    }
}
