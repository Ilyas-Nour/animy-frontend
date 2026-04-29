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
        // Always proxy to Backend API
        let url = `${BACKEND_API}/manga?q=${q}&type=${type}&status=${status}&order_by=${order_by}&sort=${sort}&limit=${limit}&page=${page}`

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 },
            signal: AbortSignal.timeout(10000)
        })

        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json(data)

    } catch (error: any) {
        console.error('Manga search proxy error:', error)
        return NextResponse.json({ error: error.message, data: [] }, { status: 500 })
    }
}
