export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { anilistFetch, mapAniListToAnime, mapAniListToManga } from '@/lib/anilist-client'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const limit = searchParams.get('limit') || '5'
    const limitNum = Math.min(parseInt(limit, 10), 10)

    if (!q.trim()) {
        return NextResponse.json({ anime: [], manga: [] })
    }

    try {
        const query = `
            query($search: String, $limit: Int) {
                anime: Page(page: 1, perPage: $limit) {
                    media(type: ANIME, search: $search, sort: POPULARITY_DESC) {
                        id idMal title { english romaji native } coverImage { extraLarge large medium color }
                        format source episodes duration status meanScore popularity description
                        seasonYear season genres trailer { id site }
                        studios(isMain: true) { nodes { id name } }
                    }
                }
                manga: Page(page: 1, perPage: $limit) {
                    media(type: MANGA, search: $search, sort: POPULARITY_DESC) {
                        id idMal title { english romaji native } coverImage { extraLarge large medium color }
                        format chapters volumes status meanScore popularity description
                        startDate { year month day } endDate { year month day } genres
                    }
                }
            }
        `
        const variables = { search: q, limit: limitNum }
        const data = await anilistFetch(query, variables)

        const animeData = data.anime?.media?.map(mapAniListToAnime) || []
        const mangaData = data.manga?.media?.map(mapAniListToManga) || []

        return NextResponse.json({ anime: animeData, manga: mangaData })
    } catch (error: any) {
        console.error('[Global Search] Search error:', error.message)
        return NextResponse.json({ anime: [], manga: [] }, { status: 500 })
    }
}
