import { NextRequest, NextResponse } from 'next/server'

// Proxy to Backend API
const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export async function GET(
    request: NextRequest,
    { params }: { params: { episodeId: string } }
) {
    const { episodeId } = params
    const provider = request.nextUrl.searchParams.get('provider')

    try {
        // Call backend streaming endpoint
        // encoding episodeId is crucial as it might contain slashes/special chars
        const queryParams = provider ? `?provider=${encodeURIComponent(provider)}` : ''
        const url = `${BACKEND_API}/streaming/episode/${encodeURIComponent(episodeId)}${queryParams}`

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 0 }
        })

        if (!response.ok) {
            throw new Error(`Backend streaming error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Watch error:', error)
        return NextResponse.json({ error: error.message || 'Failed to get streaming links' }, { status: 500 })
    }
}
