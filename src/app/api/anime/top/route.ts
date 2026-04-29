export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'airing'
    const limit = searchParams.get('limit') || '20'

    try {
        const response = await fetch(`${BACKEND_API}/anime/top?filter=${filter}&limit=${limit}`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 }
        })

        if (!response.ok) {
            throw new Error(`Backend API error: ${response.status}`)
        }

        const data = await response.json()
        // Backend already returns { data: [...] } in Jikan-compatible format
        return NextResponse.json(data)
    } catch (error: any) {
        console.error('[PROXY CRASH] Top anime proxy fetch failed:', error)
        return NextResponse.json({ data: [] }, { status: 200 })
    }
}
