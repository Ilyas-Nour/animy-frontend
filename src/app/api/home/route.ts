export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { TOP_ANIME_STATIC, TOP_MANGA_STATIC } from '@/lib/static-anime-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1';

async function fetchAniListHomeFallback() {
    const query = `
      query {
        trendingAnime: Page(page: 1, perPage: 15) {
          media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
            id
            title { english romaji native }
            coverImage { extraLarge large medium color }
            bannerImage
            description
            averageScore
            format
            episodes
            status
            genres
            startDate { year month day }
          }
        }
        popularAnime: Page(page: 1, perPage: 20) {
          media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
            id
            title { english romaji native }
            coverImage { extraLarge large medium color }
            bannerImage
            description
            averageScore
            format
            episodes
            status
            genres
            startDate { year month day }
          }
        }
        upcomingAnime: Page(page: 1, perPage: 15) {
          media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC, isAdult: false) {
            id
            title { english romaji native }
            coverImage { extraLarge large medium color }
            bannerImage
            description
            averageScore
            format
            episodes
            status
            genres
            startDate { year month day }
          }
        }
        topManga: Page(page: 1, perPage: 15) {
          media(type: MANGA, sort: POPULARITY_DESC, isAdult: false) {
            id
            title { english romaji native }
            coverImage { extraLarge large medium color }
            description
            averageScore
            format
            chapters
            status
            genres
          }
        }
        publishingManga: Page(page: 1, perPage: 15) {
          media(type: MANGA, status: RELEASING, sort: POPULARITY_DESC, isAdult: false) {
            id
            title { english romaji native }
            coverImage { extraLarge large medium color }
            description
            averageScore
            format
            chapters
            status
            genres
          }
        }
      }
    `;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        cache: 'no-store',
        signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`AniList returned ${res.status}`);
    const json = await res.json();
    const data = json.data;

    const mapMedia = (m: any) => ({
        id: m.id,
        mal_id: m.id,
        title: m.title?.english || m.title?.romaji || m.title?.native,
        title_english: m.title?.english,
        title_japanese: m.title?.native,
        images: {
            jpg: { image_url: m.coverImage?.large, large_image_url: m.coverImage?.extraLarge || m.coverImage?.large },
            webp: { image_url: m.coverImage?.large, large_image_url: m.coverImage?.extraLarge || m.coverImage?.large }
        },
        bannerImage: m.bannerImage,
        synopsis: m.description ? m.description.replace(/<[^>]*>?/gm, '') : '',
        score: m.averageScore ? m.averageScore / 10 : undefined,
        type: m.format,
        episodes: m.episodes,
        chapters: m.chapters,
        status: m.status,
        genres: m.genres?.map((g: string, i: number) => ({ mal_id: i, name: g })) || []
    });

    return {
        popularAnime: data.popularAnime?.media?.map(mapMedia) || [],
        trendingAnime: data.trendingAnime?.media?.map(mapMedia) || [],
        upcomingAnime: data.upcomingAnime?.media?.map(mapMedia) || [],
        recentEpisodes: data.trendingAnime?.media?.map(mapMedia) || [],
        topManga: data.topManga?.media?.map(mapMedia) || [],
        publishingManga: data.publishingManga?.media?.map(mapMedia) || []
    };
}

export async function GET(_req: NextRequest) {
    // 1. Try Backend with strict 4s timeout
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(`${API_URL}/home`, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const json = await res.json();
            const data = json.data || json;

            if (data && (data.popularAnime?.length || data.topManga?.length)) {
                return NextResponse.json({
                    success: true,
                    data: {
                        popularAnime: data.popularAnime?.length ? data.popularAnime : TOP_ANIME_STATIC.slice(0, 20),
                        trendingAnime: data.trendingAnime?.length ? data.trendingAnime : TOP_ANIME_STATIC.slice(0, 10),
                        upcomingAnime: data.upcomingAnime?.length ? data.upcomingAnime : TOP_ANIME_STATIC.slice(10, 20),
                        recentEpisodes: data.recentEpisodes?.length ? data.recentEpisodes : (data.popularAnime?.length ? data.popularAnime : TOP_ANIME_STATIC.slice(0, 20)),
                        topManga: data.topManga?.length ? data.topManga : TOP_MANGA_STATIC.slice(0, 20),
                        publishingManga: data.publishingManga?.length ? data.publishingManga : TOP_MANGA_STATIC.slice(0, 20),
                    },
                    _source: 'backend',
                }, {
                    headers: {
                        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
                    }
                });
            }
        }
    } catch (backendErr) {
        console.warn('Backend home fetch failed or timed out, trying AniList fallback...');
    }

    // 2. Fast AniList GraphQL Fallback (~1s)
    try {
        const liveFallback = await fetchAniListHomeFallback();
        if (liveFallback.popularAnime?.length || liveFallback.topManga?.length) {
            return NextResponse.json({
                success: true,
                data: liveFallback,
                _source: 'anilist-live',
            }, {
                headers: {
                    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
                }
            });
        }
    } catch (aniListErr) {
        console.warn('AniList live home fallback failed, using static data...');
    }

    // 3. Guaranteed Static Fallback (0ms, 100% reliable)
    return NextResponse.json({
        success: true,
        data: {
            popularAnime: TOP_ANIME_STATIC.slice(0, 20),
            trendingAnime: TOP_ANIME_STATIC.slice(0, 10),
            upcomingAnime: TOP_ANIME_STATIC.slice(10, 20),
            recentEpisodes: TOP_ANIME_STATIC.slice(0, 20),
            topManga: TOP_MANGA_STATIC.slice(0, 20),
            publishingManga: TOP_MANGA_STATIC.slice(0, 20),
        },
        _source: 'static',
    }, {
        headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
        }
    });
}
