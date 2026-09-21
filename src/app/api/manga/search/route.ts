export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { TOP_MANGA_STATIC } from '@/lib/static-anime-data'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || searchParams.get('query') || ''
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '24'
    const type = searchParams.get('type') || ''
    const orderBy = searchParams.get('order_by') || ''
    const sort = searchParams.get('sort') || 'desc'
    const status = searchParams.get('status') || searchParams.get('filter') || ''

    try {
        const queryParams = new URLSearchParams()
        if (q) queryParams.append('query', q)
        if (page) queryParams.append('page', page)
        if (limit) queryParams.append('limit', limit)
        if (type) queryParams.append('type', type)
        if (orderBy) queryParams.append('order_by', orderBy)
        if (sort) queryParams.append('sort', sort)
        if (status) queryParams.append('status', status)

        const response = await fetch(`${API_URL}/manga/search?${queryParams.toString()}`, {
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
        })

        if (!response.ok) {
            throw new Error(`Backend search failed: ${response.status}`)
        }

        const data = await response.json()
        
        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            }
        })
    } catch (error: any) {
        console.warn('[manga/search] Backend unavailable, using static fallback:', error.message)
        
        let filtered = TOP_MANGA_STATIC as any[]
        if (q) {
            const lq = q.toLowerCase()
            filtered = filtered.filter(a =>
                a.title.toLowerCase().includes(lq) ||
                (a.title_english && a.title_english.toLowerCase().includes(lq))
            )
        }
        
        const pageNum = parseInt(page, 10)
        const limitNum = parseInt(limit, 10)
        const start = (pageNum - 1) * limitNum
        const paginated = filtered.slice(start, start + limitNum)

        return NextResponse.json({
            data: paginated,
            pagination: {
                last_visible_page: Math.ceil(filtered.length / limitNum),
                has_next_page: start + limitNum < filtered.length,
                current_page: pageNum,
                items: { count: paginated.length, total: filtered.length, per_page: limitNum },
            },
            _fallback: true,
        })
    }
}
