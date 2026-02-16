'use client'

import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { m } from 'framer-motion'
import { Star, Calendar, Tv } from 'lucide-react'
import { Anime } from '@/types/anime'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { truncateText } from '@/lib/utils'

interface AnimeCardProps {
  anime: Anime
  index?: number
}

export const AnimeCard = memo(function AnimeCard({ anime, index = 0 }: AnimeCardProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.5) }} // Cap delay
    >
      <Link href={`/anime/${anime.mal_id}`} className="block h-full">
        <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full border-white/5 bg-card/40 backdrop-blur-sm">
          <div className="relative aspect-[2/3] overflow-hidden bg-muted/20">
            <Image
              src={anime.images.webp?.large_image_url || anime.images.jpg.large_image_url}
              alt={anime.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500 will-change-transform"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              loading="lazy"
              quality={85}
            />
            {anime.score && (
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md rounded-lg px-2 py-1 flex items-center space-x-1 border border-white/10 shadow-xl">
                <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-white text-xs font-bold">
                  {anime.score.toFixed(1)}
                </span>
              </div>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </div>

          <CardContent className="p-3">
            <h3 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-tight" title={anime.title}>
              {anime.title}
            </h3>
            {/* Removed english title for cleaner looks / perf */}

            <div className="flex flex-wrap gap-1.5 mt-2">
              {anime.type && (
                <Badge variant="secondary" className="text-[10px] px-1.5 h-5 bg-primary/10 text-primary border-primary/20">
                  {anime.type}
                </Badge>
              )}
              {anime.year && (
                <Badge variant="outline" className="text-[10px] px-1.5 h-5 opacity-70">
                  {anime.year}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </m.div>
  )
})