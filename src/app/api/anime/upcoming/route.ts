export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '20'

    try {
        const response = await fetch(`${BACKEND_API}/anime/upcoming?page=${page}&limit=${limit}`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 }
        })

        if (!response.ok) {
            console.error(`[PROXY ERROR] Upcoming failed: ${response.status}`)
            return NextResponse.json({ data: [] }, { status: 200 })
        }

        const data = await response.json()
        return NextResponse.json(data.data || data)
    } catch (error: any) {
        console.error('[PROXY CRASH] Upcoming fetch failed:', error)
        return NextResponse.json({ data: [] }, { status: 200 })
    }
}
