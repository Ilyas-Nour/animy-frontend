import { NextRequest, NextResponse } from 'next/server'

// Use a working Consumet API instance with Zoro provider
const CONSUMET_API = process.env.CONSUMET_API_URL || 'https://consumet-api-clone.vercel.app'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')

    if (!query) {
        return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    try {
        // Use Zoro provider (more reliable than Gogoanime)
        const response = await fetch(`${CONSUMET_API}/anime/zoro/${encodeURIComponent(query)}`, {
            headers: { 'Accept': 'application/json' },
        })

        if (!response.ok) {
            throw new Error(`Consumet API error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Search error:', error)
        return NextResponse.json({ error: error.message || 'Search failed' }, { status: 500 })
    }
}
