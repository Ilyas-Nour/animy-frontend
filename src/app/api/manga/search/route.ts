export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { TOP_MANGA_STATIC } from '@/lib/static-anime-data'
import { anilistFetch, mapAniListToManga } from '@/lib/anilist-client'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || searchParams.get('query') || ''
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '24'

    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)

    try {
        const query = `
            query($search: String, $page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo { total perPage currentPage lastPage hasNextPage }
                    media(type: MANGA, search: $search, sort: POPULARITY_DESC) {
                        id idMal title { english romaji native } coverImage { extraLarge large medium color }
                        format chapters volumes status meanScore popularity description
                        startDate { year month day } endDate { year month day } genres
                    }
                }
            }
        `
        const variables: any = { page: pageNum, perPage: limitNum }
        if (q) variables.search = q
        
        const data = await anilistFetch(query, variables)
        const mappedData = data.Page?.media?.map(mapAniListToManga) || []
        const pageInfo = data.Page?.pageInfo || {}
        
        return NextResponse.json({
            data: mappedData,
            pagination: {
                last_visible_page: pageInfo.lastPage || 1,
                has_next_page: pageInfo.hasNextPage || false,
                current_page: pageInfo.currentPage || pageNum,
                items: { count: mappedData.length, total: pageInfo.total || mappedData.length, per_page: limitNum },
            },
        })
    } catch (error: any) {
        console.warn('AniList manga search API unavailable:', error.message)
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
