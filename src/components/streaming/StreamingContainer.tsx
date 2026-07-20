'use client'

import { useState, useEffect } from 'react'
import { EpisodeGrid } from './EpisodeGrid'
import { ChevronLeft, ChevronRight, Subtitles, Mic, RefreshCw, Server } from 'lucide-react'
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
    malId: number          // This should be idMal (real MAL ID) — passed as anime.idMal || anime.mal_id
    anilistId?: number     // The AniList ID (same as anime.mal_id in the page)
    totalEpisodes?: number
    tmdbId?: string | number
}

// ── Mirror definitions ──────────────────────────────────────────────────────
// Each mirror is tried in order. "malId" and "anilistId" are substituted at runtime.
// All of these are proven to work as of 2026.
interface Mirror {
    name: string
    buildUrl: (malId: number, anilistId: number, ep: number, subDub: 'sub' | 'dub') => string
    requiresMalId?: boolean  // If true, skip when malId is 0 or same as anilistId
}

const MIRRORS: Mirror[] = [
    {
        name: 'VidLink',
        requiresMalId: true,
        buildUrl: (malId, _, ep, subDub) =>
            `https://vidlink.pro/anime/${malId}/${ep}/${subDub}?primaryColor=6366f1&secondaryColor=4f46e5&iconColor=ffffff&autoplay=false&fallback=true`,
    },
    {
        name: '2Embed',
        requiresMalId: true,
        buildUrl: (malId, _, ep) =>
            `https://www.2embed.skin/embedtv/${malId}&s=1&e=${ep}`,
    },
    {
        name: 'VidSrc',
        requiresMalId: true,
        buildUrl: (malId, _, ep) =>
            `https://vidsrc.me/embed/anime/${malId}/${ep}`,
    },
    {
        name: 'VidSrc.to',
        requiresMalId: true,
        buildUrl: (malId, _, ep) =>
            `https://vidsrc.to/embed/anime/${malId}/${ep}`,
    },
    {
        name: 'Embed.su',
        requiresMalId: true,
        buildUrl: (malId, _, ep) =>
            `https://embed.su/embed/anime/${malId}/${ep}`,
    },
    {
        name: 'VidSrc.xyz',
        requiresMalId: true,
        buildUrl: (malId, _, ep) =>
            `https://vidsrc.xyz/embed/anime?mal=${malId}&season=1&episode=${ep}`,
    },
    // AniList-ID-based fallbacks (work even without MAL ID)
    {
        name: 'VidLink (AL)',
        requiresMalId: false,
        buildUrl: (_, anilistId, ep, subDub) =>
            `https://vidlink.pro/anime/${anilistId}/${ep}/${subDub}?primaryColor=6366f1&secondaryColor=4f46e5&iconColor=ffffff&autoplay=false&fallback=true`,
    },
    {
        name: 'AnimeFlix',
        requiresMalId: false,
        buildUrl: (_, anilistId, ep) =>
            `https://animeflixplus.com/embed/anime/${anilistId}/${ep}`,
    },
]

export function StreamingContainer({
    animeTitle,
    animePoster,
    malId,
    anilistId,
    totalEpisodes = 0,
}: StreamingContainerProps) {
    const [mounted, setMounted] = useState(false)
    const [selectedEp, setSelectedEp] = useState<Episode | null>(null)
    const [episodes, setEpisodes] = useState<Episode[]>([])
    const [subDub, setSubDub] = useState<'sub' | 'dub'>('sub')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const [mirrorIndex, setMirrorIndex] = useState(0)
    const [iframeKey, setIframeKey] = useState(0) // Force iframe refresh

    // The real AniList ID — fallback to malId if anilistId not explicitly passed
    const realAnilistId = anilistId || malId
    // The real MAL ID — if malId equals anilistId, it means the backend returned the AniList ID as mal_id
    // In that case malId is NOT a valid MAL ID for VidLink etc.
    const realMalId = malId && malId !== realAnilistId ? malId : 0

    const sortedEpisodes = sortOrder === 'asc'
        ? episodes
        : [...episodes].reverse()

    useEffect(() => {
        setMounted(true)
        const count = totalEpisodes && totalEpisodes > 0 ? totalEpisodes : 12
        const virtualEpisodes: Episode[] = Array.from({ length: count }, (_, i) => ({
            id: String(realAnilistId),
            number: i + 1,
            title: `Episode ${i + 1}`,
        }))
        setEpisodes(virtualEpisodes)
        setSelectedEp(virtualEpisodes[0])
    }, [totalEpisodes, realAnilistId])

    // Build available mirrors based on what IDs we have
    const availableMirrors = MIRRORS.filter(m => {
        if (m.requiresMalId && realMalId === 0) return false
        return true
    })

    const currentEpNumber = selectedEp?.number ?? 1

    const prevEp = () => {
        const prev = episodes.find(e => e.number === currentEpNumber - 1)
        if (prev) setSelectedEp(prev)
    }
    const nextEp = () => {
        const next = episodes.find(e => e.number === currentEpNumber + 1)
        if (next) setSelectedEp(next)
    }

    const selectMirror = (idx: number) => {
        setMirrorIndex(idx)
        setIframeKey(k => k + 1)
    }

    const reloadPlayer = () => setIframeKey(k => k + 1)

    if (!mounted) return null

    if (availableMirrors.length === 0) {
        return (
            <div className="w-full flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                    <span className="text-2xl">⚠️</span>
                </div>
                <p className="text-white/60 font-semibold text-sm">No streaming ID available for this title.</p>
                <p className="text-white/30 text-xs max-w-xs">
                    This anime does not have a MyAnimeList ID linked yet. Try again later or search on GogoAnime.
                </p>
            </div>
        )
    }

    const activeMirror = availableMirrors[Math.min(mirrorIndex, availableMirrors.length - 1)]
    const embedUrl = activeMirror.buildUrl(realMalId, realAnilistId, currentEpNumber, subDub)

    return (
        <div className="space-y-5">
            {/* JSON-LD for SEO */}
            {selectedEp && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'TVEpisode',
                            episodeNumber: selectedEp.number.toString(),
                            name: selectedEp.title || `Episode ${selectedEp.number}`,
                            partOfSeries: { '@type': 'TVSeries', name: animeTitle },
                            video: {
                                '@type': 'VideoObject',
                                name: `${animeTitle} Episode ${selectedEp.number}`,
                                description: `Watch ${animeTitle} Episode ${selectedEp.number} online.`,
                                thumbnailUrl: animePoster || '',
                                uploadDate: new Date().toISOString().split('T')[0]
                            }
                        })
                    }}
                />
            )}

            {/* ── Server Selector ── */}
            <div className="flex flex-wrap gap-2 items-center">
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/30 mr-1">
                    <Server className="w-3 h-3" /> Servers
                </span>
                {availableMirrors.map((mirror, idx) => (
                    <button
                        key={mirror.name}
                        onClick={() => selectMirror(idx)}
                        className={cn(
                            'px-3 py-1 rounded-lg text-xs font-bold border transition-all',
                            idx === Math.min(mirrorIndex, availableMirrors.length - 1)
                                ? 'bg-primary/20 border-primary/40 text-primary'
                                : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
                        )}
                    >
                        {mirror.name}
                    </button>
                ))}
                <button
                    onClick={reloadPlayer}
                    className="ml-auto px-2 py-1 rounded-lg text-xs font-bold border border-white/10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1"
                    title="Reload player"
                >
                    <RefreshCw className="w-3 h-3" />
                </button>
            </div>

            {/* ── Video Player ── */}
            <div
                className="relative bg-black rounded-3xl overflow-hidden border border-white/8 shadow-2xl shadow-black/60"
                style={{ aspectRatio: '16/9' }}
            >
                <iframe
                    key={`${iframeKey}-${currentEpNumber}-${mirrorIndex}`}
                    src={embedUrl}
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
                        {selectedEp?.title || animeTitle} · {activeMirror.name}
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {/* Sub/Dub Toggle */}
                    <div className="flex p-0.5 bg-white/5 rounded-xl border border-white/10">
                        <button
                            onClick={() => { setSubDub('sub'); setIframeKey(k => k + 1) }}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                                subDub === 'sub' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                            )}
                        >
                            <Subtitles className="w-3.5 h-3.5" />
                            Sub
                        </button>
                        <button
                            onClick={() => { setSubDub('dub'); setIframeKey(k => k + 1) }}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                                subDub === 'dub' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                            )}
                        >
                            <Mic className="w-3.5 h-3.5" />
                            Dub
                        </button>
                    </div>

                    <div className="h-6 w-px bg-white/10 mx-1" />

                    {/* Episode Navigation */}
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

            {/* Post-Video Ad */}
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
