export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || searchParams.get('query') || ''
    const order_by = searchParams.get('order_by') || 'popularity'
    const sort = searchParams.get('sort') || 'desc'
    const limit = searchParams.get('limit') || '25'
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const page = searchParams.get('page') || '1'

    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 12000)

        const url = `${BACKEND_API}/manga?q=${q}&type=${type}&status=${status}&order_by=${order_by}&sort=${sort}&limit=${limit}&page=${page}`
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 },
            signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            console.error(`[PROXY ERROR] Manga search backend status: ${response.status}`)
            return NextResponse.json({ data: [] }, { status: 200 })
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.warn('[PROXY TIMEOUT] Manga search timed out after 12s')
        } else {
            console.error('[PROXY CRASH] Manga search proxy error:', error)
        }
        return NextResponse.json({ data: [] }, { status: 200 })
    }
}
