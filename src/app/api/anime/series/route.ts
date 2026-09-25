export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { TOP_ANIME_STATIC } from '@/lib/static-anime-data'
import { anilistFetch, mapAniListToAnime } from '@/lib/anilist-client'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '24'
    
    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)

    try {
        const query = `
            query($page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo { total perPage currentPage lastPage hasNextPage }
                    media(type: ANIME, format: TV, sort: [POPULARITY_DESC]) {
                        id idMal title { english romaji native } coverImage { extraLarge large medium color }
                        format source episodes duration status meanScore popularity description
                        seasonYear season genres trailer { id site }
                        studios(isMain: true) { nodes { id name } }
                    }
                }
            }
        `
        const data = await anilistFetch(query, { page: pageNum, perPage: limitNum })
        const mappedData = data.Page?.media?.map(mapAniListToAnime) || []
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
        console.warn('AniList series API unavailable:', error.message)
        const tvSeries = TOP_ANIME_STATIC.filter(a => a.type === 'TV')
        const start = (pageNum - 1) * limitNum
        const paginated = tvSeries.slice(start, start + limitNum)
        return NextResponse.json({
            data: paginated,
            pagination: {
                last_visible_page: Math.ceil(tvSeries.length / limitNum),
                has_next_page: start + limitNum < tvSeries.length,
                current_page: pageNum,
                items: { count: paginated.length, total: tvSeries.length, per_page: limitNum },
            },
            _fallback: true,
        })
    }
}
