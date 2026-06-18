'use client'

import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { m } from 'framer-motion'
import { Star, Play } from 'lucide-react'
import { Anime } from '@/types/anime'
import { truncateText } from '@/lib/utils'

interface AnimeCardProps {
  anime: Anime
  index?: number
}

export const AnimeCard = memo(function AnimeCard({ anime, index = 0 }: AnimeCardProps) {
  const genres = (anime as any).genres as { name: string; mal_id: number }[] | undefined

  return (
    <m.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.4, ease: 'easeOut' }}
      className="group relative"
    >
      <Link href={`/anime/${anime.mal_id}`} className="block h-full">
        <div className="relative overflow-hidden rounded-xl bg-white/5 border border-white/8 transition-all duration-300 group-hover:border-purple-500/40 group-hover:shadow-[0_8px_32px_rgba(139,92,246,0.15)] h-full">
          {/* Image */}
          <div className="relative aspect-[2/3] overflow-hidden bg-white/5">
            <Image
              src={anime.images.webp?.large_image_url || anime.images.jpg.large_image_url}
              alt={anime.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-108 will-change-transform"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              loading="lazy"
              quality={85}
            />

            {/* Score Badge */}
            {anime.score && (
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-md rounded-md px-1.5 py-0.5 border border-yellow-400/30 shadow-[0_0_8px_rgba(250,204,21,0.2)]">
                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                <span className="text-yellow-300 text-[11px] font-bold leading-none">{anime.score.toFixed(1)}</span>
              </div>
            )}

            {/* Type Badge */}
            {anime.type && (
              <div className="absolute top-2 right-2 bg-purple-600/80 backdrop-blur-md rounded-md px-1.5 py-0.5 border border-purple-400/30">
                <span className="text-white text-[10px] font-bold uppercase tracking-wider">{anime.type}</span>
              </div>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Play Button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-purple-600/90 backdrop-blur-sm border border-purple-400/50 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.5)] translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              </div>
            </div>

            {/* Genre Chips on Hover */}
            {genres && genres.length > 0 && (
              <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                {genres.slice(0, 3).map((g) => (
                  <span
                    key={g.mal_id}
                    className="text-[9px] font-semibold uppercase tracking-wide bg-white/15 backdrop-blur-sm text-white border border-white/20 rounded-full px-2 py-0.5"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-2.5">
            <h3
              className="font-semibold text-xs leading-snug line-clamp-2 text-white/90 group-hover:text-purple-300 transition-colors duration-200"
              title={anime.title}
            >
              {anime.title}
            </h3>
            {anime.year && (
              <p className="text-[10px] text-white/35 mt-1 font-medium">{anime.year}</p>
            )}
          </div>
        </div>
      </Link>
    </m.div>
  )
})