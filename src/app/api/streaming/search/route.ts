import { NextRequest, NextResponse } from 'next/server'

const CONSUMET_API = process.env.CONSUMET_API_URL || 'https://api-consumet-org-iota-flax.vercel.app'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')

    if (!query) {
        return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    try {
        const response = await fetch(`${CONSUMET_API}/anime/gogoanime/${encodeURIComponent(query)}`)

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
