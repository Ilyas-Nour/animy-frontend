'use client'

import { Manga } from '@/types/manga'
import { MediaCard } from '@/components/common/MediaCard'
import { BookOpen } from 'lucide-react'

interface MangaGridProps {
    manga: Manga[]
}

export function MangaGrid({ manga }: MangaGridProps) {
    if (!manga || !Array.isArray(manga) || manga.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <BookOpen className="w-9 h-9 text-white/20" />
                </div>
                <div className="text-center">
                    <p className="text-white/50 font-semibold text-base">No manga found</p>
                    <p className="text-white/25 text-sm mt-1">Try adjusting your filters or search term</p>
                </div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 md:gap-4">
            {manga.map((item, index) => (
                <MediaCard
                    key={item.mal_id}
                    id={item.mal_id}
                    title={item.title}
                    image={item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url}
                    score={item.score}
                    type={item.type}
                    link={`/manga/${item.mal_id}`}
                    subtitle={item.published?.from ? new Date(item.published.from).getFullYear().toString() : undefined}
                    index={index}
                    genres={item.genres}
                    synopsis={item.synopsis}
                />
            ))}
        </div>
    )
}
