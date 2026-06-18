'use client'

import { Anime } from '@/types/anime'
import { AnimeCard } from './AnimeCard'
export { AnimeGridSkeleton } from '@/components/common/Skeleton'
import { Tv } from 'lucide-react'

interface AnimeGridProps {
  anime: Anime[]
}

export function AnimeGrid({ anime }: AnimeGridProps) {
  if (!anime || anime.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center">
          <Tv className="w-9 h-9 text-muted-foreground opacity-50" />
        </div>
        <div className="text-center">
          <p className="text-muted-foreground font-semibold text-base">No anime found</p>
          <p className="text-muted-foreground/60 text-sm mt-1">Try adjusting your filters or search term</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 md:gap-4">
      {anime.map((item, index) => (
        <AnimeCard key={item.mal_id} anime={item} index={index} />
      ))}
    </div>
  )
}