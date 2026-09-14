export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { mapMangaDexToManga } from '@/lib/mangadex-mapper'

const JIKAN_API = 'https://api.jikan.moe/v4'
const MANGADEX_API = 'https://api.mangadex.org'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const limit = searchParams.get('limit') || '5'
    const limitNum = Math.min(parseInt(limit, 10), 10)

    if (!q.trim()) {
        return NextResponse.json({ anime: [], manga: [] })
    }

    try {
        // Search anime and manga in parallel via Jikan and MangaDex
        const [animeRes, mangaRes] = await Promise.allSettled([
            fetch(`${JIKAN_API}/anime?q=${encodeURIComponent(q)}&limit=${limitNum}&sfw=true`, {
                signal: AbortSignal.timeout(8000),
                next: { revalidate: 3600 }
            }),
            fetch(`${MANGADEX_API}/manga?title=${encodeURIComponent(q)}&limit=${limitNum}&includes[]=cover_art`, {
                signal: AbortSignal.timeout(8000),
                next: { revalidate: 3600 }
            }),
        ])

        let animeData: any[] = []
        let mangaData: any[] = []

        if (animeRes.status === 'fulfilled' && animeRes.value.ok) {
            const json = await animeRes.value.json()
            animeData = (json.data || []).map((a: any) => ({ ...a, id: a.mal_id }))
        }

        if (mangaRes.status === 'fulfilled' && mangaRes.value.ok) {
            const json = await mangaRes.value.json()
            mangaData = mapMangaDexToManga(json.data)
        }

        return NextResponse.json({ anime: animeData, manga: mangaData })
    } catch (error: any) {
        console.error('[Global Search] Search error:', error.message)
        return NextResponse.json({ anime: [], manga: [] }, { status: 500 })
    }
}
