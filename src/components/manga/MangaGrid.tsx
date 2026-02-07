'use client'

import { Manga } from '@/types/manga'
import { MediaCard } from '@/components/common/MediaCard'

interface MangaGridProps {
    manga: Manga[]
}

export function MangaGrid({ manga }: MangaGridProps) {
    if (!manga || !Array.isArray(manga) || manga.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">No manga found</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {manga.map((item, index) => (
                <MediaCard
                    key={item.mal_id}
                    id={item.mal_id}
                    title={item.title}
                    image={item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url}
                    score={item.score}
                    type={item.type}
                    link={`/manga/${item.mal_id}`}
                    subtitle={item.published?.from ? new Date(item.published.from).getFullYear().toString() : 'Unknown'}
                    index={index}
                    genres={item.genres}
                    synopsis={item.synopsis}
                />
            ))}
        </div>
    )
}
