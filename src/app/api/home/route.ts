export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { mapKitsuToAnime } from '@/lib/kitsu-mapper'
import { TOP_ANIME_STATIC, HERO_SPOTLIGHT_ANIME } from '@/lib/static-anime-data'

const KITSU_API = 'https://kitsu.io/api/edge'

async function kitsuFetch(path: string, timeout = 8000): Promise<any | null> {
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    const res = await fetch(`${KITSU_API}${path}`, {
      headers: { 'Accept': 'application/vnd.api+json' },
      signal: controller.signal,
    })
    clearTimeout(id)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function GET(_req: NextRequest) {
  try {
    // Run all Kitsu fetches in parallel
    const [
      popularJson,
      trendingJson,
      upcomingJson,
      airingJson,
    ] = await Promise.all([
      kitsuFetch('/anime?sort=-userCount&page[limit]=20&include=mappings'),
      kitsuFetch('/anime?sort=-ratingFrequency&filter[status]=current&page[limit]=10&include=mappings'),
      kitsuFetch('/anime?filter[status]=upcoming&sort=startDate&page[limit]=20&include=mappings'),
      kitsuFetch('/anime?filter[status]=current&sort=-averageRating&page[limit]=20&include=mappings'),
    ])

    const popularAnime = popularJson ? mapKitsuToAnime(popularJson.data, popularJson.included) : TOP_ANIME_STATIC.slice(0, 20)
    const trendingAnime = trendingJson ? mapKitsuToAnime(trendingJson.data, trendingJson.included) : TOP_ANIME_STATIC.slice(0, 10)
    const upcomingAnime = upcomingJson ? mapKitsuToAnime(upcomingJson.data, upcomingJson.included) : []
    const recentEpisodes = airingJson ? mapKitsuToAnime(airingJson.data, airingJson.included) : TOP_ANIME_STATIC.slice(0, 20)

    return NextResponse.json(
      {
        success: true,
        data: {
          popularAnime,
          trendingAnime,
          upcomingAnime,
          recentEpisodes,
          // Manga comes from a separate route since Kitsu manga requires different handling
          topManga: [],
          publishingManga: [],
        },
        _source: 'kitsu',
      },
      {
        headers: {
          // Cache for 5 minutes at CDN edge, serve stale for up to 1 hour while revalidating
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        },
      }
    )
  } catch (error: any) {
    console.error('[/api/home] Error:', error)
    // Static fallback — site still works even if Kitsu is down
    return NextResponse.json(
      {
        success: true,
        data: {
          popularAnime: TOP_ANIME_STATIC.slice(0, 20),
          trendingAnime: TOP_ANIME_STATIC.slice(0, 10),
          upcomingAnime: [],
          recentEpisodes: TOP_ANIME_STATIC.slice(0, 20),
          topManga: [],
          publishingManga: [],
        },
        _source: 'static_fallback',
      }
    )
  }
}
