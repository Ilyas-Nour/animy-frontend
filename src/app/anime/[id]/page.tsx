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

// Data Transformation Mappers
const mapCharacters = (characters: any[] = []) => {
  return characters.map(char => ({
    role: char.role,
    node: {
      id: char.character.mal_id,
      name: { full: char.character.name },
      image: { large: char.character.images?.jpg?.image_url }
    },
    voiceActors: (char.voice_actors || []).map((va: any) => ({
      id: va.person.mal_id,
      name: { full: va.person.name },
      image: { large: va.person.images?.jpg?.image_url }
    }))
  }))
}

const mapStaff = (staff: any[] = []) => {
  return staff.map(s => ({
    role: s.positions?.join(', ') || 'Staff',
    node: {
      id: s.person.mal_id,
      name: { full: s.person.name },
      image: { large: s.person.images?.jpg?.image_url }
    }
  }))
}

const mapRelations = (relations: any[] = []) => {
  const result: any[] = []
  relations.forEach(rel => {
    (rel.entry || []).forEach((entry: any) => {
      result.push({
        relationType: rel.relation,
        node: {
          id: entry.mal_id,
          idMal: entry.mal_id,
          type: entry.type,
          title: { romaji: entry.name, english: entry.name },
          coverImage: { large: `https://cdn.myanimelist.net/images/anime/${entry.mal_id % 100}/${entry.mal_id}.jpg` } // Jikan doesn't provide relation images in /full, we attempt a fallback or accept placeholders
        }
      })
    })
  })
  return result
}

const mapRecommendations = (recs: any[] = []) => {
  return recs.map(rec => ({
    mediaRecommendation: {
      id: rec.entry.mal_id,
      title: { romaji: rec.entry.title, english: rec.entry.title },
      coverImage: { large: rec.entry.images?.jpg?.large_image_url || rec.entry.images?.jpg?.image_url }
    }
  }))
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
  const rawAnime = await getAnimeFull(id)

  if (!rawAnime) {
    notFound()
  }

  // Transform Jikan data into the AniList-like structure the UI expects
  const anime = {
    ...rawAnime,
    characters: mapCharacters(rawAnime.characters),
    staff: mapStaff(rawAnime.staff),
    relations: mapRelations(rawAnime.relations),
    recommendations: mapRecommendations(rawAnime.recommendations)
  }

  return (
    <AnimeDetailsClient
      anime={anime}
    />
  )
}
