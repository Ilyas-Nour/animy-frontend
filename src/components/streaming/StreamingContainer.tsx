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
    id: string        // HiAnime episode ID (e.g. "tsue-to-tsurugi-no-wistoria-season-2-64mk?ep=1")
    number: number
    title?: string
    isFiller?: boolean
}

interface IframeServer {
    id: string
    name: string
    badge: string
    url: string
}

type ActiveView = 'hianime' | 'iframe'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function buildIframeServers(malId: number, ep: number): IframeServer[] {
    return [
        {
            id: 'vidlink-sub',
            name: 'VidLink Sub',
            badge: 'Sub',
            url: `https://vidlink.pro/anime/${malId}/${ep}/sub?primaryColor=6366f1&secondaryColor=a855f7&autoplay=false&fallback=true`,
        },
        {
            id: 'vidlink-dub',
            name: 'VidLink Dub',
            badge: 'Dub',
            url: `https://vidlink.pro/anime/${malId}/${ep}/dub?primaryColor=6366f1&secondaryColor=a855f7&autoplay=false&fallback=true`,
        },
        {
            id: 'vidsrc',
            name: 'VidSrc',
            badge: 'Alt',
            url: `https://vidsrc.to/embed/anime/${malId}/${ep}`,
        },
    ]
}

// ─── HLS Native Player ────────────────────────────────────────────────────────
function NativePlayer({ sources, poster }: { sources: any[], poster?: string }) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const hlsRef = useRef<Hls | null>(null)
    const [err, setErr] = useState(false)

    useEffect(() => {
        const src = sources.find(s => s.quality === '1080p') || sources.find(s => s.quality === '720p') || sources[0]
        if (!src || !videoRef.current) return

        setErr(false)

        if (Hls.isSupported() && (src.url.includes('.m3u8') || src.isM3U8)) {
            if (hlsRef.current) hlsRef.current.destroy()
            const hls = new Hls({ maxBufferLength: 30, autoStartLoad: true })
            hls.loadSource(src.url)
            hls.attachMedia(videoRef.current)
            hls.on(Hls.Events.MANIFEST_PARSED, () => videoRef.current?.play().catch(() => {}))
            hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) setErr(true) })
            hlsRef.current = hls
        } else {
            videoRef.current.src = src.url
        }

        return () => hlsRef.current?.destroy()
    }, [sources])

    if (err) return (
        <div className="w-full h-full flex items-center justify-center bg-black/80">
            <p className="text-red-400 text-sm font-bold">Playback failed — try another server</p>
        </div>
    )

    return (
        <video
            ref={videoRef}
            className="w-full h-full"
            controls
            playsInline
            poster={poster}
        />
    )
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

    // Active view: native HiAnime HLS or iframe
    const [activeView, setActiveView] = useState<ActiveView>('hianime')

    // Native streaming sources (after clicking episode)
    const [streamSources, setStreamSources] = useState<any[] | null>(null)
    const [streamLoading, setStreamLoading] = useState(false)
    const [streamError, setStreamError] = useState<string | null>(null)

    // Iframe server (when in iframe mode)
    const [iframeServers, setIframeServers] = useState<IframeServer[]>([])
    const [activeIframeServer, setActiveIframeServer] = useState<IframeServer | null>(null)
    const [iframeLoaded, setIframeLoaded] = useState(false)
    const [iframeKey, setIframeKey] = useState(0)

    const hiAnimeSearchUrl = `https://hianime.to/search?keyword=${encodeURIComponent(animeTitleEnglish || animeTitle)}`

    useEffect(() => { setMounted(true) }, [])

    // ── Phase 1: Find anime on HiAnime, get real episode IDs ─────────────────
    useEffect(() => {
        if (!mounted || !animeTitle) return
        findAndLoadEpisodes()
    }, [mounted, animeTitle])

    const findAndLoadEpisodes = async () => {
        setHiLoading(true)
        setHiError(null)
        try {
            // Search HiAnime for this anime
            const searchRes = await api.get(
                `/streaming/find?title=${encodeURIComponent(animeTitle)}&titleEnglish=${encodeURIComponent(animeTitleEnglish || '')}&anilistId=${malId}`
            )
            const results = Array.isArray(searchRes.data.data)
                ? searchRes.data.data
                : searchRes.data.data?.results || searchRes.data.results || []

            if (!results.length) throw new Error('Not found on HiAnime')

            const animeId = results[0].id
            const infoRes = await api.get(`/streaming/anime/${encodeURIComponent(animeId)}`)
            const info = infoRes.data.data || infoRes.data

            if (!info?.episodes?.length) throw new Error('No episodes found')

            const episodes: Episode[] = info.episodes.map((ep: any) => ({
                id: ep.id || ep.episodeId,
                number: ep.number || ep.episodeNumber || 1,
                title: ep.title,
                isFiller: ep.isFiller,
            }))

            setHiEpisodes(episodes)
            setSelectedEp(episodes[0])
            setActiveView('hianime')
        } catch (e: any) {
            setHiError(e.message || 'HiAnime unavailable')
            // Fall back to iframe mode with episode 1
            setActiveView('iframe')
            if (malId) {
                const servers = buildIframeServers(malId, 1)
                setIframeServers(servers)
                setActiveIframeServer(servers[0])
            }
        } finally {
            setHiLoading(false)
        }
    }

    // ── Phase 2: Fetch streaming sources when episode selected ────────────────
    useEffect(() => {
        if (!selectedEp || activeView !== 'hianime') return
        fetchStreamSources(selectedEp)
    }, [selectedEp, activeView])

    const fetchStreamSources = async (ep: Episode) => {
        setStreamLoading(true)
        setStreamSources(null)
        setStreamError(null)
        try {
            const res = await fetch(
                `/api/streaming/watch/${encodeURIComponent(ep.id)}?provider=hianime&malId=${malId}&ep=${ep.number}`
            )
            if (!res.ok) throw new Error(`Server returned ${res.status}`)
            const data = await res.json()
            const sources = data.data?.sources || data.sources || []
            if (!sources.length) throw new Error('No playable sources')
            setStreamSources(sources)
        } catch (e: any) {
            setStreamError(e.message)
            // Auto-switch to iframe fallback
            if (malId && selectedEp) {
                const servers = buildIframeServers(malId, selectedEp.number)
                setIframeServers(servers)
                setActiveIframeServer(servers[0])
                setActiveView('iframe')
                setIframeKey(k => k + 1)
                setIframeLoaded(false)
            }
        } finally {
            setStreamLoading(false)
        }
    }

    // ── Iframe key refresh when server or episode changes ─────────────────────
    useEffect(() => {
        if (activeView !== 'iframe' || !malId || !selectedEp) return
        const epNum = selectedEp?.number || 1
        const servers = buildIframeServers(malId, epNum)
        setIframeServers(servers)
        if (!activeIframeServer) setActiveIframeServer(servers[0])
        setIframeLoaded(false)
        setIframeKey(k => k + 1)
    }, [activeView, selectedEp])

    const switchToIframe = () => {
        const epNum = selectedEp?.number || 1
        const servers = buildIframeServers(malId, epNum)
        setIframeServers(servers)
        setActiveIframeServer(servers[0])
        setActiveView('iframe')
        setIframeKey(k => k + 1)
        setIframeLoaded(false)
    }

    const switchServer = (server: IframeServer) => {
        setActiveIframeServer(server)
        setIframeKey(k => k + 1)
        setIframeLoaded(false)
    }

    // Build fallback episode list from totalEpisodes if HiAnime failed
    const fallbackEpisodes: Episode[] = Array.from({ length: Math.max(totalEpisodes, 1) }, (_, i) => ({
        id: String(i + 1),
        number: i + 1,
        title: `Episode ${i + 1}`,
    }))
    const displayEpisodes = hiEpisodes.length > 0 ? hiEpisodes : fallbackEpisodes
    const currentEpNumber = selectedEp?.number ?? 1

    const prevEp = () => {
        const prev = displayEpisodes.find(e => e.number === currentEpNumber - 1)
        if (prev) setSelectedEp(prev)
    }
    const nextEp = () => {
        const next = displayEpisodes.find(e => e.number === currentEpNumber + 1)
        if (next) setSelectedEp(next)
    }

    if (!mounted) return (
        <div className="w-full py-16 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
    )

    return (
        <div className="space-y-5">

            {/* ── Top bar: source status + server switcher ── */}
            <div className="flex flex-wrap items-center gap-3">
                {/* HiAnime status pill */}
                <div className={cn(
                    'flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border',
                    hiLoading ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10'
                        : hiError ? 'text-red-400 border-red-500/20 bg-red-500/10'
                            : 'text-green-400 border-green-500/20 bg-green-500/10'
                )}>
                    <Wifi className="w-3.5 h-3.5" />
                    {hiLoading ? 'Searching HiAnime...' : hiError ? 'HiAnime unavailable' : 'Connected · HiAnime'}
                </div>

                {/* View toggle */}
                {!hiError && !hiLoading && (
                    <div className="flex gap-1.5">
                        <button
                            onClick={() => { setActiveView('hianime'); if (selectedEp) fetchStreamSources(selectedEp) }}
                            className={cn(
                                'h-7 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all',
                                activeView === 'hianime'
                                    ? 'bg-green-600 text-white border-green-500 shadow-lg shadow-green-500/20'
                                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                            )}
                        >Native (Best)</button>
                        <button
                            onClick={switchToIframe}
                            className={cn(
                                'h-7 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all',
                                activeView === 'iframe'
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
                                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                            )}
                        >Servers</button>
                    </div>
                )}

                {/* Iframe server buttons */}
                {activeView === 'iframe' && iframeServers.map(s => (
                    <button
                        key={s.id}
                        onClick={() => switchServer(s)}
                        className={cn(
                            'h-7 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all',
                            activeIframeServer?.id === s.id
                                ? 'bg-indigo-600 text-white border-indigo-500'
                                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                        )}
                    >{s.name}</button>
                ))}

                {/* HiAnime external link */}
                <a href={hiAnimeSearchUrl} target="_blank" rel="noopener noreferrer"
                    className="ml-auto flex items-center gap-1.5 text-[10px] text-indigo-400/70 hover:text-indigo-300 transition-colors font-bold uppercase tracking-widest">
                    <ExternalLink className="w-3 h-3" /> HiAnime
                </a>
            </div>

            {/* ── Video Player ── */}
            <div className="relative bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                style={{ aspectRatio: '16/9' }}>

                {/* HiAnime Native */}
                {activeView === 'hianime' && (
                    <>
                        {streamLoading && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-green-500" />
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                                    Loading Episode {currentEpNumber}...
                                </p>
                            </div>
                        )}
                        {!streamLoading && streamError && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/90">
                                <AlertCircle className="w-10 h-10 text-red-500/50" />
                                <p className="text-white/40 text-xs font-bold">Native stream failed — switched to Servers</p>
                            </div>
                        )}
                        {!streamLoading && streamSources && (
                            <NativePlayer sources={streamSources} poster={animePoster} />
                        )}
                        {/* Server badge */}
                        <div className="absolute top-3 left-3 z-10 pointer-events-none">
                            <div className="px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-[9px] uppercase font-black tracking-[0.2em] text-green-300 border border-green-500/20">
                                Native · 1080p
                            </div>
                        </div>
                    </>
                )}

                {/* Iframe Servers */}
                {activeView === 'iframe' && activeIframeServer && (
                    <>
                        {!iframeLoaded && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                                    Connecting to {activeIframeServer.name}...
                                </p>
                            </div>
                        )}
                        <iframe
                            key={`${activeIframeServer.id}-ep${currentEpNumber}-${iframeKey}`}
                            src={activeIframeServer.url}
                            className="w-full h-full border-0"
                            allowFullScreen
                            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                            referrerPolicy="no-referrer-when-downgrade"
                            onLoad={() => setIframeLoaded(true)}
                        />
                        <div className="absolute top-3 left-3 z-10 pointer-events-none">
                            <div className="px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-[9px] uppercase font-black tracking-[0.2em] text-indigo-300 border border-indigo-500/20">
                                {activeIframeServer.badge}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ── Episode Info + Prev/Next ── */}
            <div className="flex items-center justify-between px-1 gap-4">
                <p className="text-sm text-white/50 truncate">
                    Ep <span className="text-white font-bold">{currentEpNumber}</span>
                    {displayEpisodes.length > 1 && <span className="text-white/30"> / {displayEpisodes.length}</span>}
                    {selectedEp?.title && <span className="text-white/30 ml-2 text-xs">— {selectedEp.title}</span>}
                </p>
                <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" disabled={currentEpNumber <= 1} onClick={prevEp}
                        className="h-8 px-3 border-white/10 bg-white/5 hover:bg-white/10 text-xs gap-1">
                        <ChevronLeft className="w-3.5 h-3.5" /> Prev
                    </Button>
                    <Button size="sm" variant="outline" disabled={currentEpNumber >= displayEpisodes.length} onClick={nextEp}
                        className="h-8 px-3 border-white/10 bg-white/5 hover:bg-white/10 text-xs gap-1">
                        Next <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {/* ── Help tip ── */}
            {hiError && (
                <p className="text-[11px] text-white/25 text-center">
                    HiAnime search failed. Using iframe servers — if they show errors, try switching servers or{' '}
                    <a href={hiAnimeSearchUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">watch directly on HiAnime</a>.
                </p>
            )}

            {/* ── Episode Grid ── */}
            {displayEpisodes.length > 1 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">
                        Episodes ({displayEpisodes.length})
                    </h3>
                    <EpisodeGrid
                        episodes={displayEpisodes}
                        currentEpisode={currentEpNumber}
                        onEpisodeSelect={(ep) => setSelectedEp(ep)}
                        fallbackImage={animePoster}
                    />
                </div>
            )}
        </div>
    )
}
