import { NextRequest, NextResponse } from 'next/server'

// Proxy to Backend API
const BACKEND_API = 'https://animy-backend.onrender.com/api/v1'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'airing'
    const type = searchParams.get('type') || ''

    try {
        // Backend handles filter and type in /anime/top
        const response = await fetch(`${BACKEND_API}/anime/top?filter=${filter}&type=${type}`, {
            headers: {
                'Accept': 'application/json',
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        })

        if (!response.ok) {
            throw new Error(`Backend API error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json(data.data)
    } catch (error: any) {
        console.error('Top anime fetch error:', error)
        return NextResponse.json({ error: error.message, data: { data: [] } }, { status: 500 })
    }
}
