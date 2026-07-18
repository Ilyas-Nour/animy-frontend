'use client'

import { useState, useEffect, useCallback } from 'react'
import { EpisodeGrid } from './EpisodeGrid'
import { ChevronLeft, ChevronRight, Subtitles, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AdBanner } from '@/components/ads/AdBanner'

interface Episode {
    id: string
    number: number
    title?: string
    isFiller?: boolean
}

interface StreamingContainerProps {
    animeTitle: string
    animeTitleEnglish?: string
    animePoster?: string
    malId: number
    totalEpisodes?: number
    tmdbId?: string | number
}

export function StreamingContainer({
    animeTitle,
    animePoster,
    malId,
    totalEpisodes = 0,
}: StreamingContainerProps) {
    const [mounted, setMounted] = useState(false)
    const [selectedEp, setSelectedEp] = useState<Episode | null>(null)
    const [episodes, setEpisodes] = useState<Episode[]>([])
    const [subDub, setSubDub] = useState<'sub' | 'dub'>('sub')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

    const sortedEpisodes = sortOrder === 'asc' 
        ? episodes 
        : [...episodes].reverse()

    useEffect(() => {
        setMounted(true)
        // Generate episodes from totalEpisodes, fallback to 12 if unknown
        const count = totalEpisodes && totalEpisodes > 0 ? totalEpisodes : 12;
        const virtualEpisodes: Episode[] = Array.from({ length: count }, (_, i) => ({
            id: String(malId),
            number: i + 1,
            title: `Episode ${i + 1}`,
        }))
        setEpisodes(virtualEpisodes)
        setSelectedEp(virtualEpisodes[0])
    }, [totalEpisodes, malId])

    const currentEpNumber = selectedEp?.number ?? 1
    const prevEp = () => {
        const prev = episodes.find(e => e.number === currentEpNumber - 1)
        if (prev) setSelectedEp(prev)
    }
    const nextEp = () => {
        const next = episodes.find(e => e.number === currentEpNumber + 1)
        if (next) setSelectedEp(next)
    }

    if (!mounted) return null

    // Guard: VidLink needs the real MAL ID. If missing, show an error.
    if (!malId || malId === 0) {
        return (
            <div className="w-full flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                    <span className="text-2xl">⚠️</span>
                </div>
                <p className="text-white/60 font-semibold text-sm">MAL ID not available for this title.</p>
                <p className="text-white/30 text-xs max-w-xs">The streaming player requires a MyAnimeList ID which wasn&apos;t returned for this anime. Try searching on a different browser or check back later.</p>
            </div>
        )
    }

    // VidLink URL format — uses the real MAL ID with sub/dub in path
    const vidLinkUrl = `https://vidlink.pro/anime/${malId}/${currentEpNumber}/${subDub}?primaryColor=6366f1&secondaryColor=4f46e5&iconColor=ffffff&autoplay=false&fallback=true`

    return (
        <div className="space-y-5">
            {/* Dynamic JSON-LD Schema for SEO */}
            {selectedEp && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'TVEpisode',
                            episodeNumber: selectedEp.number.toString(),
                            name: selectedEp.title || `Episode ${selectedEp.number}`,
                            partOfSeries: {
                                '@type': 'TVSeries',
                                name: animeTitle
                            },
                            video: {
                                '@type': 'VideoObject',
                                name: `${animeTitle} Episode ${selectedEp.number}`,
                                description: `Watch ${animeTitle} Episode ${selectedEp.number} online in high quality.`,
                                thumbnailUrl: animePoster || '',
                                uploadDate: new Date().toISOString().split('T')[0]
                            }
                        })
                    }}
                />
            )}

            {/* ── Video Player ── */}
            <div className="relative bg-black rounded-3xl overflow-hidden border border-white/8 shadow-2xl shadow-black/60 group"
                style={{ aspectRatio: '16/9' }}>
                <iframe
                    key={vidLinkUrl}
                    src={vidLinkUrl}
                    className="w-full h-full border-0 bg-black"
                    allowFullScreen
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write"
                    referrerPolicy="no-referrer-when-downgrade"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-presentation"
                />
            </div>

            {/* ── Controls bar ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
                <div className="flex flex-col gap-0.5 min-w-0">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2 truncate">
                        Episode {currentEpNumber}
                    </h2>
                    <p className="text-[10px] text-white/30 font-medium truncate max-w-[280px]">
                        {selectedEp?.title || animeTitle}
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {/* Sub/Dub Toggle */}
                    <div className="flex p-0.5 bg-white/5 rounded-xl border border-white/10">
                        <button
                            onClick={() => setSubDub('sub')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                subDub === 'sub' ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                            )}
                        >
                            <Subtitles className="w-3.5 h-3.5" />
                            Sub
                        </button>
                        <button
                            onClick={() => setSubDub('dub')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                subDub === 'dub' ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                            )}
                        >
                            <Mic className="w-3.5 h-3.5" />
                            Dub
                        </button>
                    </div>

                    <div className="h-6 w-px bg-white/10 mx-1" />

                    {/* Navigation */}
                    <Button
                        size="sm"
                        variant="ghost"
                        disabled={currentEpNumber <= 1}
                        onClick={prevEp}
                        className="h-9 w-9 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 text-white/70 disabled:opacity-30"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        disabled={currentEpNumber >= episodes.length}
                        onClick={nextEp}
                        className="h-9 w-9 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 text-white/70 disabled:opacity-30"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Post-Video Ad Placement */}
            <div className="py-2">
                <AdBanner />
            </div>

            {/* ── Episode Grid ── */}
            {episodes.length > 0 && (
                <div className="pt-2">
                    <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-[10px] font-black text-white/25 uppercase tracking-[0.2em]">Episodes</h3>
                        <div className="h-px flex-1 bg-white/5" />
                        <span className="text-[10px] font-bold text-white/20">{episodes.length} total</span>
                        
                        {episodes.length > 0 && (
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="h-6 px-2 text-[10px] uppercase font-bold tracking-wider text-white/40 hover:text-white"
                            >
                                {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
                            </Button>
                        )}
                    </div>
                    <EpisodeGrid
                        episodes={sortedEpisodes}
                        currentEpisode={currentEpNumber}
                        onEpisodeSelect={(ep) => setSelectedEp(ep)}
                        fallbackImage={animePoster}
                    />
                </div>
            )}
        </div>
    )
}
