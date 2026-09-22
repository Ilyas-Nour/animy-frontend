import { Anime } from '@/types/anime'
import { Manga } from '@/types/manga'

const ANILIST_API = 'https://graphql.anilist.co'

export async function anilistFetch(query: string, variables: any = {}, timeout = 12000) {
    const signal = AbortSignal.timeout(timeout)

    
    try {
        const response = await fetch(ANILIST_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ query, variables }),
            signal,
            // NOTE: Do NOT use next: { revalidate } here — it's Vercel-specific and throws
            // a TypeError on Cloudflare Workers edge runtime. Use Cache-Control headers
            // on the NextResponse instead (Cloudflare natively supports those).
            cache: 'no-store',
        })
        

        
        if (!response.ok) {
            throw new Error(`AniList error: ${response.status}`)
        }
        
        const json = await response.json()
        if (json.errors) {
            throw new Error(`AniList GraphQL error: ${json.errors[0].message}`)
        }
        return json.data
    } catch (error) {
        throw error
    }
}

export function mapAniListToAnime(item: any): Anime {
    return {
        id: item.id,
        anilistId: item.id,
        mal_id: item.idMal || item.id,
        idMal: item.idMal,
        url: `https://anilist.co/anime/${item.id}`,
        title: item.title?.english || item.title?.romaji || 'Unknown Title',
        title_english: item.title?.english,
        title_japanese: item.title?.native,
        images: {
            jpg: {
                image_url: item.coverImage?.large || item.coverImage?.medium,
                small_image_url: item.coverImage?.medium,
                large_image_url: item.coverImage?.extraLarge || item.coverImage?.large
            },
            webp: {
                image_url: item.coverImage?.large || item.coverImage?.medium,
                small_image_url: item.coverImage?.medium,
                large_image_url: item.coverImage?.extraLarge || item.coverImage?.large
            }
        },
        bannerImage: item.bannerImage,
        color: item.coverImage?.color,
        type: item.format,
        source: item.source,
        episodes: item.episodes,
        status: item.status === 'FINISHED' ? 'Finished Airing' : item.status === 'RELEASING' ? 'Currently Airing' : item.status,
        airing: item.status === 'RELEASING',
        duration: item.duration ? `${item.duration} min per ep` : undefined,
        score: item.meanScore ? (item.meanScore / 10) : undefined,
        scored_by: item.stats?.scoreDistribution?.reduce((acc: number, cur: any) => acc + cur.amount, 0),
        popularity: item.popularity,
        synopsis: item.description?.replace(/<[^>]*>?/gm, ''), // strip html tags
        year: item.seasonYear,
        season: item.season?.toLowerCase(),
        genres: item.genres?.map((g: string, i: number) => ({ mal_id: i, name: g })),
        studios: item.studios?.nodes?.filter((s: any) => s.isAnimationStudio).map((s: any) => ({ mal_id: s.id, name: s.name })),
        trailer: item.trailer?.id ? {
            youtube_id: item.trailer.site === 'youtube' ? item.trailer.id : '',
            url: item.trailer.site === 'youtube' ? `https://youtube.com/watch?v=${item.trailer.id}` : '',
            embed_url: item.trailer.site === 'youtube' ? `https://www.youtube.com/embed/${item.trailer.id}` : ''
        } : undefined
    }
}

export function mapAniListToManga(item: any): Manga {
    return {
        id: item.id,
        mal_id: item.idMal,
        url: `https://anilist.co/manga/${item.id}`,
        title: item.title?.english || item.title?.romaji || 'Unknown Title',
        title_english: item.title?.english,
        title_japanese: item.title?.native,
        images: {
            jpg: {
                image_url: item.coverImage?.large || item.coverImage?.medium,
                small_image_url: item.coverImage?.medium,
                large_image_url: item.coverImage?.extraLarge || item.coverImage?.large
            },
            webp: {
                image_url: item.coverImage?.large || item.coverImage?.medium,
                small_image_url: item.coverImage?.medium,
                large_image_url: item.coverImage?.extraLarge || item.coverImage?.large
            }
        },
        type: item.format || 'Manga',
        chapters: item.chapters,
        volumes: item.volumes,
        status: item.status === 'FINISHED' ? 'Finished' : item.status === 'RELEASING' ? 'Publishing' : item.status,
        publishing: item.status === 'RELEASING',
        published: {
            from: item.startDate?.year ? `${item.startDate.year}-${item.startDate.month}-${item.startDate.day}` : '',
            to: item.endDate?.year ? `${item.endDate.year}-${item.endDate.month}-${item.endDate.day}` : '',
            string: item.startDate?.year ? String(item.startDate.year) : ''
        },
        score: item.meanScore ? (item.meanScore / 10) : undefined,
        popularity: item.popularity,
        synopsis: item.description?.replace(/<[^>]*>?/gm, ''), // strip html tags
        color: item.coverImage?.color,
        authors: item.staff?.nodes?.map((s: any) => ({ mal_id: s.id, type: 'people', name: s.name?.full, url: '' })) || [],
        serializations: [],
        genres: item.genres?.map((g: string, i: number) => ({ mal_id: i, type: 'manga', name: g, url: '' })) || [],
        explicit_genres: [],
        themes: [],
        demographics: []
    }
}
