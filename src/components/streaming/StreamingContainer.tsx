'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { EpisodeGrid } from './EpisodeGrid'
import {
    ChevronLeft, ChevronRight, AlertCircle,
    Loader2, RefreshCcw, Tv2, Signal, ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import VidstackPlayer from './VidstackPlayer'
// ─── Types ────────────────────────────────────────────────────────────────────
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
    headers?: Record<string, string>
    referer?: string
}

interface StreamingContainerProps {
    animeTitle: string
    animeTitleEnglish?: string
    animePoster?: string
    malId: number
    totalEpisodes?: number
    tmdbId?: string | number
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
    const [hiEpisodes, setHiEpisodes] = useState<Episode[]>([])
    const [hiLoading, setHiLoading] = useState(true)
    const [hiError, setHiError] = useState<string | null>(null)
    const [selectedEp, setSelectedEp] = useState<Episode | null>(null)
    const [allServers, setAllServers] = useState<Server[]>([])
    const [activeServer, setActiveServer] = useState<Server | null>(null)
    const [streamLoading, setStreamLoading] = useState(false)
    const [streamError, setStreamError] = useState<string | null>(null)
    const [showServerMenu, setShowServerMenu] = useState(false)
    const [iframeKey, setIframeKey] = useState(0)
    const lastLoadedRef = useRef<string | null>(null)
    const serverMenuRef = useRef<HTMLDivElement>(null)

    useEffect(() => { setMounted(true) }, [])

    // Close server menu on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (serverMenuRef.current && !serverMenuRef.current.contains(e.target as Node)) {
                setShowServerMenu(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // ── Phase 1: Load Episodes ───────────────────────────────────────────────
    const findAndLoadEpisodes = useCallback(async () => {
        if (!animeTitle || lastLoadedRef.current === `${animeTitle}-${malId}`) return

        lastLoadedRef.current = `${animeTitle}-${malId}`
        setHiLoading(true)
        setHiError(null)

        try {
            const findRes = await Promise.race([
                fetch(`/api/streaming/find?title=${encodeURIComponent(animeTitle)}&titleEnglish=${encodeURIComponent(animeTitleEnglish || '')}&anilistId=${malId}`)
                    .then(r => r.json()),
                new Promise<any>((_, rej) => setTimeout(() => rej(new Error('Timeout')), 8000))
            ])

            const rawData = findRes.data || findRes
            const results = Array.isArray(rawData) ? rawData : rawData.results ? rawData.results : [rawData]
            if (!results.length || !results[0].id) throw new Error('Not found')

            const infoRes = await Promise.race([
                fetch(`/api/streaming/anime/${encodeURIComponent(results[0].id)}`).then(r => r.json()),
                new Promise<any>((_, rej) => setTimeout(() => rej(new Error('Timeout')), 8000))
            ])
            const info = infoRes.data || infoRes
            if (!info?.episodes?.length) throw new Error('No episodes')

            const episodes: Episode[] = info.episodes.map((ep: any) => ({
                id: ep.id || ep.episodeId,
                number: ep.number || ep.episodeNumber || 1,
                title: ep.title,
                isFiller: ep.isFiller,
            }))

            setHiEpisodes(episodes)
            setSelectedEp(episodes[0])
        } catch (e: any) {
            // Nuclear fallback: generate virtual episode list from totalEpisodes
            const count = totalEpisodes > 0 ? totalEpisodes : 1
            const virtual: Episode[] = Array.from({ length: count }, (_, i) => ({
                id: String(malId),
                number: i + 1,
                title: `Episode ${i + 1}`,
            }))
            setHiEpisodes(virtual)
            if (virtual.length > 0) setSelectedEp(virtual[0])
            setHiError('direct')
        } finally {
            setHiLoading(false)
        }
    }, [animeTitle, animeTitleEnglish, malId, totalEpisodes])

    useEffect(() => {
        if (!mounted || !animeTitle) return
        if (lastLoadedRef.current !== `${animeTitle}-${malId}`) {
            setHiEpisodes([])
            setSelectedEp(null)
            setAllServers([])
            setActiveServer(null)
            setStreamError(null)
            setHiError(null)
        }
        findAndLoadEpisodes()
    }, [mounted, animeTitle, malId, findAndLoadEpisodes])

    // ── Phase 2: Fetch Streaming Links ───────────────────────────────────────
    const fetchStreamSources = useCallback(async (ep: Episode) => {
        setStreamLoading(true)
        setStreamError(null)
        setAllServers([])
        setActiveServer(null)

        try {
            // Fetch directly from backend
            const backendRes = await fetch(`/api/streaming/episode/${encodeURIComponent(ep.id)}?provider=animepahe&malId=${malId}&ep=${ep.number}&tmdbId=${tmdbId || ''}&title=${encodeURIComponent(animeTitle)}`)
                .then(r => r.json())
                .catch(() => ({ data: { servers: [] } }));

            const raw = backendRes.data || backendRes;
            let servers: Server[] = raw.servers || [];

            if (!servers.length) throw new Error('No streaming sources found');

            setAllServers(servers);

            // Prefer native server, then fallback to first server
            const nativeServer = servers.find(s => s.isNative && s.sources?.[0]?.url);
            setActiveServer(nativeServer || servers[0]);
            setIframeKey(k => k + 1);
        } catch (e: any) {
            setStreamError(e.message || 'Failed to load episode');
        } finally {
            setStreamLoading(false);
        }
    }, [animeTitle, malId, tmdbId]);

    useEffect(() => {
        if (!selectedEp) return
        fetchStreamSources(selectedEp)
    }, [selectedEp, fetchStreamSources])

    const switchServer = (server: Server) => {
        setActiveServer(server)
        setIframeKey(k => k + 1)
        setShowServerMenu(false)
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

    // Which player mode to use
    const isNativeActive = !!(activeServer?.isNative && activeServer.sources?.[0]?.url)
    const isIframeActive = !!(activeServer?.url && !isNativeActive)

    if (!mounted) return (
        <div className="w-full py-16 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
    )

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

                {/* Loading overlay */}
                {streamLoading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0a0a0b] gap-5">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border border-indigo-500/10" />
                            <div className="absolute inset-0 w-16 h-16 rounded-full border-t-2 border-indigo-500 animate-spin" />
                            <Tv2 className="absolute inset-0 m-auto w-6 h-6 text-indigo-400/60" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-white/60 text-xs font-bold uppercase tracking-[0.25em]">Finding Stream</p>
                            <p className="text-white/20 text-[10px]">Episode {currentEpNumber} · {animeTitle}</p>
                        </div>
                    </div>
                )}

                {/* Error overlay */}
                {streamError && !streamLoading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0a0a0b] gap-5 px-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/5 border border-red-500/10 flex items-center justify-center">
                            <AlertCircle className="w-7 h-7 text-red-400/50" />
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-white font-bold text-sm">Stream Unavailable</p>
                            <p className="text-white/40 text-xs max-w-xs">Could not find a stream for this episode. Try refreshing or selecting another episode.</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => selectedEp && fetchStreamSources(selectedEp)}
                            className="mt-1 border-white/10 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl"
                        >
                            <RefreshCcw className="w-3.5 h-3.5 mr-2" /> Try Again
                        </Button>
                    </div>
                )}

                {/* ── Native HLS Player (Vidstack) ── */}
                {!streamLoading && isNativeActive && (
                    <VidstackPlayer
                        url={activeServer!.sources![0].url}
                        poster={animePoster}
                        subtitles={activeServer!.subtitles as any}
                        onEnded={nextEp}
                        className="w-full h-full"
                        referer={activeServer!.headers?.Referer || activeServer!.referer || 'https://hianime.to/'}
                    />
                )}

                {/* ── Iframe Embed Player ── */}
                {!streamLoading && isIframeActive && (
                    <iframe
                        key={`iframe-${iframeKey}`}
                        src={activeServer!.url}
                        className="w-full h-full border-0 bg-black"
                        allowFullScreen
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write"
                        referrerPolicy="no-referrer-when-downgrade"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-presentation"
                    />
                )}

                {/* ── Player overlay: server info + server switcher ── */}
                {!streamLoading && activeServer && (
                    <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="flex items-end justify-between pointer-events-auto">
                            {/* Server badge */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
                                    <Signal className="w-2.5 h-2.5 text-indigo-400" />
                                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                                        {activeServer.name}
                                    </span>
                                    {isNativeActive && (
                                        <span className="text-[9px] px-1 bg-emerald-500/20 text-emerald-400 rounded font-bold">NATIVE</span>
                                    )}
                                </div>
                            </div>

                            {/* Server switcher (only shown if multiple servers available) */}
                            {allServers.length > 1 && (
                                <div ref={serverMenuRef} className="relative">
                                    <button
                                        onClick={() => setShowServerMenu(v => !v)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[10px] font-bold text-white/60 hover:text-white hover:border-white/20 transition-all"
                                    >
                                        Switch Server
                                        <ChevronDown className={cn("w-3 h-3 transition-transform", showServerMenu && "rotate-180")} />
                                    </button>

                                    {showServerMenu && (
                                        <div className="absolute bottom-full right-0 mb-2 w-52 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                                            <div className="px-3 py-2 border-b border-white/5">
                                                <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Available Servers</p>
                                            </div>
                                            {allServers.map((s, idx) => (
                                                <button
                                                    key={`${s.provider}-${idx}`}
                                                    onClick={() => switchServer(s)}
                                                    className={cn(
                                                        "w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors text-[11px] font-medium",
                                                        activeServer === s
                                                            ? "bg-indigo-600/20 text-indigo-300"
                                                            : "text-white/60 hover:bg-white/5 hover:text-white"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full shrink-0",
                                                        s.isNative ? "bg-emerald-400" : "bg-white/20"
                                                    )} />
                                                    <span className="truncate">{s.name}</span>
                                                    {s.isNative && (
                                                        <span className="ml-auto text-[9px] text-emerald-400/70 font-bold shrink-0">HLS</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Controls bar ── */}
            <div className="flex items-center justify-between px-1">
                <div className="flex flex-col gap-0.5 min-w-0">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2 truncate">
                        Episode {currentEpNumber}
                        {selectedEp?.isFiller && (
                            <span className="shrink-0 px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 text-[8px] uppercase tracking-tighter rounded border border-yellow-500/20">
                                Filler
                            </span>
                        )}
                    </h2>
                    <p className="text-[10px] text-white/30 font-medium truncate max-w-[280px]">
                        {selectedEp?.title || animeTitle}
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Loading indicator when finding episodes */}
                    {hiLoading && (
                        <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Loading episodes...</span>
                        </div>
                    )}
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
                        disabled={currentEpNumber >= hiEpisodes.length}
                        onClick={nextEp}
                        className="h-9 w-9 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 text-white/70 disabled:opacity-30"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* ── Episode Grid ── */}
            {hiEpisodes.length > 0 && (
                <div className="pt-2">
                    <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-[10px] font-black text-white/25 uppercase tracking-[0.2em]">Episodes</h3>
                        <div className="h-px flex-1 bg-white/5" />
                        <span className="text-[10px] font-bold text-white/20">{hiEpisodes.length} total</span>
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
