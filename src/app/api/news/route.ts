import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const ANINEWS_BASE = 'https://aninews.vercel.app/api'

/** Strip thumbnail query params to get full-resolution images */
function upgradeImageUrl(url: string | null): string | null {
    if (!url) return null
    try {
        const u = new URL(url)
        // Remove common thumbnail resize params
        u.searchParams.delete('w')
        u.searchParams.delete('h')
        u.searchParams.delete('crop')
        u.searchParams.delete('resize')
        u.searchParams.delete('fit')
        u.searchParams.delete('width')
        u.searchParams.delete('height')
        return u.toString()
    } catch {
        return url
    }
}

function processArticles(articles: any[]): any[] {
    return articles.map((a: any) => ({
        ...a,
        image: upgradeImageUrl(a.image)
    }))
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = searchParams.get('limit') || '20'
        const cursor = searchParams.get('cursor') || ''
        const source = searchParams.get('source') || ''
        const q = searchParams.get('q') || ''
        const from = searchParams.get('from') || ''
        const to = searchParams.get('to') || ''

        let url: string

        if (q) {
            const params = new URLSearchParams({ q, limit })
            if (from) params.set('from', from)
            if (to) params.set('to', to)
            url = `${ANINEWS_BASE}/search?${params.toString()}`
        } else {
            const params = new URLSearchParams({ limit })
            if (cursor) params.set('cursor', cursor)
            if (source) params.set('source', source)
            if (from) params.set('from', from)
            if (to) params.set('to', to)
            url = `${ANINEWS_BASE}/news?${params.toString()}`
        }

        const res = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 300 }
        })

        if (!res.ok) throw new Error(`AniNewsAPI responded with ${res.status}`)

        const data = await res.json()

        // Upgrade all image URLs to full resolution
        if (data.data && Array.isArray(data.data)) {
            data.data = processArticles(data.data)
        }

        return NextResponse.json(data)
    } catch (error: any) {
        console.error('[News API] Error:', error.message)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch news', data: [], meta: { total: 0, hasMore: false } },
            { status: 500 }
        )
    }
}
