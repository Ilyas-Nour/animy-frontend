import { NextRequest, NextResponse } from 'next/server'

const JIKAN_API = 'https://api.jikan.moe/v4'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'airing'
    const limit = searchParams.get('limit') || '25'

    try {
        const response = await fetch(`${JIKAN_API}/top/anime?filter=${filter}&limit=${limit}`, {
            headers: {
                'Accept': 'application/json',
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        })

        if (!response.ok) {
            throw new Error(`Jikan API error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json({ data })
    } catch (error: any) {
        console.error('Top anime fetch error:', error)
        return NextResponse.json({ error: error.message, data: { data: [] } }, { status: 500 })
    }
}
