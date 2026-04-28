export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'airing'
    const limit = parseInt(searchParams.get('limit') || '20')

    try {
        const variables = {
            page: 1,
            perPage: limit,
            sort: filter === 'bypopularity' ? ['POPULARITY_DESC'] : ['TRENDING_DESC']
        }

        const query = `
            query ($page: Int, $perPage: Int, $sort: [MediaSort]) {
                Page(page: $page, perPage: $perPage) {
                    media(type: ANIME, sort: $sort, isAdult: false, genre_not_in: ["Hentai", "Ecchi"]) {
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
                        bannerImage
                        description
                        averageScore
                        popularity
                        genres
                        format
                        episodes
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
            title_english: m.title.english,
            title_japanese: m.title.romaji,
            images: {
                jpg: {
                    image_url: m.coverImage.large,
                    large_image_url: m.coverImage.extraLarge,
                    small_image_url: m.coverImage.medium
                },
                webp: {
                    image_url: m.coverImage.large,
                    large_image_url: m.coverImage.extraLarge,
                    small_image_url: m.coverImage.medium
                }
            },
            bannerImage: m.bannerImage,
            description: m.description,
            synopsis: m.description?.replace(/<[^>]*>?/gm, "") || "",
            score: m.averageScore ? m.averageScore / 10 : null,
            type: m.format,
            status: m.status,
            episodes: m.episodes,
            genres: m.genres.map((g: string) => ({ name: g }))
        }))

        return NextResponse.json({ data })
    } catch (error: any) {
        console.error('[PROXY CRASH] Top anime direct fetch failed:', error)
        return NextResponse.json({ data: [] }, { status: 200 })
    }
}
