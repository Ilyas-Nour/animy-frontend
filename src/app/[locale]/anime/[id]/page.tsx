export const runtime = 'edge';
export const revalidate = 3600;
import type { Metadata } from 'next'
import { AnimeDetailsClient } from '@/components/anime/AnimeDetailsClient'
import { notFound } from 'next/navigation'
import JsonLd from '@/components/seo/JsonLd'
import { AdBanner } from '@/components/ads/AdBanner'

import { constructMetadata } from '@/lib/seo-utils'

import { TOP_ANIME_STATIC, TOP_MOVIES_STATIC, HERO_SPOTLIGHT_ANIME } from '@/lib/static-anime-data'

import { anilistFetch, mapAniListToAnime } from '@/lib/anilist-client'

async function getAnimeFull(id: string): Promise<any> {
  const numericId = parseInt(id, 10)

  // 1. First: check static cache (instant, no API needed)
  const staticHit = [...TOP_ANIME_STATIC, ...TOP_MOVIES_STATIC, ...HERO_SPOTLIGHT_ANIME]
    .find(a => (a as any).id === numericId || a.mal_id === numericId)

  try {
      const query = `
          query($id: Int) {
              Media(id: $id, type: ANIME) {
                  id idMal title { english romaji native } coverImage { extraLarge large medium color }
                  bannerImage format source episodes duration status meanScore popularity description
                  seasonYear season genres trailer { id site }
                  studios(isMain: true) { nodes { id name } }
                  stats { scoreDistribution { score amount } }
                  characters(sort: ROLE, perPage: 10) {
                      edges {
                          role
                          node { id name { full } image { large } }
                          voiceActors(language: JAPANESE) { id name { full } image { large } }
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
      if (!data.Media) return staticHit || null
      
      const mappedData = mapAniListToAnime(data.Media)
      mappedData.characters = data.Media.characters?.edges || []
      mappedData.relations = data.Media.relations?.edges || []
      mappedData.recommendations = data.Media.recommendations?.nodes || []
      
      return mappedData
  } catch (error) {
      console.error('Anime detail AniList fetch failed:', error)
      return staticHit || null
  }
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
    ...((anime as any).studios?.map((s: any) => s.name) || []),
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
