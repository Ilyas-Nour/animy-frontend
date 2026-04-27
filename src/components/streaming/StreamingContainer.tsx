'use client'

import { useState, useEffect, useRef } from 'react'
import { EpisodeGrid } from './EpisodeGrid'
import { Loader2, Wifi, AlertCircle, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StreamingContainerProps {
    animeTitle: string
    animeTitleEnglish?: string
    animePoster?: string
    malId: number
    totalEpisodes?: number
}

interface Server {
    id: string
    name: string
    badge: string
    getUrl: (malId: number, ep: number) => string
}

// Correct URL formats researched and verified
const SERVERS: Server[] = [
    {
        id: 'vidlink-sub',
        name: 'VidLink',
        badge: 'Stable · Sub',
        getUrl: (malId, ep) =>
            `https://vidlink.pro/anime/${malId}/${ep}/sub?primaryColor=6366f1&secondaryColor=a855f7&iconColor=ffffff&autoplay=false&fallback=true`,
    },
    {
        id: 'vidlink-dub',
        name: 'VidLink DUB',
        badge: 'Stable · Dub',
        getUrl: (malId, ep) =>
            `https://vidlink.pro/anime/${malId}/${ep}/dub?primaryColor=6366f1&secondaryColor=a855f7&iconColor=ffffff&autoplay=false&fallback=true`,
    },
    {
        id: 'vidsrc',
        name: 'VidSrc',
        badge: 'Fast',
        getUrl: (malId, ep) =>
            `https://vidsrc.to/embed/anime/${malId}/${ep}`,
    },
    {
        id: 'vidsrc2',
        name: 'VidSrc.xyz',
        badge: 'Alt',
        getUrl: (malId, ep) =>
            `https://vidsrc.xyz/embed/anime/${malId}/${ep}`,
    },
]

export function StreamingContainer({
    animeTitle,
    animeTitleEnglish,
    animePoster,
    malId,
    totalEpisodes = 0,
}: StreamingContainerProps) {
    const [mounted, setMounted] = useState(false)
    const [selectedEpisode, setSelectedEpisode] = useState(1)
    const [activeServer, setActiveServer] = useState<Server>(SERVERS[0])
    const [iframeKey, setIframeKey] = useState(0)
    const [iframeLoaded, setIframeLoaded] = useState(false)
    const iframeRef = useRef<HTMLIFrameElement>(null)

    useEffect(() => { setMounted(true) }, [])

    // Reload iframe when server or episode changes
    useEffect(() => {
        setIframeLoaded(false)
        setIframeKey(k => k + 1)
    }, [selectedEpisode, activeServer])

    const episodes = Array.from({ length: Math.max(totalEpisodes, 1) }, (_, i) => ({
        id: String(i + 1),
        number: i + 1,
        title: `Episode ${i + 1}`,
    }))

    const handleEpisodeSelect = (ep: any) => setSelectedEpisode(ep.number)
    const prevEp = () => setSelectedEpisode(p => Math.max(1, p - 1))
    const nextEp = () => setSelectedEpisode(p => Math.min(episodes.length, p + 1))

    const hiAnimeSearchUrl = `https://hianime.to/search?keyword=${encodeURIComponent(animeTitleEnglish || animeTitle)}`

    if (!mounted) {
        return (
            <div className="w-full py-16 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        )
    }

    if (!malId) {
        return (
            <div className="w-full py-12 flex flex-col items-center gap-4">
                <AlertCircle className="w-10 h-10 text-yellow-500/50" />
                <p className="text-white/50 text-sm text-center">
                    MAL ID is missing for this anime. Streaming is unavailable.
                </p>
                <a href={hiAnimeSearchUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-2 border-white/10">
                        <ExternalLink className="w-4 h-4" /> Watch on HiAnime
                    </Button>
                </a>
            </div>
        )
    }

    const iframeUrl = activeServer.getUrl(malId, selectedEpisode)

    return (
        <div className="space-y-5">

            {/* ── Server Selector ── */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Wifi className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                        Transmission Nodes
                    </span>
                    <div className="flex-1 h-px bg-white/5" />
                    {/* External fallback link */}
                    <a
                        href={hiAnimeSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[10px] text-indigo-400/70 hover:text-indigo-300 transition-colors font-bold uppercase tracking-widest"
                    >
                        <ExternalLink className="w-3 h-3" /> HiAnime
                    </a>
                </div>
                <div className="flex flex-wrap gap-2">
                    {SERVERS.map((server) => (
                        <button
                            key={server.id}
                            onClick={() => setActiveServer(server)}
                            className={cn(
                                'h-9 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all duration-200',
                                activeServer.id === server.id
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20 scale-[1.02]'
                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                            )}
                        >
                            {server.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Video Player ── */}
            <div className="relative bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                 style={{ aspectRatio: '16/9' }}>

                {/* Loading overlay */}
                {!iframeLoaded && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                            Connecting to {activeServer.name}...
                        </p>
                    </div>
                )}

                <iframe
                    ref={iframeRef}
                    key={`${activeServer.id}-ep${selectedEpisode}-${iframeKey}`}
                    src={iframeUrl}
                    className="w-full h-full border-0"
                    allowFullScreen
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    referrerPolicy="no-referrer-when-downgrade"
                    onLoad={() => setIframeLoaded(true)}
                    onError={() => setIframeLoaded(true)} // Show even on error so user sees server message
                />

                {/* Server badge */}
                <div className="absolute top-3 left-3 z-10 pointer-events-none">
                    <div className="px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-[9px] uppercase font-black tracking-[0.2em] text-indigo-300 border border-indigo-500/20">
                        {activeServer.badge}
                    </div>
                </div>
            </div>

            {/* ── Episode Info + Navigation ── */}
            <div className="flex items-center justify-between px-1 gap-4">
                <p className="text-sm text-white/50 truncate">
                    Ep <span className="text-white font-bold">{selectedEpisode}</span>
                    {totalEpisodes > 1 && <span className="text-white/30"> / {totalEpisodes}</span>}
                    {animeTitle && <span className="text-white/30 ml-1.5">— {animeTitle}</span>}
                </p>
                <div className="flex gap-2 shrink-0">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={selectedEpisode <= 1}
                        onClick={prevEp}
                        className="h-8 px-3 border-white/10 bg-white/5 hover:bg-white/10 text-xs gap-1"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" /> Prev
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={selectedEpisode >= episodes.length}
                        onClick={nextEp}
                        className="h-8 px-3 border-white/10 bg-white/5 hover:bg-white/10 text-xs gap-1"
                    >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {/* ── Not working? tip ── */}
            <p className="text-[11px] text-white/25 text-center">
                If the player is black or shows an error, try switching servers above.
                New seasonal anime may only be available on HiAnime.
            </p>

            {/* ── Episode Grid ── */}
            {episodes.length > 1 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">
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
