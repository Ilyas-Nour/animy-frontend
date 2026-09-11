export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { TOP_MANGA_STATIC } from '@/lib/static-anime-data'

const JIKAN_API = 'https://api.jikan.moe/v4'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || searchParams.get('query') || ''
    const limit = searchParams.get('limit') || '24'
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const page = searchParams.get('page') || '1'

    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        let url: string
        if (q) {
            // Search endpoint
            const queryParams = new URLSearchParams()
            queryParams.set('q', q)
            queryParams.set('page', page)
            queryParams.set('limit', limit)
            if (type) queryParams.set('type', type.toLowerCase())
            if (status) queryParams.set('status', status.toLowerCase())
            queryParams.set('sfw', 'true')
            url = `${JIKAN_API}/manga?${queryParams.toString()}`
        } else {
            // Top manga endpoint
            const queryParams = new URLSearchParams()
            queryParams.set('page', page)
            queryParams.set('limit', limit)
            if (type) queryParams.set('type', type.toLowerCase())
            if (status) queryParams.set('filter', status.toLowerCase())
            url = `${JIKAN_API}/top/manga?${queryParams.toString()}`
        }

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
            console.error(`[PROXY ERROR] Manga search backend status: ${response.status}`)
            throw new Error(`Jikan API error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json({
            data: data.data || [],
            pagination: data.pagination || null,
        })
    } catch (error: any) {
        console.warn('Manga search API unavailable, using static fallback:', error.message)

        // Filter static data based on query and type
        let filtered = TOP_MANGA_STATIC as any[]
        if (q) {
            const lq = q.toLowerCase()
            filtered = filtered.filter(m =>
                m.title.toLowerCase().includes(lq) ||
                m.title_english.toLowerCase().includes(lq)
            )
        }
        if (type) {
            filtered = filtered.filter(m => m.type?.toLowerCase() === type.toLowerCase())
        }

        return NextResponse.json({
            data: filtered,
            pagination: {
                last_visible_page: 1,
                has_next_page: false,
                current_page: 1,
                items: { count: filtered.length, total: filtered.length, per_page: filtered.length },
            },
            _fallback: true,
        })
    }
}

