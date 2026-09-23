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

export const anilistAnimeDetailsQuery = `
  query ($id: Int, $idMal: Int) {
    Media(id: $id, idMal: $idMal, type: ANIME) {
      id
      idMal
      isAdult
      title {
        romaji
        english
        native
      }
      coverImage {
        extraLarge
        large
        medium
        color
      }
      bannerImage
      description
      format
      episodes
      duration
      status
      season
      seasonYear
      averageScore
      popularity
      favourites
      genres
      rankings {
        rank
        type
        format
        allTime
      }
      synonyms
      source
      studios(isMain: true) {
        nodes {
          name
        }
      }
      nextAiringEpisode {
        airingAt
        timeUntilAiring
        episode
      }
      trailer {
        id
        site
        thumbnail
      }
      recommendations(sort: RATING_DESC, page: 1, perPage: 10) {
        nodes {
          mediaRecommendation {
            id
            isAdult
            title {
              romaji
              english
            }
            coverImage {
              large
            }
          }
        }
      }
      relations {
        edges {
          relationType
          node {
            id
            idMal
            status
            type
            format
            title {
              romaji
              english
            }
            coverImage {
              large
            }
          }
        }
      }
      staff(sort: RELEVANCE, perPage: 8) {
        edges {
          role
          node {
            id
            name {
              full
            }
            image {
              large
            }
          }
        }
      }
      characters(sort: [ROLE, RELEVANCE, ID], page: 1, perPage: 12) {
        edges {
          role
          node {
            id
            name {
              full
            }
            image {
              large
            }
          }
          voiceActors(language: JAPANESE, sort: [RELEVANCE, ID]) {
            id
            name {
              full
            }
            image {
              large
            }
          }
        }
      }
      externalLinks {
        id
        site
        url
      }
    }
  }
`;

export const anilistMangaDetailsQuery = `
  query ($id: Int, $idMal: Int) {
    Media(id: $id, idMal: $idMal, type: MANGA) {
      id
      idMal
      isAdult
      title {
        romaji
        english
        native
      }
      coverImage {
        extraLarge
        large
        medium
        color
      }
      bannerImage
      description
      format
      chapters
      volumes
      status
      averageScore
      popularity
      genres
      synonyms
      source
      startDate {
        year
        month
        day
      }
      staff {
        nodes {
          name {
            full
          }
        }
      }
      characters(sort: ROLE, page: 1, perPage: 10) {
        nodes {
          id
          name {
            full
          }
          image {
            large
          }
        }
        edges {
          role
        }
      }
      recommendations(sort: RATING_DESC, page: 1, perPage: 10) {
        nodes {
          mediaRecommendation {
            id
            isAdult
            title {
              romaji
            }
            coverImage {
              large
            }
          }
        }
      }
    }
  }
`;

export async function fetchAnilistAnimeFull(id: number) {
    try {
        const data = await anilistFetch(anilistAnimeDetailsQuery, { id });
        if (data?.Media) {
            return mapAniListToAnime(data.Media);
        }
        return null;
    } catch (e) {
        console.error("fetchAnilistAnimeFull error:", e);
        return null;
    }
}

export async function fetchAnilistMangaFull(id: number) {
    try {
        const data = await anilistFetch(anilistMangaDetailsQuery, { id });
        if (data?.Media) {
            return mapAniListToManga(data.Media);
        }
        return null;
    } catch (e) {
        console.error("fetchAnilistMangaFull error:", e);
        return null;
    }
}

export function mapAniListToAnime(data: any): Anime {
    if (!data) return null as any;
    return {
      id: data.id,
      anilistId: data.id,
      mal_id: data.id, // KEEP as AniList ID for frontend routing compatibility
      idMal: data.idMal,
      tmdbId: data.idTmdb,
      title: data.title?.romaji || data.title?.english || data.title?.native,
      title_english: data.title?.english,
      title_japanese: data.title?.native,
      url: \`https://anilist.co/anime/\${data.id}\`,
      synopsis: data.description ? data.description : "No synopsis available.",
      type: data.format,
      episodes: data.episodes,
      status: data.status === 'FINISHED' ? 'Finished Airing' : data.status === 'RELEASING' ? 'Currently Airing' : data.status,
      score: data.averageScore ? data.averageScore / 10 : undefined,
      rank: data.rankings?.find((r: any) => r.allTime)?.rank || data.rankings?.[0]?.rank,
      popularity: data.popularity,
      members: data.popularity,
      favorites: data.favourites,
      duration: data.duration ? \`\${data.duration} min per ep\` : undefined,
      source: data.source,
      bannerImage: data.bannerImage,
      color: data.coverImage?.color,
      airing: data.status === "RELEASING",
      aired: {
        from: data.startDate?.year
          ? \`\${data.startDate.year}-\${String(data.startDate.month || 1).padStart(2, "0")}-\${String(data.startDate.day || 1).padStart(2, "0")}\`
          : undefined,
      },
      images: {
        jpg: {
          image_url: data.coverImage?.large || data.coverImage?.medium,
          large_image_url: data.coverImage?.extraLarge || data.coverImage?.large,
          small_image_url: data.coverImage?.medium,
        },
        webp: {
          image_url: data.coverImage?.large || data.coverImage?.medium,
          large_image_url: data.coverImage?.extraLarge || data.coverImage?.large,
          small_image_url: data.coverImage?.medium,
        },
      },
      trailer: {
        url:
          data.trailer?.site === "youtube"
            ? \`https://www.youtube.com/watch?v=\${data.trailer.id}\`
            : data.trailer?.site === "dailymotion"
              ? \`https://www.dailymotion.com/video/\${data.trailer.id}\`
              : data.trailer?.id
                ? \`https://www.youtube.com/watch?v=\${data.trailer.id}\`
                : undefined,
        youtube_id: data.trailer?.site === "youtube" ? data.trailer.id : undefined,
        embed_url:
          data.trailer?.site === "youtube"
            ? \`https://www.youtube.com/embed/\${data.trailer.id}\`
            : data.trailer?.site === "dailymotion"
              ? \`https://www.dailymotion.com/embed/video/\${data.trailer.id}\`
              : data.trailer?.id
                ? \`https://www.youtube.com/embed/\${data.trailer.id}\`
                : undefined,
        thumbnail: data.trailer?.thumbnail,
      } as any,
      year: data.seasonYear,
      season: data.season?.toLowerCase(),
      genres: data.genres?.map((g: string, i: number) => ({ name: g, mal_id: i })) || [],
      studios: data.studios?.nodes?.map((s: any) => ({ name: s.name, mal_id: s.id })) || [],
      streaming: data.externalLinks?.map((link: any) => ({
          name: link.site,
          url: link.url,
      })) || [],
      relations: data.relations?.edges?.filter((edge: any) => edge && edge.node).map((edge: any) => ({
          relationType: edge.relationType,
          node: edge.node,
      })) || [],
      staff: data.staff?.edges?.filter((edge: any) => edge && edge.node).map((edge: any) => ({
          role: edge.role,
          node: edge.node,
      })) || [],
      recommendations: data.recommendations?.nodes?.filter(
          (node: any) => node && node.mediaRecommendation,
      ) || [],
      characters: data.characters?.edges?.filter((edge: any) => edge && edge.node) || [],
    } as any;
}

export function mapAniListToManga(data: any): Manga {
    if (!data) return null as any;
    return {
      id: data.id,
      mal_id: data.idMal || data.id,
      url: \`https://anilist.co/manga/\${data.id}\`,
      title: data.title?.romaji || data.title?.english || data.title?.native,
      title_english: data.title?.english,
      title_japanese: data.title?.native,
      images: {
        jpg: {
          image_url: data.coverImage?.large || data.coverImage?.medium,
          large_image_url: data.coverImage?.extraLarge || data.coverImage?.large,
          small_image_url: data.coverImage?.medium,
        },
        webp: {
          image_url: data.coverImage?.large || data.coverImage?.medium,
          large_image_url: data.coverImage?.extraLarge || data.coverImage?.large,
          small_image_url: data.coverImage?.medium,
        },
      },
      type: data.format || 'Manga',
      chapters: data.chapters,
      volumes: data.volumes,
      status: data.status === 'FINISHED' ? 'Finished' : data.status === 'RELEASING' ? 'Publishing' : data.status,
      publishing: data.status === 'RELEASING',
      published: {
        from: data.startDate?.year ? \`\${data.startDate.year}-\${data.startDate.month}-\${data.startDate.day}\` : '',
        to: data.endDate?.year ? \`\${data.endDate.year}-\${data.endDate.month}-\${data.endDate.day}\` : '',
        string: data.startDate?.year ? String(data.startDate.year) : ''
      },
      score: data.averageScore ? (data.averageScore / 10) : undefined,
      popularity: data.popularity,
      synopsis: data.description ? data.description : "No synopsis available.",
      color: data.coverImage?.color,
      authors: data.staff?.nodes?.map((s: any) => ({ mal_id: s.id, type: 'people', name: s.name?.full, url: '' })) || [],
      serializations: [],
      genres: data.genres?.map((g: string, i: number) => ({ mal_id: i, type: 'manga', name: g, url: '' })) || [],
      explicit_genres: [],
      themes: [],
      demographics: [],
      characters: data.characters?.nodes?.map((n: any) => ({ node: n, role: 'Main' })) || [], // simplified mapping
      recommendations: data.recommendations?.nodes?.map((r: any) => r.mediaRecommendation) || []
    } as any;
}
