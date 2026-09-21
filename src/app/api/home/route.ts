export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { TOP_ANIME_STATIC, TOP_MANGA_STATIC } from '@/lib/static-anime-data'
import { anilistFetch, mapAniListToAnime, mapAniListToManga } from '@/lib/anilist-client'

// Jikan v4 API for currently-airing anime (real seasonal data)
async function fetchJikanCurrentSeason(limit = 20) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    try {
        const res = await fetch(`https://api.jikan.moe/v4/seasons/now?limit=${limit}`, {
            headers: { 'Accept': 'application/json' },
            signal: controller.signal,
            cache: 'no-store',
        })
        clearTimeout(timeoutId)
        if (!res.ok) return null
        const json = await res.json()
        // Map Jikan format to our Anime format
        return (json.data || []).slice(0, limit).map((item: any) => ({
            id: item.mal_id,
            mal_id: item.mal_id,
            title: item.title_english || item.title,
            title_english: item.title_english,
            title_japanese: item.title_japanese,
            images: item.images,
            bannerImage: null,
            type: item.type,
            episodes: item.episodes,
            status: item.status,
            airing: item.airing,
            aired: item.aired,
            duration: item.duration,
            score: item.score,
            scored_by: item.scored_by,
            rank: item.rank,
            popularity: item.popularity,
            synopsis: item.synopsis,
            genres: item.genres,
            year: item.year,
            season: item.season,
        }))
    } catch {
        clearTimeout(timeoutId)
        return null
    }
}

export async function GET(_req: NextRequest) {
    // Run AniList query and Jikan query in parallel — both can fail independently
    const anilistQuery = `
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

    const [anilistData, jikanData] = await Promise.allSettled([
        anilistFetch(anilistQuery),
        fetchJikanCurrentSeason(20),
    ])

    const anilist = anilistData.status === 'fulfilled' ? anilistData.value : null
    const jikanAiring = jikanData.status === 'fulfilled' ? jikanData.value : null

    if (anilistData.status === 'rejected') {
        console.error('[/api/home] AniList failed:', (anilistData as PromiseRejectedResult).reason?.message)
    }

    const popularAnime = anilist?.popularAnime?.media?.map(mapAniListToAnime) || TOP_ANIME_STATIC.slice(0, 20)
    const trendingAnime = anilist?.trendingAnime?.media?.map(mapAniListToAnime) || TOP_ANIME_STATIC.slice(0, 10)
    const upcomingAnime = anilist?.upcomingAnime?.media?.map(mapAniListToAnime) || []
    // Use Jikan for real currently-airing seasonal anime (much more accurate)
    const recentEpisodes = jikanAiring || anilist?.topManga?.media?.map(mapAniListToAnime) || TOP_ANIME_STATIC.slice(0, 20)
    const topManga = anilist?.topManga?.media?.map(mapAniListToManga) || TOP_MANGA_STATIC.slice(0, 20)
    const publishingManga = anilist?.publishingManga?.media?.map(mapAniListToManga) || TOP_MANGA_STATIC.slice(0, 20)

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
            _source: anilist ? 'anilist' : 'fallback',
        },
        {
            headers: {
                // Cloudflare Workers natively respects Cache-Control (unlike next:{revalidate})
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
            },
        }
    )
}
