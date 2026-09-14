export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { TOP_ANIME_STATIC } from '@/lib/static-anime-data'
import { anilistFetch, mapAniListToAnime } from '@/lib/anilist-client'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ year: string, season: string }> }
) {
    const { year, season } = await params
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '24'

    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)

    try {
        const query = `
            query($page: Int, $perPage: Int, $seasonYear: Int, $season: MediaSeason) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo { total perPage currentPage lastPage hasNextPage }
                    media(type: ANIME, seasonYear: $seasonYear, season: $season, sort: POPULARITY_DESC) {
                        id idMal title { english romaji native } coverImage { extraLarge large medium color }
                        format source episodes duration status meanScore popularity description
                        seasonYear season genres trailer { id site }
                        studios(isMain: true) { nodes { id name } }
                    }
                }
            }
        `
        const variables = {
            page: pageNum,
            perPage: limitNum,
            seasonYear: parseInt(year, 10),
            season: season.toUpperCase()
        }
        
        const data = await anilistFetch(query, variables)
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
        console.warn('AniList seasons API unavailable:', error.message)
        const start = (pageNum - 1) * limitNum
        const paginated = TOP_ANIME_STATIC.slice(start, start + limitNum)
        return NextResponse.json({
            data: paginated,
            pagination: {
                last_visible_page: Math.ceil(TOP_ANIME_STATIC.length / limitNum),
                has_next_page: start + limitNum < TOP_ANIME_STATIC.length,
                current_page: pageNum,
                items: { count: paginated.length, total: TOP_ANIME_STATIC.length, per_page: limitNum },
            },
            _fallback: true,
        })
    }
}
