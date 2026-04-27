'use client'

import { useState, useEffect } from 'react'
import { EpisodeGrid } from './EpisodeGrid'
import { Loader2, Wifi } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StreamingContainerProps {
    animeTitle: string
    animeTitleEnglish?: string
    animePoster?: string
    malId: number
    totalEpisodes?: number
    anilistId?: number
}

interface Server {
    id: string
    name: string
    label: string
    getUrl: (malId: number, ep: number) => string
}

const SERVERS: Server[] = [
    {
        id: 'vidlink',
        name: 'VidLink',
        label: 'Server 1 (Stable)',
        getUrl: (malId, ep) => `https://vidlink.pro/anime/${malId}/${ep}?primaryColor=6366f1&secondaryColor=a855f7&iconColor=ffffff&autoplay=true`,
    },
    {
        id: 'vidsrc',
        name: 'VidSrc.to',
        label: 'Server 2 (Fast)',
        getUrl: (malId, ep) => `https://vidsrc.to/embed/anime/${malId}/${ep}`,
    },
    {
        id: 'vidsrc2',
        name: 'VidSrc.me',
        label: 'Server 3 (Alt)',
        getUrl: (malId, ep) => `https://vidsrc.me/embed/anime?mal=${malId}&episode=${ep}`,
    },
    {
        id: 'animepahe',
        name: 'AnimePahe',
        label: 'Server 4 (HD)',
        getUrl: (malId, ep) => `https://animepahe.ru/embed/${malId}/${ep}`,
    },
]

export function StreamingContainer({
    animeTitle,
    animeTitleEnglish,
    animePoster,
    malId,
    totalEpisodes = 0,
    anilistId,
}: StreamingContainerProps) {
    const [mounted, setMounted] = useState(false)
    const [selectedEpisode, setSelectedEpisode] = useState(1)
    const [activeServer, setActiveServer] = useState<Server>(SERVERS[0])
    const [iframeKey, setIframeKey] = useState(0) // Force reload iframe on server/ep change
    const [iframeLoading, setIframeLoading] = useState(true)

    useEffect(() => {
        setMounted(true)
    }, [])

    // When episode or server changes, reload iframe
    useEffect(() => {
        setIframeLoading(true)
        setIframeKey(prev => prev + 1)
    }, [selectedEpisode, activeServer])

    const episodes = Array.from({ length: Math.max(totalEpisodes, 1) }, (_, i) => ({
        id: String(i + 1),
        number: i + 1,
        title: `Episode ${i + 1}`,
    }))

    const handleEpisodeSelect = (ep: any) => {
        setSelectedEpisode(ep.number)
    }

    if (!mounted) {
        return (
            <div className="w-full py-16 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        )
    }

    if (!malId) {
        return (
            <div className="w-full py-12 flex items-center justify-center">
                <p className="text-white/50 text-sm">Streaming unavailable — MAL ID missing.</p>
            </div>
        )
    }

    const iframeUrl = activeServer.getUrl(malId, selectedEpisode)

    return (
        <div className="space-y-4">
            {/* Server selector */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs text-white/40 uppercase tracking-widest font-black">
                    <Wifi className="w-3.5 h-3.5 text-indigo-400" />
                    Transmission Nodes
                </div>
                <div className="flex flex-wrap gap-2">
                    {SERVERS.map((server) => (
                        <Button
                            key={server.id}
                            size="sm"
                            variant={activeServer.id === server.id ? 'default' : 'outline'}
                            onClick={() => setActiveServer(server)}
                            className={cn(
                                'text-[11px] h-9 px-4 font-black uppercase tracking-widest transition-all rounded-xl border',
                                activeServer.id === server.id
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20 scale-[1.02]'
                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                            )}
                        >
                            {server.name}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Video player */}
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                {iframeLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                                Connecting to {activeServer.name}...
                            </p>
                        </div>
                    </div>
                )}
                <iframe
                    key={`${activeServer.id}-${selectedEpisode}-${iframeKey}`}
                    src={iframeUrl}
                    className="w-full h-full border-0"
                    allowFullScreen
                    allow="autoplay; encrypted-media; picture-in-picture"
                    referrerPolicy="no-referrer-when-downgrade"
                    onLoad={() => setIframeLoading(false)}
                />
                {/* Server badge */}
                <div className="absolute top-3 right-3 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-[9px] uppercase font-black tracking-widest text-indigo-300 border border-indigo-500/20 pointer-events-none">
                    {activeServer.label}
                </div>
            </div>

            {/* Episode info bar */}
            <div className="flex items-center justify-between px-1">
                <p className="text-sm text-white/60">
                    Now watching: <span className="text-white font-bold">Episode {selectedEpisode}</span>
                    {animeTitle && <span className="text-white/40"> — {animeTitle}</span>}
                </p>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={selectedEpisode <= 1}
                        onClick={() => setSelectedEpisode(prev => Math.max(1, prev - 1))}
                        className="text-xs border-white/10 bg-white/5 hover:bg-white/10 h-8 px-3"
                    >
                        ← Prev
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={selectedEpisode >= episodes.length}
                        onClick={() => setSelectedEpisode(prev => Math.min(episodes.length, prev + 1))}
                        className="text-xs border-white/10 bg-white/5 hover:bg-white/10 h-8 px-3"
                    >
                        Next →
                    </Button>
                </div>
            </div>

            {/* Episode Grid */}
            {episodes.length > 1 && (
                <div className="space-y-3">
                    <h3 className="text-base font-black text-white/80 uppercase tracking-widest text-xs">
                        Episodes ({episodes.length})
                    </h3>
                    <EpisodeGrid
                        episodes={episodes}
                        currentEpisode={selectedEpisode}
                        onEpisodeSelect={handleEpisodeSelect}
                        fallbackImage={animePoster}
                    />
                </div>
            )}
        </div>
    )
}
