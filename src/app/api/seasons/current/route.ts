import { NextRequest, NextResponse } from 'next/server'

// Proxy to Backend API
const BACKEND_API = 'https://animy-backend.onrender.com/api/v1'

export async function GET(request: NextRequest) {
    try {
        // Use 'airing' top anime as current season proxy
        const response = await fetch(`${BACKEND_API}/anime/top?filter=airing&limit=25`, {
            headers: {
                'Accept': 'application/json',
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        })

        if (!response.ok) {
            throw new Error(`Backend API error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json({ data })
    } catch (error: any) {
        console.error('Current season fetch error:', error)
        return NextResponse.json({ error: error.message, data: { data: [] } }, { status: 500 })
    }
}
