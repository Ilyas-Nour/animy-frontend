export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { TOP_ANIME_STATIC } from '@/lib/static-anime-data'

// Proxy to Jikan directly (bypasses backend that depends on AniList)
const JIKAN_API = 'https://api.jikan.moe/v4'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || searchParams.get('query') || ''
    const order_by = searchParams.get('order_by') || 'score'
    const sort = searchParams.get('sort') || 'desc'
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
            url = `${JIKAN_API}/anime?${queryParams.toString()}`
        } else {
            // Top anime endpoint
            const queryParams = new URLSearchParams()
            queryParams.set('page', page)
            queryParams.set('limit', limit)
            if (type) queryParams.set('type', type.toLowerCase())
            if (status) queryParams.set('filter', status.toLowerCase())
            // Map order_by to Jikan filter if relevant
            url = `${JIKAN_API}/top/anime?${queryParams.toString()}`
        }

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
            throw new Error(`Jikan API error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json({
            data: data.data || [],
            pagination: data.pagination || null,
        })
    } catch (error: any) {
        console.warn('Anime search API unavailable, using static fallback:', error.message)

        // Filter static data based on query and type
        let filtered = TOP_ANIME_STATIC
        if (q) {
            const lq = q.toLowerCase()
            filtered = filtered.filter(a =>
                a.title.toLowerCase().includes(lq) ||
                a.title_english.toLowerCase().includes(lq)
            )
        }
        if (type) {
            filtered = filtered.filter(a => a.type.toLowerCase() === type.toLowerCase())
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

