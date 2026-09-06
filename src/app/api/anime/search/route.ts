export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

// Proxy to Backend API
const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || searchParams.get('query') || ''
    const order_by = searchParams.get('order_by') || 'popularity'
    const sort = searchParams.get('sort') || (order_by === 'popularity' ? 'asc' : 'desc')
    const limit = searchParams.get('limit') || '24'
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const page = searchParams.get('page') || '1'

    try {
        const queryParams = new URLSearchParams()
        if (q) queryParams.set('q', q)
        if (type) queryParams.set('type', type)
        if (status) queryParams.set('status', status)
        if (order_by) queryParams.set('order_by', order_by)
        if (sort) queryParams.set('sort', sort)
        if (limit) queryParams.set('limit', limit)
        if (page) queryParams.set('page', page)

        const url = `${BACKEND_API}/anime?${queryParams.toString()}`
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 0 } // No cache for search
        })

        if (!response.ok) {
            throw new Error(`Backend API error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Anime search error:', error)
        return NextResponse.json({ error: error.message, data: { data: [], pagination: {} } }, { status: 500 })
    }
}
