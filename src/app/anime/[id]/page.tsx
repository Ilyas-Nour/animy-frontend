export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import type { Metadata } from 'next'
import { AnimeDetailsClient } from '@/components/anime/AnimeDetailsClient'
import { notFound } from 'next/navigation'

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
  return {
    title: `${anime.title} | Animy`,
    description: anime.synopsis?.slice(0, 160) || 'Anime details',
    openGraph: {
      title: anime.title,
      images: [anime.images?.jpg?.large_image_url || '']
    }
  }
}

export default async function AnimeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const anime = await getAnimeFull(id)

  if (!anime) {
    notFound()
  }

  return (
    <AnimeDetailsClient
      anime={anime}
    />
  )
}
