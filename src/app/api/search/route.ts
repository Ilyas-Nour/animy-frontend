export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const limit = searchParams.get('limit') || '5'

    if (!q.trim()) {
        return NextResponse.json({ anime: [], manga: [] })
    }

    try {
        // Search anime and manga in parallel
        const [animeRes, mangaRes] = await Promise.allSettled([
            fetch(`${BACKEND_API}/anime?q=${encodeURIComponent(q)}&limit=${limit}&page=1`, {
                headers: { 'Accept': 'application/json' },
                next: { revalidate: 0 }
            }),
            fetch(`${BACKEND_API}/manga?q=${encodeURIComponent(q)}&limit=${limit}&page=1&order_by=popularity&sort=desc`, {
                headers: { 'Accept': 'application/json' },
                next: { revalidate: 0 }
            })
        ])

        let animeData: any[] = []
        let mangaData: any[] = []

        if (animeRes.status === 'fulfilled' && animeRes.value.ok) {
            const json = await animeRes.value.json()
            animeData = json?.data || []
        }

        if (mangaRes.status === 'fulfilled' && mangaRes.value.ok) {
            const json = await mangaRes.value.json()
            mangaData = json?.data || []
        }

        return NextResponse.json({ anime: animeData, manga: mangaData })
    } catch (error: any) {
        console.error('Unified search error:', error)
        return NextResponse.json({ anime: [], manga: [] }, { status: 500 })
    }
}
