export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

// Use our Backend
const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')

    if (!query) {
        return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    try {
        // Call backend streaming search (defaults to AnimePahe)
        const response = await fetch(`${BACKEND_API}/streaming/search?query=${encodeURIComponent(query)}`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 0 }
        })

        if (!response.ok) {
            throw new Error(`Backend streaming error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json({ data }) // Wrap in data object as expected by StreamingContainer
    } catch (error: any) {
        console.error('Search error:', error)
        return NextResponse.json({ error: error.message || 'Search failed' }, { status: 500 })
    }
}
