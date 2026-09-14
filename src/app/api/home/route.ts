export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { TOP_ANIME_STATIC, HERO_SPOTLIGHT_ANIME, TOP_MANGA_STATIC } from '@/lib/static-anime-data'
import { anilistFetch, mapAniListToAnime, mapAniListToManga } from '@/lib/anilist-client'

export async function GET(_req: NextRequest) {
  try {
    const query = `
      query {
        popularAnime: Page(page: 1, perPage: 20) {
          media(type: ANIME, sort: POPULARITY_DESC) { ...mediaFields }
        }
        trendingAnime: Page(page: 1, perPage: 10) {
          media(type: ANIME, sort: TRENDING_DESC) { ...mediaFields }
        }
        upcomingAnime: Page(page: 1, perPage: 20) {
          media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC) { ...mediaFields }
        }
        airingAnime: Page(page: 1, perPage: 20) {
          media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) { ...mediaFields }
        }
        topManga: Page(page: 1, perPage: 20) {
          media(type: MANGA, sort: POPULARITY_DESC) { ...mediaFields }
        }
        publishingManga: Page(page: 1, perPage: 20) {
          media(type: MANGA, status: RELEASING, sort: POPULARITY_DESC) { ...mediaFields }
        }
      }
      fragment mediaFields on Media {
        id idMal title { english romaji native } coverImage { extraLarge large medium color }
        bannerImage format source episodes duration status meanScore popularity description
        seasonYear season genres trailer { id site }
        studios(isMain: true) { nodes { id name } }
        chapters volumes startDate { year month day } endDate { year month day }
      }
    `
    const data = await anilistFetch(query)

    const popularAnime = data.popularAnime?.media?.map(mapAniListToAnime) || TOP_ANIME_STATIC.slice(0, 20)
    const trendingAnime = data.trendingAnime?.media?.map(mapAniListToAnime) || TOP_ANIME_STATIC.slice(0, 10)
    const upcomingAnime = data.upcomingAnime?.media?.map(mapAniListToAnime) || []
    const recentEpisodes = data.airingAnime?.media?.map(mapAniListToAnime) || TOP_ANIME_STATIC.slice(0, 20)
    const topManga = data.topManga?.media?.map(mapAniListToManga) || TOP_MANGA_STATIC.slice(0, 20)
    const publishingManga = data.publishingManga?.media?.map(mapAniListToManga) || TOP_MANGA_STATIC.slice(0, 20)

    return NextResponse.json(
      {
        success: true,
        data: {
          popularAnime,
          trendingAnime,
          upcomingAnime,
          recentEpisodes,
          topManga,
          publishingManga,
        },
        _source: 'anilist',
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
          topManga: TOP_MANGA_STATIC.slice(0, 20),
          publishingManga: TOP_MANGA_STATIC.slice(0, 20),
        },
        _source: 'static_fallback',
      }
    )
  }
}
