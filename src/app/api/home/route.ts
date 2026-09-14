export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { TOP_ANIME_STATIC, HERO_SPOTLIGHT_ANIME } from '@/lib/static-anime-data'

const JIKAN_API = 'https://api.jikan.moe/v4'

async function jikanFetch(path: string, timeout = 8000): Promise<any | null> {
  try {
    const res = await fetch(`${JIKAN_API}${path}`, {
      signal: AbortSignal.timeout(timeout),
      next: { revalidate: 3600 }
    })
    if (!res.ok) return null
    const json = await res.json()
    return { data: (json.data || []).map((a: any) => ({ ...a, id: a.mal_id })) }
  } catch {
    return null
  }
}

export async function GET(_req: NextRequest) {
  try {
    // Run all fetches in parallel
    const [
      popularJson,
      trendingJson,
      upcomingJson,
      airingJson,
    ] = await Promise.all([
      jikanFetch('/top/anime?filter=bypopularity&limit=20'),
      jikanFetch('/top/anime?filter=airing&limit=10'),
      jikanFetch('/seasons/upcoming?limit=20'),
      jikanFetch('/seasons/now?limit=20'),
    ])

    const popularAnime = popularJson ? popularJson.data : TOP_ANIME_STATIC.slice(0, 20)
    const trendingAnime = trendingJson ? trendingJson.data : TOP_ANIME_STATIC.slice(0, 10)
    const upcomingAnime = upcomingJson ? upcomingJson.data : []
    const recentEpisodes = airingJson ? airingJson.data : TOP_ANIME_STATIC.slice(0, 20)

    return NextResponse.json(
      {
        success: true,
        data: {
          popularAnime,
          trendingAnime,
          upcomingAnime,
          recentEpisodes,
          topManga: [],
          publishingManga: [],
        },
        _source: 'jikan',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        },
      }
    )
  } catch (error: any) {
    console.error('[/api/home] Error:', error)
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
