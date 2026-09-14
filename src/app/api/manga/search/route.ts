export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { TOP_MANGA_STATIC } from '@/lib/static-anime-data'

const JIKAN_API = 'https://api.jikan.moe/v4'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || searchParams.get('query') || ''
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '24'

    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)

    try {
        let url = `${JIKAN_API}/manga?page=${pageNum}&limit=${limitNum}`
        
        if (q) {
            url += `&q=${encodeURIComponent(q)}`
        }
        
        const response = await fetch(url, {
            signal: AbortSignal.timeout(10000),
            next: { revalidate: 3600 }
        })

        if (!response.ok) {
            throw new Error(`Jikan API error: ${response.status}`)
        }

        const data = await response.json()
        const mappedData = (data.data || []).map((m: any) => ({ ...m, id: m.mal_id }))
        
        const pagination = data.pagination || {}
        
        return NextResponse.json({
            data: mappedData,
            pagination: {
                last_visible_page: pagination.last_visible_page || 1,
                has_next_page: pagination.has_next_page || false,
                current_page: pagination.current_page || pageNum,
                items: pagination.items || { count: mappedData.length, total: mappedData.length, per_page: limitNum },
            },
        })
    } catch (error: any) {
        console.warn('Jikan manga search API unavailable:', error.message)
        let filtered = TOP_MANGA_STATIC as any[]
        if (q) {
            const lq = q.toLowerCase()
            filtered = filtered.filter(m =>
                m.title.toLowerCase().includes(lq) ||
                (m.title_english && m.title_english.toLowerCase().includes(lq))
            )
        }

        // Apply pagination to static data
        const start = (pageNum - 1) * limitNum
        const paginatedFiltered = filtered.slice(start, start + limitNum)
        const hasNextPage = start + limitNum < filtered.length

        return NextResponse.json({
            data: paginatedFiltered,
            pagination: {
                last_visible_page: Math.ceil(filtered.length / limitNum),
                has_next_page: hasNextPage,
                current_page: pageNum,
                items: { count: paginatedFiltered.length, total: filtered.length, per_page: limitNum },
            },
            _fallback: true,
        })
    }
}
