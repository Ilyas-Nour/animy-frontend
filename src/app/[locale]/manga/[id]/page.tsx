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

import { anilistFetch, mapAniListToManga } from '@/lib/anilist-client'

async function getMangaFull(id: string) {
  const numericId = parseInt(id, 10)

  // 1. Static fallback
  if (typeof TOP_MANGA_STATIC !== 'undefined') {
    const staticHit = (TOP_MANGA_STATIC as any[]).find((m: any) => m.mal_id === numericId || m.id === numericId)
    if (staticHit) return staticHit
  }

  try {
      const query = `
          query($id: Int) {
              Media(id: $id, type: MANGA) {
                  id idMal title { english romaji native } coverImage { extraLarge large medium color }
                  format chapters volumes status meanScore popularity description
                  startDate { year month day } endDate { year month day } genres
                  staff(sort: RELEVANCE) { nodes { id name { full } } }
                  characters(sort: ROLE, perPage: 10) {
                      edges {
                          role
                          node { id name { full } image { large } }
                      }
                  }
                  relations {
                      edges {
                          relationType(version: 2)
                          node { id idMal type status format title { romaji english } coverImage { large } }
                      }
                  }
                  recommendations(perPage: 10, sort: RATING_DESC) {
                      nodes {
                          mediaRecommendation { id title { romaji english } coverImage { large } }
                      }
                  }
              }
          }
      `
      const data = await anilistFetch(query, { id: numericId })
      if (!data.Media) return null
      
      const mappedData: any = mapAniListToManga(data.Media)
      mappedData.characters = data.Media.characters?.edges || []
      mappedData.relations = data.Media.relations?.edges || []
      mappedData.recommendations = data.Media.recommendations?.nodes || []
      
      return mappedData
  } catch (error) {
      console.error('Manga detail AniList fetch failed:', error)
      return null
  }
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
