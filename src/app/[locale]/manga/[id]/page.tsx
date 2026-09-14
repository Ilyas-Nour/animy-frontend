export const runtime = 'edge';
export const revalidate = 3600;
import type { Metadata } from 'next'
import { Manga } from '@/types/manga'
import { notFound } from 'next/navigation'
import MangaDetailsClient from '@/components/manga/MangaDetailsClient'
import JsonLd from '@/components/seo/JsonLd'
import { AdBanner } from '@/components/ads/AdBanner'

import { constructMetadata } from '@/lib/seo-utils'
import { TOP_MANGA_STATIC } from '@/lib/static-anime-data'

const KITSU_API = 'https://kitsu.io/api/edge'

/** Try Jikan (MAL) for manga data */
async function tryJikanManga(id: string) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(`https://api.jikan.moe/v4/manga/${id}/full`, {
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

/** Map Kitsu manga item to Jikan-compatible shape */
function kitsuMangaToData(item: any, included: any[] = []) {
  const attrs = item.attributes

  let malId = parseInt(item.id, 10)
  if (included && item.relationships?.mappings?.data) {
    const mappingIds = item.relationships.mappings.data.map((m: any) => m.id)
    const mMapping = included.find(
      (i: any) => i.type === 'mappings' && mappingIds.includes(i.id) &&
        i.attributes?.externalSite === 'myanimelist/manga'
    )
    if (mMapping?.attributes?.externalId) {
      malId = parseInt(mMapping.attributes.externalId, 10)
    }
  }

  return {
    mal_id: malId,
    kitsu_id: parseInt(item.id, 10),
    title: attrs.canonicalTitle || attrs.titles?.en || attrs.titles?.en_jp || 'Unknown',
    title_english: attrs.titles?.en,
    images: {
      jpg: {
        image_url: attrs.posterImage?.small || '',
        large_image_url: attrs.posterImage?.large || attrs.posterImage?.original || '',
      },
    },
    score: attrs.averageRating ? parseFloat(attrs.averageRating) / 10 : undefined,
    scored_by: attrs.userCount,
    chapters: attrs.chapterCount,
    volumes: attrs.volumeCount,
    status: attrs.status === 'current' ? 'Publishing' : attrs.status === 'finished' ? 'Finished' : 'Unknown',
    type: attrs.subtype || 'Manga',
    year: attrs.startDate ? new Date(attrs.startDate).getFullYear() : undefined,
    synopsis: attrs.synopsis || '',
    genres: [],
    authors: [],
    published: {
      from: attrs.startDate,
      to: attrs.endDate,
      string: attrs.startDate ? `${attrs.startDate}${attrs.endDate ? ` to ${attrs.endDate}` : ''}` : 'Unknown',
    },
  }
}

/** Try Kitsu by Kitsu manga ID */
async function tryKitsuMangaById(id: string) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(`${KITSU_API}/manga/${id}?include=mappings`, {
      headers: { 'Accept': 'application/vnd.api+json' },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!res.ok) return null
    const json = await res.json()
    if (!json.data) return null
    return kitsuMangaToData(json.data, json.included || [])
  } catch { /* fall through */ }
  return null
}

async function getMangaFull(id: string) {
  const numericId = parseInt(id, 10)

  // 1. Try Jikan with given ID (works for valid MAL manga IDs)
  const jikanData = await tryJikanManga(id)
  if (jikanData) return jikanData

  // 2. If Jikan failed, the ID might be a Kitsu ID — try Kitsu directly
  const kitsuData = await tryKitsuMangaById(id)
  if (kitsuData) {
    // If we got a different MAL ID from Kitsu, try Jikan again with that
    if (kitsuData.mal_id && kitsuData.mal_id !== numericId) {
      const jikanFromMal = await tryJikanManga(kitsuData.mal_id.toString())
      if (jikanFromMal) return jikanFromMal
    }
    return kitsuData
  }

  // 3. Static fallback
  if (typeof TOP_MANGA_STATIC !== 'undefined') {
    const staticHit = (TOP_MANGA_STATIC as any[]).find((m: any) => m.mal_id === numericId)
    if (staticHit) return staticHit
  }

  return null
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string, id: string }> }): Promise<Metadata> {
  const { locale, id } = await params;
  const manga = await getMangaFull(id)
  if (!manga) return { title: 'Manga Not Found | Animy' }

  const title = `Read ${manga.title} Manga Online Free - All Chapters`
  const description = manga.synopsis
    ? `${manga.synopsis.slice(0, 150)}... Read ${manga.title} manga online for free in high quality on Animy.`
    : `Read ${manga.title} manga online for free in high quality on Animy. Latest chapters, characters, and reviews.`

  const keywords = [
    manga.title,
    `read ${manga.title} online free`,
    `${manga.title} chapters`,
    `${manga.title} manga online`,
    `${manga.title} english`,
    ...(manga.genres?.map((g: any) => g.name) || []),
    ...(manga.authors?.map((a: any) => a.name) || []),
    'manga reader',
    'free manga'
  ]

  return constructMetadata({
    title,
    description,
    keywords,
    image: manga.images?.jpg?.large_image_url || '/og-image.png',
    type: 'book',
    canonicalPath: `manga/${id}`,
    locale
  });
}

export default async function MangaDetailPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
  const { id, locale } = await params;

  const [rawManga] = await Promise.all([
    getMangaFull(id),
  ])

  if (!rawManga) {
    notFound()
  }

  const manga = {
    ...rawManga,
    relations: rawManga.relations || [],
    recommendations: rawManga.recommendations || [],
    external: rawManga.external || []
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://animy.xyz';

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: manga.title,
      description: manga.synopsis,
      image: manga.images?.jpg?.large_image_url,
      genre: manga.genres?.map((g: any) => g.name),
      author: manga.authors?.map((a: any) => ({ '@type': 'Person', name: a.name })),
      datePublished: manga.published?.from,
      aggregateRating: manga.score ? {
        '@type': 'AggregateRating',
        ratingValue: manga.score,
        reviewCount: manga.scored_by || 50,
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
          name: 'Manga',
          item: `${baseUrl}/manga`
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: manga.title,
          item: `${baseUrl}/manga/${id}`
        }
      ]
    }
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <AdBanner className="max-w-7xl mx-auto px-4" />
      <MangaDetailsClient
        manga={manga}
        characters={[]}
      />
      <AdBanner className="max-w-7xl mx-auto px-4 mt-12" />
    </>
  )
}
