export const runtime = 'edge';
export const revalidate = 3600;
import type { Metadata } from 'next'
import { AnimeDetailsClient } from '@/components/anime/AnimeDetailsClient'
import { notFound } from 'next/navigation'
import JsonLd from '@/components/seo/JsonLd'
import { AdBanner } from '@/components/ads/AdBanner'

import { constructMetadata } from '@/lib/seo-utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1'

async function getAnimeFull(id: string) {
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000) // 20s per attempt

      const res = await fetch(`${API_URL}/anime/${id}/full`, {
        signal: controller.signal,
        cache: 'no-store',
      })
      clearTimeout(timeoutId)

      if (!res.ok) {
        if (res.status === 404) return null
        throw new Error(`Backend error: ${res.status}`)
      }
      const json = await res.json()
      return json.data
    } catch (error: any) {
      lastError = error
      if (error?.message?.includes('404')) return null
      if (attempt < maxRetries) {
        // Wait 1s, then 2s before next retry
        await new Promise(r => setTimeout(r, attempt * 1000))
      }
    }
  }

  console.error('getAnimeFull failed after retries:', lastError?.message)
  throw lastError
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
