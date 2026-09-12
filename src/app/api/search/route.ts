export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { mapKitsuToAnime } from '@/lib/kitsu-mapper'

const KITSU_API = 'https://kitsu.io/api/edge'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const limit = searchParams.get('limit') || '5'
    const limitNum = Math.min(parseInt(limit, 10), 10)

    if (!q.trim()) {
        return NextResponse.json({ anime: [], manga: [] })
    }

    try {
        // Search anime and manga in parallel via Kitsu
        const [animeRes, mangaRes] = await Promise.allSettled([
            fetch(`${KITSU_API}/anime?filter[text]=${encodeURIComponent(q)}&page[limit]=${limitNum}&include=mappings`, {
                headers: { 'Accept': 'application/vnd.api+json' },
                signal: AbortSignal.timeout(8000),
            }),
            fetch(`${KITSU_API}/manga?filter[text]=${encodeURIComponent(q)}&page[limit]=${limitNum}&include=mappings`, {
                headers: { 'Accept': 'application/vnd.api+json' },
                signal: AbortSignal.timeout(8000),
            }),
        ])

        let animeData: any[] = []
        let mangaData: any[] = []

        if (animeRes.status === 'fulfilled' && animeRes.value.ok) {
            const json = await animeRes.value.json()
            animeData = mapKitsuToAnime(json.data, json.included)
        }

        if (mangaRes.status === 'fulfilled' && mangaRes.value.ok) {
            const json = await mangaRes.value.json()
            mangaData = mapKitsuToAnime(json.data, json.included)
        }

        return NextResponse.json({ anime: animeData, manga: mangaData })
    } catch (error: any) {
        console.error('[Global Search] Kitsu search error:', error.message)
        return NextResponse.json({ anime: [], manga: [] }, { status: 500 })
    }
}
