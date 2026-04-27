export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

const JIKAN_API = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1'
const ANILIST_ENDPOINT = 'https://graphql.anilist.co'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const order_by = searchParams.get('order_by') || 'popularity'
    const sort = searchParams.get('sort') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '25')
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const page = parseInt(searchParams.get('page') || '1')

    try {
        // Optimization: For basic "Top" or "Popular" queries without complex filters,
        // fetch directly from AniList at the Edge for maximum speed.
        if (!q && (order_by === 'popularity' || !order_by)) {
            const variables = { 
                page, 
                perPage: limit,
                status: status ? status.toUpperCase() : undefined
            }

            const sortValue = sort === 'desc' ? 'POPULARITY_DESC' : 'POPULARITY'

            const query = `
                query ($page: Int, $perPage: Int, $status: MediaStatus) {
                    Page(page: $page, perPage: $perPage) {
                        pageInfo {
                            total
                            currentPage
                            lastPage
                            hasNextPage
                            perPage
                        }
                        media(type: MANGA, sort: [${sortValue}], status: $status, isAdult: false, genre_not_in: ["Hentai", "Ecchi"]) {
                            id
                            idMal
                            title {
                                romaji
                                english
                                native
                            }
                            coverImage {
                                extraLarge
                                large
                                medium
                            }
                            description
                            format
                            chapters
                            volumes
                            status
                            averageScore
                            popularity
                            genres
                            startDate {
                                year
                            }
                        }
                    }
                }
            `

            const aniRes = await fetch(ANILIST_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ query, variables }),
                next: { revalidate: 3600 }
            })

            if (aniRes.ok) {
                const aniJson = await aniRes.json()
                const data = aniJson.data.Page.media.map((m: any) => ({
                    mal_id: m.id,
                    title: m.title.romaji || m.title.english || m.title.native,
                    title_english: m.title.english,
                    title_japanese: m.title.native,
                    synopsis: m.description?.replace(/<[^>]*>?/gm, "") || "",
                    type: m.format,
                    chapters: m.chapters,
                    volumes: m.volumes,
                    status: m.status,
                    score: m.averageScore ? m.averageScore / 10 : null,
                    popularity: m.popularity,
                    images: {
                        jpg: {
                            image_url: m.coverImage.large,
                            large_image_url: m.coverImage.extraLarge,
                            small_image_url: m.coverImage.medium
                        }
                    },
                    genres: m.genres.map((g: string) => ({ name: g })),
                    published: { from: m.startDate.year }
                }))

                return NextResponse.json({
                    data,
                    pagination: aniJson.data.Page.pageInfo
                })
            }
        }

        // Fallback to Backend API for complex queries or if AniList direct fails
        let url = `${JIKAN_API}/manga?q=${q}&type=${type}&status=${status}&order_by=${order_by}&sort=${sort}&limit=${limit}&page=${page}`

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 },
            signal: AbortSignal.timeout(8000) // 8s timeout
        })

        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json(data)

    } catch (error: any) {
        console.error('Manga search error:', error)
        return NextResponse.json({ error: error.message, data: [] }, { status: 500 })
    }
}
