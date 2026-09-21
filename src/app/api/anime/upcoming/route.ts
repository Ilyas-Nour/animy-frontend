export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { mapKitsuToAnime } from '@/lib/kitsu-mapper'
import { TOP_ANIME_STATIC } from '@/lib/static-anime-data'
import { anilistFetch, mapAniListToAnime } from '@/lib/anilist-client'

const KITSU_API = 'https://kitsu.io/api/edge'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '20'
    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    const offset = (pageNum - 1) * limitNum

    // 1. Try AniList first — more reliable than Kitsu for upcoming anime
    try {
        const query = `
            query($page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo { total perPage currentPage lastPage hasNextPage }
                    media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC) {
                        id idMal title { english romaji native } coverImage { extraLarge large medium color }
                        bannerImage format source episodes duration status meanScore popularity description
                        seasonYear season genres trailer { id site }
                        studios(isMain: true) { nodes { id name } }
                        startDate { year month day } endDate { year month day }
                    }
                }
            }
        `
        const data = await anilistFetch(query, { page: pageNum, perPage: limitNum })
        const mappedData = data.Page?.media?.map(mapAniListToAnime) || []
        const pageInfo = data.Page?.pageInfo || {}

        if (mappedData.length > 0) {
            return NextResponse.json({
                data: mappedData,
                pagination: {
                    last_visible_page: pageInfo.lastPage || 1,
                    has_next_page: pageInfo.hasNextPage || false,
                    current_page: pageInfo.currentPage || pageNum,
                    items: { count: mappedData.length, total: pageInfo.total || mappedData.length, per_page: limitNum },
                },
                _source: 'anilist',
            }, {
                headers: {
                    'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
                }
            })
        }
    } catch (anilistError: any) {
        console.warn('[upcoming] AniList failed, trying Kitsu:', anilistError.message)
    }

    // 2. Fallback: Kitsu API (already worked, keep as backup)
    try {
        const url = `${KITSU_API}/anime?filter[status]=upcoming&sort=startDate&page[limit]=${limitNum}&page[offset]=${offset}&include=mappings`

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(url, {
            headers: { 'Accept': 'application/vnd.api+json' },
            signal: controller.signal,
            cache: 'no-store',
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
            throw new Error(`Kitsu API error: ${response.status}`)
        }

        const json = await response.json()
        const mapped = mapKitsuToAnime(json.data, json.included)

        const totalCount = json.meta?.count || 0
        const hasNextPage = offset + limitNum < totalCount

        return NextResponse.json({
            data: mapped,
            pagination: {
                last_visible_page: Math.ceil(totalCount / limitNum),
                has_next_page: hasNextPage,
                current_page: pageNum,
                items: { count: mapped.length, total: totalCount, per_page: limitNum },
            },
            _source: 'kitsu',
        })
    } catch (kitsuError: any) {
        console.warn('[upcoming] Kitsu also failed, using static fallback:', kitsuError.message)
        return NextResponse.json({
            data: TOP_ANIME_STATIC.slice(0, limitNum),
            pagination: { last_visible_page: 1, has_next_page: false, current_page: 1 },
            _fallback: true,
        })
    }
}
