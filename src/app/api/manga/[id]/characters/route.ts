export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

// Use Jikan v4 directly — the HF backend can't be relied on (cold starts, timeouts)
const JIKAN_API = 'https://api.jikan.moe/v4'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const response = await fetch(`${JIKAN_API}/manga/${id}/characters`, {
            headers: { 'Accept': 'application/json' },
            cache: 'no-store',
        })

        if (!response.ok) {
            return NextResponse.json({ data: [] })
        }

        const data = await response.json()
        return NextResponse.json({ data: data.data })
    } catch (error: any) {
        console.error('Manga characters error:', error)
        return NextResponse.json({ data: [] })
    }
}
