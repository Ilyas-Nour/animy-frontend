export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    try {
        const now = new Date();
        const currentMonth = now.getMonth();
        let season: "WINTER" | "SPRING" | "SUMMER" | "FALL";
        let year = now.getFullYear();

        if (currentMonth >= 0 && currentMonth <= 2) {
            season = "SPRING";
        } else if (currentMonth >= 3 && currentMonth <= 5) {
            season = "SUMMER";
        } else if (currentMonth >= 6 && currentMonth <= 8) {
            season = "FALL";
        } else {
            season = "WINTER";
            year++;
        }

        const variables = { page, perPage: limit, season, year }

        const query = `
            query ($season: MediaSeason, $year: Int, $page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    media(season: $season, seasonYear: $year, type: ANIME, sort: [POPULARITY_DESC], isAdult: false, genre_not_in: ["Hentai", "Ecchi"]) {
                        id
                        idMal
                        title {
                            romaji
                            english
                        }
                        coverImage {
                            extraLarge
                            large
                        }
                        format
                        status
                    }
                }
            }
        `

        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables }),
            next: { revalidate: 3600 }
        })

        if (!response.ok) {
            throw new Error(`AniList error: ${response.status}`)
        }

        const result = await response.json()
        const media = result.data?.Page?.media || []

        const data = media.map((m: any) => ({
            id: m.id,
            mal_id: m.idMal || m.id,
            title: m.title.english || m.title.romaji,
            images: {
                jpg: {
                    image_url: m.coverImage.large,
                    large_image_url: m.coverImage.extraLarge
                },
                webp: {
                    image_url: m.coverImage.large,
                    large_image_url: m.coverImage.extraLarge
                }
            },
            type: m.format,
            status: m.status,
            synopsis: m.description?.replace(/<[^>]*>?/gm, "") || ""
        }))

        return NextResponse.json({ data })
    } catch (error: any) {
        console.error('[PROXY CRASH] Upcoming direct fetch failed:', error)
        return NextResponse.json({ data: [] }, { status: 200 })
    }
}
