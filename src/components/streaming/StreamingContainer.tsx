'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Hls from 'hls.js'
import { EpisodeGrid } from './EpisodeGrid'
import { Loader2, Wifi, AlertCircle, ExternalLink, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import ArtPlayer from './ArtPlayer'

interface StreamingContainerProps {
    animeTitle: string
    animeTitleEnglish?: string
    animePoster?: string
    malId: number
    totalEpisodes?: number
    tmdbId?: string | number
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
    url?: string
    sources?: Array<{ url: string; quality: string; isM3U8: boolean }>
    subtitles?: Array<{ url: string; lang: string; label: string }>
    provider: string
    isNative?: boolean
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function StreamingContainer({
    animeTitle,
    animeTitleEnglish,
    animePoster,
    malId,
    totalEpisodes = 0,
    tmdbId,
}: StreamingContainerProps) {
    const [mounted, setMounted] = useState(false)

    // State
    const [hiEpisodes, setHiEpisodes] = useState<Episode[]>([])
    const [hiLoading, setHiLoading] = useState(true)
    const [hiError, setHiError] = useState<string | null>(null)
    const [selectedEp, setSelectedEp] = useState<Episode | null>(null)
    const [streamData, setStreamData] = useState<any>(null)
    const [streamLoading, setStreamLoading] = useState(false)
    const [streamError, setStreamError] = useState<string | null>(null)
    const [activeServer, setActiveServer] = useState<Server | null>(null)
    const [iframeLoaded, setIframeLoaded] = useState(false)
    const [iframeKey, setIframeKey] = useState(0)

    const externalSearchUrl = `https://anikai.to/browser?keyword=${encodeURIComponent(animeTitle)}`

    useEffect(() => { setMounted(true) }, [])

    // ── Phase 1: Load Episodes ───────────────────────────────────────────────
    const findAndLoadEpisodes = useCallback(async () => {
        if (!animeTitle) return
        setHiLoading(true)
        setHiError(null)
        
        try {
            console.debug(`Mesh Discovery Phase 1: "${animeTitle}"`)
            const results = await Promise.race([
                api.get(`/streaming/find?title=${encodeURIComponent(animeTitle)}&titleEnglish=${encodeURIComponent(animeTitleEnglish || '')}&anilistId=${malId}`)
                    .then(res => {
                        const rawData = res.data.data || res.data
                        return Array.isArray(rawData) ? rawData : rawData.results ? rawData.results : [rawData]
                    }),
                new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error('Mesh Timeout')), 5000))
            ])

            if (!results.length || !results[0].id) throw new Error('No Nodes Active')

            const animeId = results[0].id
            const infoRes = await Promise.race([
                api.get(`/streaming/anime/${encodeURIComponent(animeId)}`),
                new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Metadata Timeout')), 5000))
            ])
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
            console.debug(`Mesh Discovery SUCCESS: ${episodes.length} episodes found.`)
        } catch (e: any) {
            console.warn('Mesh Discovery failed, engaging Nuclear Fallback:', e.message)
            
            const count = totalEpisodes > 0 ? totalEpisodes : 1
            const virtualEpisodes: Episode[] = Array.from({ length: count }, (_, i) => ({
                id: String(malId),
                number: i + 1,
                title: `Episode ${i + 1}`,
            }))

            setHiEpisodes(virtualEpisodes)
            if (virtualEpisodes.length > 0) {
                setSelectedEp(virtualEpisodes[0])
            }
            setHiError(e.message)
        } finally {
            setHiLoading(false)
        }
    }, [animeTitle, animeTitleEnglish, malId, totalEpisodes])

    useEffect(() => {
        if (!mounted || !animeTitle) return
        
        setHiEpisodes([])
        setSelectedEp(null)
        setStreamData(null)
        setActiveServer(null)
        setStreamError(null)
        setHiError(null)
        
        findAndLoadEpisodes()
    }, [mounted, animeTitle, findAndLoadEpisodes])

    // ── Phase 2: Fetch Streaming Links ───────────────────────────────────────
    const fetchStreamSources = useCallback(async (ep: Episode) => {
        setStreamLoading(true)
        setStreamError(null)
        setIframeLoaded(false)
        try {
            const res = await api.get(
                `/streaming/episode/${encodeURIComponent(ep.id)}?provider=animepahe&malId=${malId}&ep=${ep.number}&tmdbId=${tmdbId || ''}&title=${encodeURIComponent(animeTitle)}`
            )
            const data = res.data.data || res.data
            setStreamData(data)
            
            const primary = data.servers?.[0]
            if (primary) {
                switchServer(primary)
            } else {
                throw new Error('No Nodes Available')
            }
        } catch (e: any) {
            setStreamError(e.message)
        } finally {
            setStreamLoading(false)
        }
    }, [animeTitle, malId, tmdbId])

    useEffect(() => {
        if (!selectedEp) return
        fetchStreamSources(selectedEp)
    }, [selectedEp, fetchStreamSources])

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
                    {hiLoading ? 'Syncing Mesh...' : hiError ? 'Mesh Offline' : 'Resilience Mesh v11.0 Online (Nuclear Restoration)'}
                </div>

                <div className="flex-1 flex flex-wrap gap-2">
                    {streamData?.servers?.map((s: Server, idx: number) => (
                        <button
                            key={`${s.provider}-${idx}`}
                            onClick={() => switchServer(s)}
                            className={cn(
                                'h-9 px-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-200',
                                activeServer === s
                                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/30 scale-[1.05] z-10'
                                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white hover:border-white/20'
                            )}
                        >
                            {s.name}
                        </button>
                    ))}
                </div>

                <a href={externalSearchUrl} target="_blank" rel="noopener noreferrer"
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
                            Engaging Resilience Mesh v11.0...
                        </p>
                        <div className="flex flex-col items-center gap-2">
                             <p className="text-white/20 text-[8px] font-bold uppercase tracking-widest">
                                 Nuclear Discovery Bridge Active
                             </p>
                             {streamLoading && (
                                 <button 
                                     onClick={() => setStreamError('Manual Bypass Triggered')}
                                     className="text-indigo-500/50 hover:text-indigo-400 text-[9px] uppercase font-bold tracking-tighter mt-2 underline"
                                 >
                                     Skip Waiting & Show Mirrors
                                 </button>
                             )}
                        </div>
                    </div>
                )}

                {streamError && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0a0a0b] gap-4 px-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500/30" />
                        <div className="space-y-1">
                            <p className="text-white font-bold">Node Connection Failed</p>
                            <p className="text-white/40 text-xs">Direct MAL-ID Bridge failed to resolve the stream. Try another mirror.</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => selectedEp && fetchStreamSources(selectedEp)} className="mt-2 border-white/10">
                            <RefreshCw className="w-3.5 h-3.5 mr-2" /> Retry Node
                        </Button>
                    </div>
                )}

                {/* Hybrid Player Engine */}
                {activeServer?.isNative && activeServer.sources?.[0]?.url ? (
                    <ArtPlayer
                        url={activeServer.sources[0].url}
                        poster={animePoster}
                        subtitles={activeServer.subtitles as any} // Subtitles from native source
                        onEnded={nextEp} // Auto-Play next episode
                        className="w-full h-full"
                        onReady={() => setIframeLoaded(true)}
                    />
                ) : (activeServer?.provider === 'external' || activeServer?.name?.includes('Direct')) ? (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0a0a0b] gap-6 px-6 text-center">
                        <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                             <ExternalLink className="w-10 h-10 text-indigo-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Secure Portal Ready</h3>
                            <p className="text-white/40 text-xs max-w-xs mx-auto">
                                This provider ({activeServer.name}) requires a direct secure connection to play.
                            </p>
                        </div>
                        <Button 
                            onClick={() => {
                                window.open(activeServer.url, '_blank', 'noopener,noreferrer');
                                setIframeLoaded(true);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20"
                        >
                            Launch Secure Player
                        </Button>
                    </div>
                ) : activeServer?.url && (
                    <iframe
                        key={`${activeServer.url}-${iframeKey}`}
                        src={activeServer.url}
                        className="w-full h-full border-0"
                        allowFullScreen
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        referrerPolicy="no-referrer"
                        onLoad={() => setIframeLoaded(true)}
                    />
                )}

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
                    <Button size="sm" variant="ghost" disabled={currentEpNumber <= 1} onClick={prevEp} className="h-9 w-9 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 text-white/70">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" disabled={currentEpNumber >= hiEpisodes.length} onClick={nextEp} className="h-9 w-9 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 text-white/70">
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
                    <EpisodeGrid episodes={hiEpisodes} currentEpisode={currentEpNumber} onEpisodeSelect={(ep) => setSelectedEp(ep)} fallbackImage={animePoster} />
                </div>
            )}
        </div>
    )
}
