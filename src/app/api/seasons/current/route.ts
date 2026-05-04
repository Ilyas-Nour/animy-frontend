export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

// Proxy to Backend API
const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1'

export async function GET(request: NextRequest) {
    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)

        // Use 'airing' top anime as current season proxy
        const response = await fetch(`${BACKEND_API}/anime/top?filter=airing&limit=25`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 },
            signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            console.error(`[PROXY ERROR] Current season backend status: ${response.status}`)
            return NextResponse.json({ data: [] }, { status: 200 })
        }

        const data = await response.json()
        return NextResponse.json(data.data || data)
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.warn('[PROXY TIMEOUT] Current season fetch timed out after 15s')
        } else {
            console.error('Current season fetch error:', error)
        }
        return NextResponse.json({ data: [] }, { status: 200 })
    }
}
