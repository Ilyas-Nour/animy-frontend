export const runtime = 'edge';
export const revalidate = 3600;
import type { Metadata } from 'next'
import { AnimeDetailsClient } from '@/components/anime/AnimeDetailsClient'
import { notFound } from 'next/navigation'
import JsonLd from '@/components/seo/JsonLd'
import { AdBanner } from '@/components/ads/AdBanner'

import { constructMetadata } from '@/lib/seo-utils'

import { TOP_ANIME_STATIC, TOP_MOVIES_STATIC, HERO_SPOTLIGHT_ANIME } from '@/lib/static-anime-data'

const KITSU_API = 'https://kitsu.io/api/edge'

/** Try Jikan (MAL) first — works for valid MAL IDs */
async function tryJikan(id: string) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(`https://api.jikan.moe/v4/anime/${id}/full`, {
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timeoutId)
    if (res.status === 404) return null
    if (res.ok) {
      const json = await res.json()
      return json.data || null
    }
  } catch { /* fall through */ }
  return null
}

/** Map a Kitsu anime item to the Jikan-compatible shape the UI expects */
function kitsuItemToAnime(item: any, included: any[] = []) {
  const attrs = item.attributes

  // Extract MAL ID from mappings
  let malId = parseInt(item.id, 10)
  if (included && item.relationships?.mappings?.data) {
    const mappingIds = item.relationships.mappings.data.map((m: any) => m.id)
    const mMapping = included.find(
      (i: any) => i.type === 'mappings' && mappingIds.includes(i.id) &&
        (i.attributes?.externalSite === 'myanimelist/anime')
    )
    if (mMapping?.attributes?.externalId) {
      malId = parseInt(mMapping.attributes.externalId, 10)
    }
  }

  const score = attrs.averageRating ? parseFloat(attrs.averageRating) / 10 : undefined

  return {
    mal_id: malId,
    kitsu_id: parseInt(item.id, 10),
    title: attrs.canonicalTitle || attrs.titles?.en || attrs.titles?.en_jp || 'Unknown',
    title_english: attrs.titles?.en,
    title_japanese: attrs.titles?.ja_jp,
    images: {
      jpg: {
        image_url: attrs.posterImage?.small || '',
        large_image_url: attrs.posterImage?.large || attrs.posterImage?.original || '',
      },
      webp: {
        image_url: attrs.posterImage?.small || '',
        large_image_url: attrs.posterImage?.large || attrs.posterImage?.original || '',
      },
    },
    bannerImage: attrs.coverImage?.large || attrs.coverImage?.original,
    score,
    scored_by: attrs.userCount,
    episodes: attrs.episodeCount,
    status: attrs.status === 'current' ? 'Currently Airing'
      : attrs.status === 'finished' ? 'Finished Airing'
        : attrs.status === 'upcoming' ? 'Not yet aired' : 'Unknown',
    type: attrs.subtype?.toUpperCase() || 'TV',
    year: attrs.startDate ? new Date(attrs.startDate).getFullYear() : undefined,
    synopsis: attrs.synopsis || attrs.description || '',
    duration: attrs.episodeLength ? `${attrs.episodeLength} min per ep` : undefined,
    genres: (attrs.categories || []).map((c: string) => ({ name: c })),
    aired: {
      from: attrs.startDate,
      to: attrs.endDate,
      string: attrs.startDate
        ? `${attrs.startDate}${attrs.endDate ? ` to ${attrs.endDate}` : ''}`
        : 'Unknown',
    },
    studios: [],
    source: attrs.mangaAdaptations?.[0] ? 'Manga' : 'Original',
  }
}

/** Try Kitsu by Kitsu ID (used when the ID in the URL is a Kitsu ID, not MAL) */
async function tryKitsuById(id: string) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(`${KITSU_API}/anime/${id}?include=mappings`, {
      headers: { 'Accept': 'application/vnd.api+json' },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!res.ok) return null
    const json = await res.json()
    if (!json.data) return null
    return kitsuItemToAnime(json.data, json.included || [])
  } catch { /* fall through */ }
  return null
}

/** Search Kitsu by MAL mapping to get full Kitsu details */
async function tryKitsuByMalId(malId: string) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)
    // Use Kitsu's mappings endpoint to find the anime by MAL ID
    const res = await fetch(
      `${KITSU_API}/mappings?filter[externalSite]=myanimelist/anime&filter[externalId]=${malId}&include=item`,
      { headers: { 'Accept': 'application/vnd.api+json' }, signal: controller.signal }
    )
    clearTimeout(timeoutId)
    if (!res.ok) return null
    const json = await res.json()
    const item = json.included?.find((i: any) => i.type === 'anime')
    if (!item) return null
    return kitsuItemToAnime(item, json.included || [])
  } catch { /* fall through */ }
  return null
}

async function getAnimeFull(id: string) {
  const numericId = parseInt(id, 10)

  // 1. First: check static cache (instant, no API needed)
  const staticHit = [...TOP_ANIME_STATIC, ...TOP_MOVIES_STATIC, ...HERO_SPOTLIGHT_ANIME]
    .find(a => a.mal_id === numericId)

  // 2. Try Jikan with the given ID (works for valid MAL IDs)
  const jikanData = await tryJikan(id)
  if (jikanData) return jikanData

  // 3. If Jikan failed (could be a Kitsu ID), try Kitsu directly
  const kitsuDirect = await tryKitsuById(id)
  if (kitsuDirect) {
    // Got it from Kitsu — now try to get richer data from Jikan using the real MAL ID
    if (kitsuDirect.mal_id && kitsuDirect.mal_id !== numericId) {
      const jikanFromMal = await tryJikan(kitsuDirect.mal_id.toString())
      if (jikanFromMal) return jikanFromMal
    }
    return kitsuDirect
  }

  // 4. Last resort: use static data
  if (staticHit) return staticHit

  return null
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string, id: string }> }): Promise<Metadata> {
  const { locale, id } = await params;
  const anime = await getAnimeFull(id)
  if (!anime) return { title: 'Anime Not Found | Animy' }

  const title = `Watch ${anime.title} (English Sub/Dub) Online Free in HD`
  const description = anime.synopsis
    ? `${anime.synopsis.slice(0, 150)}... Watch ${anime.title} episodes online in high quality with English sub and dub on Animy for free.`
    : `Watch ${anime.title} online for free in HD on Animy. Get the latest episodes, characters, and reviews.`

  const keywords = [
    anime.title,
    `watch ${anime.title} online free`,
    `${anime.title} episodes`,
    `${anime.title} english sub`,
    `${anime.title} english dub`,
    `${anime.title} hd`,
    ...(anime.genres?.map((g: any) => g.name) || []),
    ...(anime.studios?.map((s: any) => s.name) || []),
    'anime streaming',
    'free anime'
  ]

  return constructMetadata({
    title,
    description,
    keywords,
    image: anime.images?.jpg?.large_image_url || '/og-image.png',
    type: 'video.tv_show',
    canonicalPath: `anime/${id}`,
    locale
  });
}

export default async function AnimeDetailPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
  const { id, locale } = await params;
  const anime = await getAnimeFull(id)

  if (!anime) {
    notFound()
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://animy.xyz';

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': anime.type === 'Movie' ? 'Movie' : 'TVSeries',
      name: anime.title,
      description: anime.synopsis,
      image: anime.images?.jpg?.large_image_url,
      genre: anime.genres?.map((g: any) => g.name),
      datePublished: anime.aired?.from,
      author: anime.studios?.map((s: any) => ({ '@type': 'Organization', name: s.name })),
      aggregateRating: anime.score ? {
        '@type': 'AggregateRating',
        ratingValue: anime.score,
        reviewCount: anime.scored_by || 100,
        bestRating: 10,
        worstRating: 1
      } : undefined
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Anime',
          item: `${baseUrl}/anime`
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: anime.title,
          item: `${baseUrl}/anime/${id}`
        }
      ]
    }
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <AdBanner className="max-w-7xl mx-auto px-4" />
      <AnimeDetailsClient
        anime={anime}
      />
      <AdBanner className="max-w-7xl mx-auto px-4 mt-12" />
    </>
  )
}
