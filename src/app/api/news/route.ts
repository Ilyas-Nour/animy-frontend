import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface NewsItem {
    title: string
    slug: string
    source: string
    excerpt: string
    date: string
    image: string | null
    link: string
    tags: string[]
}

// ─────────────────────────────────────────────────────────
// Image URL Upgrader
// ─────────────────────────────────────────────────────────
function upgradeImageUrl(url: string | null | undefined): string | null {
    if (!url) return null
    try {
        let u = new URL(url)
        const removeParams = ['w', 'h', 'crop', 'resize', 'fit', 'width', 'height', 'size', 's']
        removeParams.forEach(p => u.searchParams.delete(p))
        const malResizePattern = /\/r\/\d+x\d+\//
        if (malResizePattern.test(u.pathname)) {
            u.pathname = u.pathname.replace(malResizePattern, '/')
        }
        u.pathname = u.pathname.replace(/-\d+x\d+(\.[a-zA-Z]+)$/, '$1')
        return u.toString()
    } catch {
        return url
    }
}

// ─────────────────────────────────────────────────────────
// Slug generator
// ─────────────────────────────────────────────────────────
function toSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 80)
}

// ─────────────────────────────────────────────────────────
// XML parser helpers (Edge-compatible, no DOMParser needed)
// ─────────────────────────────────────────────────────────
function extractTag(xml: string, tag: string): string {
    const pattern = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, 'i')
    const m = xml.match(pattern)
    return m ? m[1].trim() : ''
}

function stripHtml(html: string): string {
    return html
        .replace(/<[^>]+>/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
}

function extractImageFromContent(content: string): string | null {
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i)
    if (imgMatch) return imgMatch[1]
    const mediaMatch = content.match(/url=["']([^"']+\.(?:jpg|jpeg|png|webp|gif))["']/i)
    if (mediaMatch) return mediaMatch[1]
    return null
}

function parseRssItems(xml: string): Array<{title: string, link: string, pubDate: string, description: string, content: string, enclosure: string | null, mediaThumbnail: string | null}> {
    // Split on <item> boundaries
    const items: Array<{title: string, link: string, pubDate: string, description: string, content: string, enclosure: string | null, mediaThumbnail: string | null}> = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi
    let match
    while ((match = itemRegex.exec(xml)) !== null) {
        const itemXml = match[1]
        const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image/i)
        const mediaThumbMatch = itemXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i) || itemXml.match(/<media:content[^>]+url=["']([^"']+)["'][^>]*type=["']image/i)
        
        items.push({
            title: extractTag(itemXml, 'title'),
            link: extractTag(itemXml, 'link') || itemXml.match(/<link>([^<]*)<\/link>/)?.[1] || '',
            pubDate: extractTag(itemXml, 'pubDate'),
            description: extractTag(itemXml, 'description'),
            content: extractTag(itemXml, 'content:encoded') || extractTag(itemXml, 'content'),
            enclosure: enclosureMatch ? enclosureMatch[1] : null,
            mediaThumbnail: mediaThumbMatch ? mediaThumbMatch[1] : null,
        })
    }
    return items
}

// ─────────────────────────────────────────────────────────
// Source Fetchers
// ─────────────────────────────────────────────────────────

async function fetchANN(): Promise<NewsItem[]> {
    try {
        const res = await fetch('https://www.animenewsnetwork.com/all/rss.xml?ann-edition=us', {
            headers: { 'User-Agent': 'Mozilla/5.0 Animy/1.0 RSS Reader' },
            signal: AbortSignal.timeout(8000),
        })
        if (!res.ok) throw new Error(`ANN: ${res.status}`)
        const xml = await res.text()
        const items = parseRssItems(xml)
        return items.slice(0, 30).map(item => {
            const imgFromContent = extractImageFromContent(item.description + item.content)
            return {
                title: stripHtml(item.title),
                slug: toSlug(item.title),
                source: 'Anime News Network',
                excerpt: stripHtml(item.description).slice(0, 200),
                date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                image: upgradeImageUrl(item.enclosure || item.mediaThumbnail || imgFromContent),
                link: item.link,
                tags: ['anime', 'news'],
            }
        }).filter(i => i.title && i.link)
    } catch (e: any) {
        console.warn('[News] ANN failed:', e.message)
        return []
    }
}

async function fetchCrunchyroll(): Promise<NewsItem[]> {
    try {
        const res = await fetch('https://www.crunchyroll.com/newsrss', {
            headers: { 'User-Agent': 'Mozilla/5.0 Animy/1.0 RSS Reader' },
            signal: AbortSignal.timeout(8000),
        })
        if (!res.ok) throw new Error(`CR: ${res.status}`)
        const xml = await res.text()
        const items = parseRssItems(xml)
        return items.slice(0, 20).map(item => {
            const imgFromContent = extractImageFromContent(item.description + item.content)
            return {
                title: stripHtml(item.title),
                slug: toSlug(item.title),
                source: 'Crunchyroll',
                excerpt: stripHtml(item.description).slice(0, 200),
                date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                image: upgradeImageUrl(item.enclosure || item.mediaThumbnail || imgFromContent),
                link: item.link,
                tags: ['anime', 'streaming'],
            }
        }).filter(i => i.title && i.link)
    } catch (e: any) {
        console.warn('[News] Crunchyroll RSS failed:', e.message)
        return []
    }
}

async function fetchAnimeCorner(): Promise<NewsItem[]> {
    try {
        const res = await fetch('https://animecorner.me/feed/', {
            headers: { 'User-Agent': 'Mozilla/5.0 Animy/1.0 RSS Reader' },
            signal: AbortSignal.timeout(8000),
        })
        if (!res.ok) throw new Error(`AnimeCorner: ${res.status}`)
        const xml = await res.text()
        const items = parseRssItems(xml)
        return items.slice(0, 20).map(item => {
            const imgFromContent = extractImageFromContent(item.description + item.content)
            return {
                title: stripHtml(item.title),
                slug: toSlug(item.title),
                source: 'Anime Corner',
                excerpt: stripHtml(item.description).slice(0, 200),
                date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                image: upgradeImageUrl(item.enclosure || item.mediaThumbnail || imgFromContent),
                link: item.link,
                tags: ['anime', 'rankings'],
            }
        }).filter(i => i.title && i.link)
    } catch (e: any) {
        console.warn('[News] AnimeCorner failed:', e.message)
        return []
    }
}

async function fetchMALNews(): Promise<NewsItem[]> {
    try {
        const res = await fetch('https://myanimelist.net/rss/news.xml', {
            headers: { 'User-Agent': 'Mozilla/5.0 Animy/1.0 RSS Reader' },
            signal: AbortSignal.timeout(8000),
        })
        if (!res.ok) throw new Error(`MAL: ${res.status}`)
        const xml = await res.text()
        const items = parseRssItems(xml)
        return items.slice(0, 20).map(item => {
            const imgFromContent = extractImageFromContent(item.description + item.content)
            return {
                title: stripHtml(item.title),
                slug: toSlug(item.title),
                source: 'MyAnimeList',
                excerpt: stripHtml(item.description).slice(0, 200),
                date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                image: upgradeImageUrl(item.enclosure || item.mediaThumbnail || imgFromContent),
                link: item.link,
                tags: ['anime', 'manga'],
            }
        }).filter(i => i.title && i.link)
    } catch (e: any) {
        console.warn('[News] MAL News failed:', e.message)
        return []
    }
}

async function fetchMangaNews(): Promise<NewsItem[]> {
    try {
        // Manga Plus / MangaUpdates community news via alternative feed
        const res = await fetch('https://comicbook.com/category/anime/feed/', {
            headers: { 'User-Agent': 'Mozilla/5.0 Animy/1.0 RSS Reader' },
            signal: AbortSignal.timeout(8000),
        })
        if (!res.ok) throw new Error(`ComicBook: ${res.status}`)
        const xml = await res.text()
        const items = parseRssItems(xml)
        return items.slice(0, 15).map(item => {
            const imgFromContent = extractImageFromContent(item.description + item.content)
            return {
                title: stripHtml(item.title),
                slug: toSlug(item.title),
                source: 'ComicBook Anime',
                excerpt: stripHtml(item.description).slice(0, 200),
                date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                image: upgradeImageUrl(item.enclosure || item.mediaThumbnail || imgFromContent),
                link: item.link,
                tags: ['anime', 'manga'],
            }
        }).filter(i => i.title && i.link)
    } catch (e: any) {
        console.warn('[News] ComicBook Anime failed:', e.message)
        return []
    }
}

// ─────────────────────────────────────────────────────────
// Merge, deduplicate, sort
// ─────────────────────────────────────────────────────────
function mergeAndSort(allItems: NewsItem[]): NewsItem[] {
    const seen = new Set<string>()
    return allItems
        .filter(item => {
            const key = item.slug
            if (seen.has(key)) return false
            seen.add(key)
            return true
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// ─────────────────────────────────────────────────────────
// GET handler
// ─────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)
        const source = searchParams.get('source') || ''
        const q = searchParams.get('q') || ''
        const imagesOnly = searchParams.get('imagesOnly') === 'true'
        const cursor = parseInt(searchParams.get('cursor') || '0', 10)

        // Fetch from all sources in parallel
        const [ann, cr, ac, mal, manga] = await Promise.allSettled([
            fetchANN(),
            fetchCrunchyroll(),
            fetchAnimeCorner(),
            fetchMALNews(),
            fetchMangaNews(),
        ])

        const allItems = [
            ...(ann.status === 'fulfilled' ? ann.value : []),
            ...(cr.status === 'fulfilled' ? cr.value : []),
            ...(ac.status === 'fulfilled' ? ac.value : []),
            ...(mal.status === 'fulfilled' ? mal.value : []),
            ...(manga.status === 'fulfilled' ? manga.value : []),
        ]

        let merged = mergeAndSort(allItems)

        // Filter by image presence if requested
        if (imagesOnly) {
            merged = merged.filter(i => !!i.image)
        }

        // Filter by source
        if (source && source !== 'all') {
            const sourceMap: Record<string, string> = {
                ann: 'Anime News Network',
                crunchyroll: 'Crunchyroll',
                animecorner: 'Anime Corner',
                myanimelist: 'MyAnimeList',
                comicbook: 'ComicBook Anime',
            }
            const fullSourceName = sourceMap[source]
            if (fullSourceName) {
                merged = merged.filter(i => i.source === fullSourceName)
            }
        }

        // Filter by search query
        if (q) {
            const lower = q.toLowerCase()
            merged = merged.filter(i =>
                i.title.toLowerCase().includes(lower) ||
                i.excerpt.toLowerCase().includes(lower) ||
                i.tags.some(t => t.includes(lower))
            )
        }

        // Paginate
        const total = merged.length
        const offset = cursor || 0
        const page = merged.slice(offset, offset + limit)
        const nextOffset = offset + limit
        const hasMore = nextOffset < total

        return NextResponse.json({
            success: true,
            data: page,
            meta: {
                total,
                returned: page.length,
                hasMore,
                nextCursor: hasMore ? nextOffset : undefined,
            }
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            }
        })
    } catch (error: any) {
        console.error('[News API] Fatal error:', error.message)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch news', data: [], meta: { total: 0, hasMore: false } },
            { status: 500 }
        )
    }
}
