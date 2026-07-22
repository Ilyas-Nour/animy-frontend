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
    malId: number          // This should be idMal (real MAL ID)
    anilistId?: number     // The AniList ID
    totalEpisodes?: number
    tmdbId?: string | number
}

// ── Embed Context & Mirror Definitions ──────────────────────────────────────
interface EmbedContext {
    malId: number
    anilistId: number
    ep: number
    subDub: 'sub' | 'dub'
    tmdbId?: string
    season?: number
    tmdbEp?: number
}

interface Mirror {
    name: string
    buildUrl: (ctx: EmbedContext) => string | null
}

const MIRRORS: Mirror[] = [
    {
        // VidLink via MAL ID — most reliable anime player, supports sub/dub toggle
        name: 'VidLink',
        buildUrl: (ctx) => ctx.malId ? `https://vidlink.pro/anime/${ctx.malId}/${ctx.ep}/${ctx.subDub}?primaryColor=6366f1&secondaryColor=4f46e5&iconColor=ffffff&autoplay=false&fallback=true&multiSub=1` : null
    },
    {
        // VidLink via AniList ID — fallback if MAL ID is unavailable
        name: 'VidLink (AL)',
        buildUrl: (ctx) => ctx.anilistId ? `https://vidlink.pro/anime/${ctx.anilistId}/${ctx.ep}/${ctx.subDub}?primaryColor=6366f1&secondaryColor=4f46e5&iconColor=ffffff&autoplay=false&fallback=true&multiSub=1` : null
    },
    {
        // VidSrc.cc — native anime endpoint using MAL ID directly, no TMDB needed
        name: 'VidSrc',
        buildUrl: (ctx) => ctx.malId ? `https://vidsrc.cc/v2/embed/anime/${ctx.malId}/${ctx.ep}/sub` : null
    },
    {
        // VidSrc.to — native anime endpoint using MAL ID directly
        name: 'VidSrc.to',
        buildUrl: (ctx) => ctx.malId ? `https://vidsrc.to/embed/anime/${ctx.malId}/${ctx.ep}` : null
    },
    {
        // AutoEmbed via player.vidsrc.nl — MAL ID based, reliable fallback
        name: 'AutoEmbed',
        buildUrl: (ctx) => ctx.malId ? `https://player.vidsrc.nl/embed/anime/${ctx.malId}/${ctx.ep}` : null
    },
    {
        // 2Embed — TMDB-based, only shown when full TMDB mapping is available
        name: '2Embed',
        buildUrl: (ctx) => ctx.tmdbId && ctx.season && ctx.tmdbEp ? `https://www.2embed.skin/embedtv/${ctx.tmdbId}&s=${ctx.season}&e=${ctx.tmdbEp}` : null
    }
]

export function StreamingContainer({
    animeTitle,
    animePoster,
    malId,
    anilistId,
    totalEpisodes = 0,
    tmdbId: initialTmdbId,
}: StreamingContainerProps) {
    const [mounted, setMounted] = useState(false)
    const [selectedEp, setSelectedEp] = useState<Episode | null>(null)
    const [episodes, setEpisodes] = useState<Episode[]>([])
    const [subDub, setSubDub] = useState<'sub' | 'dub'>('sub')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const [mirrorIndex, setMirrorIndex] = useState(0)
    const [iframeKey, setIframeKey] = useState(0) // Force iframe refresh

    // AniZip mappings: Maps absolute episode number -> { season, tmdbEp, tmdbId }
    const [aniZipMap, setAniZipMap] = useState<Record<number, { s: number, e: number, tId: string }>>({})

    const realAnilistId = anilistId || malId
    // Some endpoints pass anilistId as malId when MAL ID is unknown.
    // If malId is 0 or equal to anilistId (and we know it's not a valid MAL match for some reason), it's safe to just use malId.
    const realMalId = malId

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

    // Fetch AniZip mapping dynamically
    useEffect(() => {
        if (!realAnilistId) return
        fetch(`https://api.ani.zip/mappings?anilist_id=${realAnilistId}`)
            .then(res => res.json())
            .then(data => {
                if (data?.episodes) {
                    const newMap: Record<number, { s: number, e: number, tId: string }> = {}
                    const baseTmdbId = data.mappings?.themoviedb_id || initialTmdbId
                    
                    Object.keys(data.episodes).forEach(key => {
                        const ep = data.episodes[key]
                        if (ep.seasonNumber !== undefined && ep.episodeNumber !== undefined) {
                            newMap[ep.absoluteEpisodeNumber || Number(key)] = {
                                s: ep.seasonNumber,
                                e: ep.episodeNumber,
                                tId: String(baseTmdbId)
                            }
                        }
                    })
                    setAniZipMap(newMap)
                }
            })
            .catch(err => console.error("AniZip fetch failed:", err))
    }, [realAnilistId, initialTmdbId])

    const currentEpNumber = selectedEp?.number ?? 1
    
    // Build the current context
    const epMapping = aniZipMap[currentEpNumber]
    const currentContext: EmbedContext = {
        malId: realMalId,
        anilistId: realAnilistId,
        ep: currentEpNumber,
        subDub,
        tmdbId: epMapping?.tId || (initialTmdbId ? String(initialTmdbId) : undefined),
        season: epMapping?.s,
        tmdbEp: epMapping?.e
    }

    // Filter working mirrors
    const availableMirrors = MIRRORS.filter(m => m.buildUrl(currentContext) !== null)

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
    const embedUrl = activeMirror.buildUrl(currentContext) || ''

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
