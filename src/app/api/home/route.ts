export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { TOP_ANIME_STATIC, TOP_MANGA_STATIC } from '@/lib/static-anime-data'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1';

export async function GET(_req: NextRequest) {
    try {
        const [popularRes, trendingRes, upcomingRes, topMangaRes, pubMangaRes, recentRes] = await Promise.allSettled([
            fetch(`${API_URL}/anime/popular`),
            fetch(`${API_URL}/anime/trending`),
            fetch(`${API_URL}/anime/upcoming`),
            fetch(`${API_URL}/manga/top?filter=bypopularity`),
            fetch(`${API_URL}/manga/top?filter=publishing`),
            fetch(`${API_URL}/anime/schedule`)
        ]);

        const extractData = async (res: PromiseSettledResult<Response>) => {
            if (res.status === 'fulfilled' && res.value.ok) {
                const json = await res.value.json();
                if (json.data && Array.isArray(json.data.data)) {
                    return json.data.data;
                }
                return Array.isArray(json.data) ? json.data : [];
            }
            return null;
        };

        const [popularAnime, trendingAnime, upcomingAnime, topManga, publishingManga, recentEpisodes] = await Promise.all([
            extractData(popularRes),
            extractData(trendingRes),
            extractData(upcomingRes),
            extractData(topMangaRes),
            extractData(pubMangaRes),
            extractData(recentRes)
        ]);

        return NextResponse.json({
            success: true,
            data: {
                popularAnime: popularAnime?.length ? popularAnime : TOP_ANIME_STATIC.slice(0, 20),
                trendingAnime: trendingAnime?.length ? trendingAnime : TOP_ANIME_STATIC.slice(0, 10),
                upcomingAnime: upcomingAnime?.length ? upcomingAnime : TOP_ANIME_STATIC.slice(10, 20),
                recentEpisodes: recentEpisodes?.length ? recentEpisodes : (popularAnime?.length ? popularAnime : TOP_ANIME_STATIC.slice(0, 20)),
                topManga: topManga?.length ? topManga : TOP_MANGA_STATIC.slice(0, 20),
                publishingManga: publishingManga?.length ? publishingManga : TOP_MANGA_STATIC.slice(0, 20),
            },
            _source: 'backend',
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
            }
        });
    } catch (error: any) {
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
            _source: 'fallback',
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
            }
        });
    }
}
