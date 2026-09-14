export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { TOP_MANGA_STATIC } from '@/lib/static-anime-data'

const JIKAN_API = 'https://api.jikan.moe/v4'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const response = await fetch(`${JIKAN_API}/manga/${id}`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 }
        })

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ error: 'Manga not found' }, { status: 404 })
            }
            throw new Error(`Jikan API error: ${response.status}`)
        }

        const json = await response.json()
        const item = json.data
        const mappedData = { ...item, id: item.mal_id }
        
        return NextResponse.json({ data: mappedData })
    } catch (error: any) {
        console.error('Manga detail error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
