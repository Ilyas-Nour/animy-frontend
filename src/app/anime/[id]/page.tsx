import type { Metadata } from 'next'
import { AnimeDetailsClient } from '@/components/anime/AnimeDetailsClient'
import { notFound } from 'next/navigation'

export const revalidate = 3600 // ISR: Revalidate every 1 hour

// Use backend API URL (default to localhost:3001/api/v1 if not set)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

async function getAnime(id: string) {
  try {
    // Fetch from our backend to leverage caching and centralized logic
    const res = await fetch(`${API_URL}/anime/${id}`, {
      next: { revalidate: 3600 }
    })

    if (!res.ok) {
      if (res.status === 404) return null
      throw new Error('Failed to fetch anime')
    }

    const json = await res.json()
    // Backend returns wrapped response { success: true, data: AnimeObject }
    // We return { data: AnimeObject } to match expected structure
    return { data: json.data }
  } catch (error) {
    console.error('Fetch error:', error)
    return null
  }
}

async function getCharacters(id: string) {
  try {
    const res = await fetch(`${API_URL}/anime/${id}/characters`, {
      next: { revalidate: 3600 }
    })
    if (!res.ok) return { data: [] }
    const json = await res.json()
    // API Route returns { data: [...] }
    return { data: json.data || [] }
  } catch (error) {
    return { data: [] }
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const data = await getAnime(params.id)
  if (!data || !data.data) {
    return {
      title: 'Anime Not Found | Animy',
    }
  }
  const anime = data.data
  return {
    title: `${anime.title} | Animy`,
    description: anime.synopsis?.slice(0, 160) || 'Anime details',
    openGraph: {
      title: anime.title,
      images: [anime.images?.jpg?.large_image_url || '']
    }
  }
}

export default async function AnimeDetailPage({ params }: { params: { id: string } }) {
  const animeData = await getAnime(params.id)

  if (!animeData || !animeData.data) {
    notFound()
  }

  const charactersData = await getCharacters(params.id)

  return (
    <AnimeDetailsClient
      anime={animeData.data}
      characters={charactersData.data || []}
    />
  )
}
