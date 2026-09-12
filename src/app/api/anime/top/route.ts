export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { mapKitsuToAnime } from '@/lib/kitsu-mapper'
import { TOP_ANIME_STATIC } from '@/lib/static-anime-data'

const KITSU_API = 'https://kitsu.io/api/edge'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'airing'
    const limit = searchParams.get('limit') || '20'
    const limitNum = parseInt(limit, 10)

    // Map filter to Kitsu sort / status
    let kitsuSort = '-averageRating'
    let kitsuStatusFilter = ''

    if (filter === 'airing') {
        kitsuStatusFilter = '&filter[status]=current'
    } else if (filter === 'upcoming') {
        kitsuStatusFilter = '&filter[status]=upcoming'
    } else if (filter === 'bypopularity') {
        kitsuSort = '-userCount'
    }

    try {
        const url = `${KITSU_API}/anime?sort=${kitsuSort}${kitsuStatusFilter}&page[limit]=${limitNum}&page[offset]=0&include=mappings`

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(url, {
            headers: { 'Accept': 'application/vnd.api+json' },
            signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
            throw new Error(`Kitsu API error: ${response.status}`)
        }

        const json = await response.json()
        const mapped = mapKitsuToAnime(json.data, json.included)

        return NextResponse.json({ data: mapped })
    } catch (error: any) {
        console.warn('[Top Anime] Kitsu failed, using static fallback:', error.message)
        // Return static data in the same shape as Kitsu
        const staticData = TOP_ANIME_STATIC.slice(0, limitNum)
        return NextResponse.json({ data: staticData, _fallback: true })
    }
}
