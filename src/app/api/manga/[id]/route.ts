export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { mapMangaDexToManga } from '@/lib/mangadex-mapper'

const MANGADEX_API = 'https://api.mangadex.org'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const response = await fetch(`${MANGADEX_API}/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 }
        })

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ error: 'Manga not found' }, { status: 404 })
            }
            throw new Error(`MangaDex API error: ${response.status}`)
        }

        const data = await response.json()
        const mappedData = mapMangaDexToManga([data.data])
        
        return NextResponse.json({ data: mappedData[0] })
    } catch (error: any) {
        console.error('Manga detail error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
