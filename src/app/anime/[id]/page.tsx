export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import type { Metadata } from 'next'
import { AnimeDetailsClient } from '@/components/anime/AnimeDetailsClient'
import { notFound } from 'next/navigation'
import JsonLd from '@/components/seo/JsonLd'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1'

async function getAnimeFull(id: string) {
  try {
    const res = await fetch(`${API_URL}/anime/${id}/full`)
    if (!res.ok) {
      if (res.status === 404) return null
      throw new Error('Failed to fetch anime')
    }
    const json = await res.json()
    return json.data
  } catch (error) {
    console.error('Fetch error:', error)
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const anime = await getAnimeFull(id)
  if (!anime) return { title: 'Anime Not Found | Animy' }
  
  const title = `Watch ${anime.title} Online - All Episodes Free | Animy`
  const description = anime.synopsis 
    ? `${anime.synopsis.slice(0, 150)}... Watch ${anime.title} in high quality with English sub and dub on Animy.`
    : `Watch ${anime.title} online for free on Animy. Get the latest episodes, characters, and reviews.`
  
  const keywords = [
    anime.title,
    `watch ${anime.title} online`,
    `${anime.title} episodes`,
    `${anime.title} english sub`,
    `${anime.title} english dub`,
    ...(anime.genres?.map((g: any) => g.name) || []),
    ...(anime.studios?.map((s: any) => s.name) || []),
    'anime streaming',
    'free anime'
  ]

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'video.tv_show',
      images: [
        {
          url: anime.images?.jpg?.large_image_url || '',
          width: 600,
          height: 900,
          alt: anime.title,
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [anime.images?.jpg?.large_image_url || ''],
    }
  }
}

export default async function AnimeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const anime = await getAnimeFull(id)

  if (!anime) {
    notFound()
  }

  const jsonLd = {
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
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <AnimeDetailsClient
        anime={anime}
      />
    </>
  )
}
