export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

// Proxy to Backend API
const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '24'
    const q = searchParams.get('q') || ''

    try {
        const response = await fetch(`${BACKEND_API}/anime?q=${q}&limit=${limit}&page=${page}`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 0 } // No cache for search
        })

        if (!response.ok) {
            throw new Error(`Backend API error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json(data.data)
    } catch (error: any) {
        console.error('Anime search error:', error)
        return NextResponse.json({ error: error.message, data: { data: [], pagination: {} } }, { status: 500 })
    }
}
