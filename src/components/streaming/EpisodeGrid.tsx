'use client'

import { Play, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface Episode {
    id: string
    number: number
    title?: string
    image?: string
}

interface EpisodeGridProps {
    episodes: Episode[]
    currentEpisode?: number
    onEpisodeSelect: (episode: Episode) => void
    fallbackImage?: string
}

export function EpisodeGrid({ episodes, currentEpisode, onEpisodeSelect, fallbackImage }: EpisodeGridProps) {
    if (!episodes || episodes.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-white/60">No episodes available</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {episodes.map((episode) => {
                const isActive = episode.number === currentEpisode

                return (
                    <button
                        key={episode.id}
                        onClick={() => onEpisodeSelect(episode)}
                        className={cn(
                            "group relative aspect-video rounded-lg overflow-hidden transition-all duration-200",
                            "border-2 hover:scale-105 hover:shadow-xl",
                            isActive
                                ? "border-indigo-500 bg-indigo-500/20 shadow-lg shadow-indigo-500/50"
                                : "border-white/10 bg-white/5 hover:border-indigo-400"
                        )}
                    >
                        {/* Episode Image (if available or fallback) */}
                        {(episode.image || fallbackImage) && (
                            <div className="absolute inset-0">
                                <Image
                                    src={episode.image || fallbackImage || ''}
                                    alt={`Episode ${episode.number}`}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    unoptimized
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            </div>
                        )}

                        {/* Episode Number */}
                        <div className="relative h-full flex flex-col items-center justify-center p-2">
                            <div className={cn(
                                "text-2xl font-black mb-1",
                                isActive ? "text-indigo-300" : "text-white"
                            )}>
                                {episode.number}
                            </div>

                            {episode.title && (
                                <div className="text-[10px] text-white/60 text-center line-clamp-2 px-1">
                                    {episode.title}
                                </div>
                            )}

                            {/* Play/Check Icon */}
                            <div className={cn(
                                "absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center",
                                isActive ? "bg-indigo-500" : "bg-black/50 opacity-0 group-hover:opacity-100"
                            )}>
                                {isActive ? (
                                    <Check className="w-4 h-4 text-white" />
                                ) : (
                                    <Play className="w-3 h-3 text-white fill-white" />
                                )}
                            </div>
                        </div>
                    </button>
                )
            })}
        </div>
    )
}
