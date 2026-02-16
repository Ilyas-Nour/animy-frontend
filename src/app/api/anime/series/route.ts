import { NextRequest, NextResponse } from 'next/server'

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '24'

    try {
        // Series are anime with type=tv
        const url = `${BACKEND_API}/anime?type=tv&page=${page}&limit=${limit}&order_by=popularity&sort=desc`

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 }
        })

        if (!response.ok) {
            throw new Error(`Jikan API error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json(data.data)
    } catch (error: any) {
        console.error('Anime series error:', error)
        return NextResponse.json({ error: error.message, data: { data: [], pagination: {} } }, { status: 500 })
    }
}
