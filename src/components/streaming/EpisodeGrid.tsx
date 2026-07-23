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
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
            {episodes.map((episode) => {
                const isActive = episode.number === currentEpisode
                const isFiller = episode.isFiller

                return (
                    <button
                        key={episode.id}
                        onClick={() => onEpisodeSelect(episode)}
                        title={episode.title ? `Episode ${episode.number}: ${episode.title}${isFiller ? ' (Filler)' : ''}` : `Episode ${episode.number}`}
                        className={cn(
                            "group relative flex items-center justify-center w-full aspect-square rounded-md transition-all duration-200 font-bold text-sm",
                            isActive
                                ? "bg-primary text-white shadow-lg shadow-primary/30"
                                : isFiller 
                                    ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 hover:text-yellow-400 border border-yellow-500/20"
                                    : "bg-white/5 text-white/70 hover:bg-white/15 hover:text-white border border-white/10"
                        )}
                    >
                        <span>{episode.number}</span>
                        {isActive && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <Check className="w-2 h-2 text-primary" />
                            </div>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
