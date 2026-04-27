'use client'

import { useState, useEffect, useRef } from 'react'
import Hls from 'hls.js'
import { EpisodeGrid } from './EpisodeGrid'
import { Loader2, Wifi, AlertCircle, ExternalLink, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

interface StreamingContainerProps {
    animeTitle: string
    animeTitleEnglish?: string
    animePoster?: string
    malId: number
    totalEpisodes?: number
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface Episode {
    id: string
    number: number
    title?: string
    isFiller?: boolean
}

interface Server {
    name: string
    url: string
    provider: string
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function StreamingContainer({
    animeTitle,
    animeTitleEnglish,
    animePoster,
    malId,
    totalEpisodes = 0,
}: StreamingContainerProps) {
    const [mounted, setMounted] = useState(false)

    // HiAnime state
    const [hiEpisodes, setHiEpisodes] = useState<Episode[]>([])
    const [hiLoading, setHiLoading] = useState(true)
    const [hiError, setHiError] = useState<string | null>(null)

    // Selected episode
    const [selectedEp, setSelectedEp] = useState<Episode | null>(null)

    // Streaming data from backend
    const [streamData, setStreamData] = useState<any>(null)
    const [streamLoading, setStreamLoading] = useState(false)
    const [streamError, setStreamError] = useState<string | null>(null)

    // Active server (picked from streamData.servers)
    const [activeServer, setActiveServer] = useState<Server | null>(null)
    const [iframeLoaded, setIframeLoaded] = useState(false)
    const [iframeKey, setIframeKey] = useState(0)

    const hiAnimeSearchUrl = `https://gogoanime3.co/search.html?keyword=${encodeURIComponent(animeTitle)}`

    useEffect(() => { setMounted(true) }, [])

    // ── Phase 1: Load Episodes ───────────────────────────────────────────────
    useEffect(() => {
        if (!mounted || !animeTitle) return
        findAndLoadEpisodes()
    }, [mounted, animeTitle])

    const findAndLoadEpisodes = async () => {
        setHiLoading(true)
        setHiError(null)
        try {
            const searchRes = await api.get(
                `/streaming/find?title=${encodeURIComponent(animeTitle)}&titleEnglish=${encodeURIComponent(animeTitleEnglish || '')}&anilistId=${malId}`
            )
            const results = Array.isArray(searchRes.data.data)
                ? searchRes.data.data
                : searchRes.data.data?.results || searchRes.data.results || []

            if (!results.length) throw new Error('No Nodes Active')

            const animeId = results[0].id
            const infoRes = await api.get(`/streaming/anime/${encodeURIComponent(animeId)}`)
            const info = infoRes.data.data || infoRes.data

            if (!info?.episodes?.length) throw new Error('No Data Stream')

            const episodes: Episode[] = info.episodes.map((ep: any) => ({
                id: ep.id || ep.episodeId,
                number: ep.number || ep.episodeNumber || 1,
                title: ep.title,
                isFiller: ep.isFiller,
            }))

            setHiEpisodes(episodes)
            setSelectedEp(episodes[0])
        } catch (e: any) {
            setHiError(e.message || 'Mesh Offline')
            // Fall back to basic list if search fails
            const basicEps = Array.from({ length: Math.max(totalEpisodes, 1) }, (_, i) => ({
                id: String(i + 1),
                number: i + 1,
                title: `Episode ${i + 1}`,
            }))
            setHiEpisodes(basicEps)
            setSelectedEp(basicEps[0])
        } finally {
            setHiLoading(false)
        }
    }

    // ── Phase 2: Fetch Streaming Links ───────────────────────────────────────
    useEffect(() => {
        if (!selectedEp) return
        fetchStreamSources(selectedEp)
    }, [selectedEp])

    const fetchStreamSources = async (ep: Episode) => {
        setStreamLoading(true)
        setStreamError(null)
        setIframeLoaded(false)
        try {
            const res = await api.get(
                `/streaming/episode/${encodeURIComponent(ep.id)}?provider=hianime&malId=${malId}&ep=${ep.number}`
            )
            const data = res.data.data || res.data
            
            setStreamData(data)
            
            // Pick HiAnime as primary if available, else first available
            const primary = data.servers?.find((s: any) => s.provider === 'hianime') || data.servers?.[0]
            if (primary) {
                setActiveServer(primary)
                setIframeKey(k => k + 1)
            } else {
                throw new Error('No servers available')
            }
        } catch (e: any) {
            setStreamError(e.message)
        } finally {
            setStreamLoading(false)
        }
    }

    const switchServer = (server: Server) => {
        setActiveServer(server)
        setIframeLoaded(false)
        setIframeKey(k => k + 1)
    }

    const currentEpNumber = selectedEp?.number ?? 1
    const prevEp = () => {
        const prev = hiEpisodes.find(e => e.number === currentEpNumber - 1)
        if (prev) setSelectedEp(prev)
    }
    const nextEp = () => {
        const next = hiEpisodes.find(e => e.number === currentEpNumber + 1)
        if (next) setSelectedEp(next)
    }

    if (!mounted) return (
        <div className="w-full py-16 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
    )

    return (
        <div className="space-y-5">

            {/* ── Server Bar ── */}
            <div className="flex flex-wrap items-center gap-2">
                <div className={cn(
                    'flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border',
                    hiLoading ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10'
                        : hiError ? 'text-red-400 border-red-500/20 bg-red-500/10'
                            : 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10'
                )}>
                    <Wifi className="w-3 h-3" />
                    {hiLoading ? 'Locating Node...' : hiError ? 'Mesh Offline' : 'Mesh Online'}
                </div>

                <div className="flex-1 flex flex-wrap gap-2">
                    {streamData?.servers?.map((s: Server, idx: number) => (
                        <button
                            key={`${s.provider}-${idx}`}
                            onClick={() => switchServer(s)}
                            className={cn(
                                'h-8 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-200',
                                activeServer?.url === s.url
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20 scale-[1.02]'
                                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                            )}
                        >
                            {s.name}
                        </button>
                    ))}
                </div>

                <a href={hiAnimeSearchUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[10px] text-indigo-400/70 hover:text-indigo-300 transition-colors font-bold uppercase tracking-widest">
                    <ExternalLink className="w-3 h-3" /> External
                </a>
            </div>

            {/* ── Video Player ── */}
            <div className="relative bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 group"
                style={{ aspectRatio: '16/9' }}>

                {/* Loading/Error State */}
                {(streamLoading || !iframeLoaded) && !streamError && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0a0a0b] gap-4">
                        <div className="relative">
                             <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20" />
                             <div className="absolute inset-0 w-12 h-12 rounded-full border-t-2 border-indigo-500 animate-spin" />
                        </div>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
                            Initializing Stream...
                        </p>
                    </div>
                )}

                {streamError && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0a0a0b] gap-4 px-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500/30" />
                        <div className="space-y-1">
                            <p className="text-white font-bold">Node Connection Failed</p>
                            <p className="text-white/40 text-xs">The selected server is currently unresponsive. Try another one.</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => selectedEp && fetchStreamSources(selectedEp)} className="mt-2 border-white/10">
                            <RefreshCw className="w-3.5 h-3.5 mr-2" /> Retry Node
                        </Button>
                    </div>
                )}

                {/* The Player Iframe */}
                {activeServer && (
                    <iframe
                        key={`${activeServer.url}-${iframeKey}`}
                        src={activeServer.url}
                        className="w-full h-full border-0"
                        allowFullScreen
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        referrerPolicy="no-referrer-when-downgrade"
                        onLoad={() => setIframeLoaded(true)}
                    />
                )}

                {/* Overlay Badge */}
                <div className="absolute top-4 left-4 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="px-3 py-1.5 bg-black/60 backdrop-blur-xl rounded-2xl text-[9px] uppercase font-black tracking-[0.2em] text-indigo-400 border border-white/10">
                        {activeServer?.name || 'Loading'}
                    </div>
                </div>
            </div>

            {/* ── Controls ── */}
            <div className="flex items-center justify-between px-2">
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        Episode {currentEpNumber}
                        {selectedEp?.isFiller && <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 text-[8px] uppercase tracking-tighter rounded border border-yellow-500/20">Filler</span>}
                    </h2>
                    <p className="text-[10px] text-white/40 font-medium truncate max-w-[300px]">
                        {selectedEp?.title || animeTitle}
                    </p>
                </div>

                <div className="flex gap-2 shrink-0">
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        disabled={currentEpNumber <= 1} 
                        onClick={prevEp}
                        className="h-9 w-9 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 text-white/70"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        disabled={currentEpNumber >= hiEpisodes.length} 
                        onClick={nextEp}
                        className="h-9 w-9 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 text-white/70"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* ── Episodes ── */}
            {hiEpisodes.length > 0 && (
                <div className="pt-2">
                    <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Transmission Units</h3>
                        <div className="h-px flex-1 bg-white/5" />
                        <span className="text-[10px] font-bold text-white/20 tracking-tighter">{hiEpisodes.length} total</span>
                    </div>
                    <EpisodeGrid
                        episodes={hiEpisodes}
                        currentEpisode={currentEpNumber}
                        onEpisodeSelect={(ep) => setSelectedEp(ep)}
                        fallbackImage={animePoster}
                    />
                </div>
            )}
        </div>
    )
}
