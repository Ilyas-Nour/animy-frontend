export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { TOP_ANIME_STATIC, TOP_MANGA_STATIC } from '@/lib/static-anime-data'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1';

export async function GET(_req: NextRequest) {
    try {
        const controller = new AbortController();
        // 5s timeout. If backend is asleep, fallback to static.
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(`${API_URL}/home`, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 300 }
        });
        
        clearTimeout(timeoutId);

        if (!res.ok) {
            throw new Error(`Home backend returned ${res.status}`);
        }

        const json = await res.json();
        const data = json.data || json;

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
