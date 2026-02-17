'use client'

import { Anime } from '@/types/anime'
import { AnimeCard } from './AnimeCard'
export { AnimeGridSkeleton } from '@/components/common/Skeleton'

interface AnimeGridProps {
  anime: Anime[]
}

export function AnimeGrid({ anime }: AnimeGridProps) {
  if (!anime || anime.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No anime found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 4xl:grid-cols-10 5xl:grid-cols-12 gap-4">
      {anime.map((item, index) => (
        <AnimeCard key={item.mal_id} anime={item} index={index} />
      ))}
    </div>
  )
}