import { useState, useEffect } from 'react'
import { Play, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

interface Episode {
    id: string
    number: number
    title?: string
    image?: string
    isFiller?: boolean
}

interface EpisodeGridProps {
    episodes: Episode[]
    currentEpisode?: number
    onEpisodeSelect: (episode: Episode) => void
    fallbackImage?: string
}

export function EpisodeGrid({ episodes, currentEpisode, onEpisodeSelect, fallbackImage }: EpisodeGridProps) {
    const [page, setPage] = useState(0)
    const PAGE_SIZE = 40 // Optimal balance between visual density and performance
    
    // Reset page when episodes array changes (e.g., sort order change)
    useEffect(() => {
        setPage(0)
        // Auto-navigate to the page containing the current episode
        if (currentEpisode) {
            const index = episodes.findIndex(ep => ep.number === currentEpisode)
            if (index !== -1) {
                setPage(Math.floor(index / PAGE_SIZE))
            }
        }
    }, [episodes, currentEpisode])

    if (!episodes || episodes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-card/30 rounded-2xl border border-white/5">
                <AlertCircle className="w-12 h-12 text-white/20 mb-4" />
                <h3 className="text-lg font-bold text-white/60">No Episodes Found</h3>
                <p className="text-sm text-white/40 mt-1">This anime doesn't have any episodes available yet.</p>
            </div>
        )
    }

    const pageCount = Math.ceil(episodes.length / PAGE_SIZE)
    const paginatedEpisodes = episodes.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

    return (
        <div className="space-y-6 relative">
            {/* Range Pagination Tabs (only show if needed) */}
            {pageCount > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent snap-x">
                    {Array.from({ length: pageCount }).map((_, i) => {
                        const startEp = i * PAGE_SIZE + 1
                        const endEp = Math.min((i + 1) * PAGE_SIZE, episodes.length)
                        const isActive = page === i
                        
                        return (
                            <button
                                key={i}
                                onClick={() => setPage(i)}
                                className={cn(
                                    "shrink-0 snap-start px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                                    isActive 
                                        ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)]" 
                                        : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/5"
                                )}
                            >
                                Eps {startEp} - {endEp}
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Premium Episode Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                <AnimatePresence mode="popLayout">
                    {paginatedEpisodes.map((episode, idx) => {
                        const isActive = episode.number === currentEpisode
                        const isFiller = episode.isFiller
                        
                        return (
                            <motion.button
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2, delay: idx * 0.02 }}
                                key={episode.id}
                                onClick={() => onEpisodeSelect(episode)}
                                className={cn(
                                    "group relative flex flex-col text-left overflow-hidden rounded-2xl bg-[#0a0a0a] border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl",
                                    isActive 
                                        ? "border-primary shadow-[0_0_30px_rgba(var(--primary),0.15)] ring-1 ring-primary/50" 
                                        : "border-white/5 hover:border-white/20"
                                )}
                            >
                                {/* Thumbnail Container */}
                                <div className="relative w-full aspect-video bg-muted/20 overflow-hidden">
                                    <Image 
                                        src={episode.image && !episode.image.includes('null') ? episode.image : (fallbackImage || '/placeholder.png')} 
                                        alt={`Episode ${episode.number}`}
                                        fill
                                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                                        className={cn(
                                            "object-cover transition-transform duration-700 group-hover:scale-105",
                                            isActive && "opacity-90"
                                        )}
                                    />
                                    
                                    {/* Gradients & Overlays */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                                    
                                    {/* Play Button Overlay on Hover */}
                                    <div className={cn(
                                        "absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-all duration-300",
                                        isActive ? "opacity-100 bg-primary/20" : "opacity-0 group-hover:opacity-100"
                                    )}>
                                        <div className={cn(
                                            "w-12 h-12 rounded-full flex items-center justify-center transform transition-transform duration-300",
                                            isActive ? "bg-primary scale-100" : "bg-white/20 backdrop-blur-md scale-90 group-hover:scale-100"
                                        )}>
                                            {isActive ? <Check className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white fill-white ml-1" />}
                                        </div>
                                    </div>

                                    {/* Badges */}
                                    <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
                                        <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-black text-white shadow-lg border border-white/10">
                                            EP {episode.number}
                                        </div>
                                        {isFiller && (
                                            <div className="bg-yellow-500/90 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold text-black shadow-lg">
                                                Filler
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Info Container */}
                                <div className="p-4 flex flex-col gap-1.5 flex-1 relative z-10 bg-gradient-to-b from-[#0a0a0a] to-background">
                                    <h4 className={cn(
                                        "text-sm sm:text-base font-bold line-clamp-2 leading-tight transition-colors duration-300",
                                        isActive ? "text-primary" : "text-white/90 group-hover:text-white"
                                    )}>
                                        {episode.title && episode.title.toLowerCase() !== `episode ${episode.number}` 
                                            ? episode.title 
                                            : `Episode ${episode.number}`}
                                    </h4>
                                    
                                    {isActive && (
                                        <p className="text-xs font-medium text-primary/80 uppercase tracking-widest mt-1">
                                            Currently Playing
                                        </p>
                                    )}
                                </div>
                                
                                {/* Active Bottom Glow */}
                                {isActive && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
                                )}
                            </motion.button>
                        )
                    })}
                </AnimatePresence>
            </div>
        </div>
    )
}
