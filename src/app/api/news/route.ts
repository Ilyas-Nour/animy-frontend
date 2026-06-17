import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const ANINEWS_BASE = 'https://aninews.vercel.app/api'

/**
 * Upgrade any image URL to its highest-quality version by:
 * 1. Removing common query-string resize params (w, h, crop, resize, etc.)
 * 2. Removing MAL-style path-based resize prefixes (/r/WxH/)
 * 3. Removing WordPress-style filename dimension suffixes (-150x150.jpg)
 */
function upgradeImageUrl(url: string | null): string | null {
    if (!url) return null
    try {
        let u = new URL(url)

        // ── 1. Strip query-string thumbnail params ──────────────────────
        const removeParams = ['w', 'h', 'crop', 'resize', 'fit', 'width', 'height', 'size', 'quality', 's']
        // Keep 's' only for MAL (it's a signature, not a size) — actually remove it to get full image
        removeParams.forEach(p => u.searchParams.delete(p))

        // ── 2. MAL CDN: remove /r/WxH/ path segment ─────────────────────
        // e.g. cdn.myanimelist.net/r/100x156/s/common/... → cdn.myanimelist.net/s/common/...
        const malResizePattern = /\/r\/\d+x\d+\//
        if (malResizePattern.test(u.pathname)) {
            u.pathname = u.pathname.replace(malResizePattern, '/')
        }

        // ── 3. WordPress: remove -WxH suffix before extension ───────────
        // e.g. image-300x200.jpg → image.jpg
        u.pathname = u.pathname.replace(/-\d+x\d+(\.[a-zA-Z]+)$/, '$1')

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

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 6000)

        const res = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            cache: 'no-store',
            signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!res.ok) throw new Error(`AniNewsAPI responded with ${res.status}`)

        const data = await res.json()

        // Upgrade all image URLs to full resolution
        if (data.data && Array.isArray(data.data)) {
            data.data = processArticles(data.data)
        }

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300'
            }
        })
    } catch (error: any) {
        console.error('[News API] Error:', error.message)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch news', data: [], meta: { total: 0, hasMore: false } },
            { status: 500 }
        )
    }
}
