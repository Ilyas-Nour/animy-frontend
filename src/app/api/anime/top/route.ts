export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'airing'
    const limit = searchParams.get('limit') || '20'

    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)

        const response = await fetch(`${BACKEND_API}/anime/top?filter=${filter}&limit=${limit}`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 },
            signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            console.error(`[PROXY ERROR] Top anime backend status: ${response.status}`)
            return NextResponse.json({ data: [] }, { status: 200 })
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.warn('[PROXY TIMEOUT] Top anime fetch timed out after 15s')
        } else {
            console.error('[PROXY CRASH] Top anime proxy fetch failed:', error)
        }
        return NextResponse.json({ data: [] }, { status: 200 })
    }
}
