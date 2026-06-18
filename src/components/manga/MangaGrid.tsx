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
                <div className="w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center">
                    <BookOpen className="w-9 h-9 text-muted-foreground opacity-50" />
                </div>
                <div className="text-center">
                    <p className="text-muted-foreground font-semibold text-base">No manga found</p>
                    <p className="text-muted-foreground/60 text-sm mt-1">Try adjusting your filters or search term</p>
                </div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 md:gap-4">
            {manga.map((item, index) => (
                <MediaCard
                    key={item.mal_id}
                    item={item}
                    type="manga"
                    index={index}
                />
            ))}
        </div>
    )
}
