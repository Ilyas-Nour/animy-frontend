export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { mapMangaDexToManga } from '@/lib/mangadex-mapper'
import { TOP_MANGA_STATIC } from '@/lib/static-anime-data'

const MANGADEX_API = 'https://api.mangadex.org'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || searchParams.get('query') || ''
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '24'

    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    const offset = (pageNum - 1) * limitNum

    try {
        let url = `${MANGADEX_API}/manga?limit=${limitNum}&offset=${offset}&includes[]=cover_art`
        
        if (q) {
            url += `&title=${encodeURIComponent(q)}`
        }
        
        const response = await fetch(url, {
            signal: AbortSignal.timeout(10000),
            next: { revalidate: 3600 }
        })

        if (!response.ok) {
            throw new Error(`MangaDex API error: ${response.status}`)
        }

        const data = await response.json()
        const mappedData = mapMangaDexToManga(data.data)
        
        const totalCount = data.total || 1000
        const hasNextPage = offset + limitNum < totalCount

        return NextResponse.json({
            data: mappedData,
            pagination: {
                last_visible_page: Math.ceil(totalCount / limitNum),
                has_next_page: hasNextPage,
                current_page: pageNum,
                items: { count: mappedData.length, total: totalCount, per_page: limitNum },
            },
        })
    } catch (error: any) {
        console.warn('MangaDex search API unavailable:', error.message)
        let filtered = TOP_MANGA_STATIC as any[]
        if (q) {
            const lq = q.toLowerCase()
            filtered = filtered.filter(m =>
                m.title.toLowerCase().includes(lq) ||
                (m.title_english && m.title_english.toLowerCase().includes(lq))
            )
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
