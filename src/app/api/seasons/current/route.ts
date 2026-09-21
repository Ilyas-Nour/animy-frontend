export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

// Use Jikan v4 /seasons/now — much more reliable than calling the HF backend
// Jikan is the official MyAnimeList API wrapper and returns real currently-airing shows
const JIKAN_API = 'https://api.jikan.moe/v4'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '25', 10)

    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 12000)

        const response = await fetch(`${JIKAN_API}/seasons/now?limit=${limit}`, {
            headers: { 'Accept': 'application/json' },
            signal: controller.signal,
            cache: 'no-store',
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            throw new Error(`Jikan seasons/now error: ${response.status}`)
        }

        const json = await response.json()
        const data = (json.data || []).slice(0, limit)

        return NextResponse.json(
            { data, pagination: json.pagination },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
                },
            }
        )
    } catch (error: any) {
        console.error('[seasons/current] Jikan failed, trying AniList fallback:', error.message)

        // Fallback: AniList currently-releasing anime
        try {
            const anilistController = new AbortController()
            const anilistTimeout = setTimeout(() => anilistController.abort(), 10000)
            const anilistRes = await fetch('https://graphql.anilist.co', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    query: `query { Page(page: 1, perPage: ${limit}) {
                        media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
                            id idMal title { english romaji } coverImage { large medium }
                            episodes status meanScore popularity seasonYear season genres
                        }
                    } }`
                }),
                signal: anilistController.signal,
                cache: 'no-store',
            })
            clearTimeout(anilistTimeout)
            if (anilistRes.ok) {
                const anilistJson = await anilistRes.json()
                const media = anilistJson.data?.Page?.media || []
                const mapped = media.map((item: any) => ({
                    mal_id: item.idMal || item.id,
                    title: item.title?.english || item.title?.romaji,
                    title_english: item.title?.english,
                    images: {
                        jpg: {
                            image_url: item.coverImage?.large,
                            large_image_url: item.coverImage?.large,
                        }
                    },
                    type: item.format,
                    episodes: item.episodes,
                    status: 'Currently Airing',
                    airing: true,
                    score: item.meanScore ? item.meanScore / 10 : null,
                    popularity: item.popularity,
                    genres: item.genres?.map((g: string, i: number) => ({ mal_id: i, name: g })) || [],
                    year: item.seasonYear,
                }))
                return NextResponse.json({ data: mapped })
            }
        } catch (anilistError: any) {
            console.error('[seasons/current] AniList fallback also failed:', anilistError.message)
        }

        return NextResponse.json({ data: [] }, { status: 200 })
    }
}
