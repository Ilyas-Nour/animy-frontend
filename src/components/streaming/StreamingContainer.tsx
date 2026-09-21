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
    image?: string
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

// Helper: returns null when a value is 0 or falsy (so mirrors can gracefully disable)
function validId(id: number | undefined): number | null {
    return id && id > 0 ? id : null
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
    tag?: string
    buildUrl: (ctx: EmbedContext) => string | null
}

const MIRRORS: Mirror[] = [
    {
        name: 'VidSrc PRO',
        tag: 'HD',
        // Requires real MAL ID — returns null if unavailable so player shows a message
        buildUrl: (ctx) => {
            const mal = validId(ctx.malId)
            if (!mal) return null
            return `https://vidsrc.pm/embed/anime?mal=${mal}&ep=${ctx.ep}`
        }
    },
    {
        name: 'VidSrc ME',
        tag: 'SUB/DUB',
        buildUrl: (ctx) => {
            const mal = validId(ctx.malId)
            if (!mal) return null
            return `https://vidsrc.me/embed/anime?mal=${mal}&ep=${ctx.ep}`
        }
    },
    {
        name: 'VidSrc NET',
        tag: 'ALT',
        buildUrl: (ctx) => {
            const mal = validId(ctx.malId)
            if (!mal) return null
            return `https://vidsrc.net/embed/anime?mal=${mal}&ep=${ctx.ep}`
        }
    },
    {
        name: 'NineAnime',
        tag: 'BACKUP',
        // vidsrc.io supports AniList ID as well
        buildUrl: (ctx) => {
            const anilist = validId(ctx.anilistId)
            const mal = validId(ctx.malId)
            if (anilist) return `https://vidsrc.io/embed/anime?al=${anilist}&ep=${ctx.ep}`
            if (mal) return `https://vidsrc.io/embed/anime?mal=${mal}&ep=${ctx.ep}`
            return null
        }
    },
    {
        name: 'Multi',
        tag: 'TMDB',
        buildUrl: (ctx) => {
            // Best path: TMDB season/episode mapping
            if (ctx.tmdbId && ctx.season && ctx.tmdbEp) {
                return `https://vidsrc.pm/embed/tv/${ctx.tmdbId}/${ctx.season}/${ctx.tmdbEp}`
            }
            // Fallback: MAL ID
            const mal = validId(ctx.malId)
            if (mal) return `https://vidsrc.pm/embed/anime?mal=${mal}&ep=${ctx.ep}`
            // Last resort: AniList ID
            const anilist = validId(ctx.anilistId)
            if (anilist) return `https://vidsrc.pm/embed/anime?al=${anilist}&ep=${ctx.ep}`
            return null
        }
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
    const [iframeError, setIframeError] = useState(false)

    const [resolvedAnilistId, setResolvedAnilistId] = useState<number | undefined>(anilistId)
    // AniZip mappings: Maps absolute episode number -> { season, tmdbEp, tmdbId }
    const [aniZipMap, setAniZipMap] = useState<Record<number, { s: number, e: number, tId: string }>>({})

    const realMalId = malId

    const sortedEpisodes = sortOrder === 'asc'
        ? episodes
        : [...episodes].reverse()

    useEffect(() => {
        setMounted(true)
        const count = totalEpisodes && totalEpisodes > 0 ? totalEpisodes : 12
        const animeKey = resolvedAnilistId || realMalId
        const virtualEpisodes: Episode[] = Array.from({ length: count }, (_, i) => ({
            // Each episode gets a unique id: "ep{number}-{animeId}"
            id: `ep${i + 1}-${animeKey}`,
            number: i + 1,
            title: `Episode ${i + 1}`,
        }))
        setEpisodes(virtualEpisodes)
        setSelectedEp(virtualEpisodes[0])
    }, [totalEpisodes, resolvedAnilistId, realMalId])

    // Fetch AniZip mapping dynamically
    useEffect(() => {
        if (!anilistId && !realMalId) return
        const query = anilistId ? `anilist_id=${anilistId}` : `mal_id=${realMalId}`
        fetch(`https://api.ani.zip/mappings?${query}`)
            .then(res => res.json())
            .then(data => {
                if (data?.mappings?.anilist_id && !anilistId) {
                    setResolvedAnilistId(data.mappings.anilist_id)
                }
                if (data?.episodes) {
                    const newMap: Record<number, { s: number, e: number, tId: string }> = {}
                    const baseTmdbId = data.mappings?.themoviedb_id || initialTmdbId
                    
                    Object.keys(data.episodes).forEach(key => {
                        const ep = data.episodes[key]
                        const absNum = ep.absoluteEpisodeNumber || Number(key)
                        if (ep.seasonNumber !== undefined && ep.episodeNumber !== undefined) {
                            newMap[absNum] = {
                                s: ep.seasonNumber,
                                e: ep.episodeNumber,
                                tId: String(baseTmdbId)
                            }
                        }
                    })
                    setAniZipMap(newMap)

                    // Enrich virtual episodes with real titles, thumbnails, and filler status
                    setEpisodes(prev => prev.map(p => {
                        const epData = data.episodes[String(p.number)]
                        if (epData) {
                            const titleEn = epData.title?.en
                            const titleRomaji = epData.title?.['x-jat'] || epData.title?.ro
                            const titleJa = epData.title?.ja
                            // Prefer English, fall back to romaji, then Japanese, then default
                            const title = titleEn || titleRomaji || titleJa || p.title
                            return {
                                ...p,
                                title: title,
                                image: epData.image || p.image,
                                isFiller: epData.isFiller || false
                            }
                        }
                        return p;
                    }))
                }
            })
            .catch(err => console.error("AniZip fetch failed:", err))
    }, [anilistId, realMalId, initialTmdbId])

    const currentEpNumber = selectedEp?.number ?? 1
    
    // Build the current context
    const epMapping = aniZipMap[currentEpNumber]
    const currentContext: EmbedContext = {
        malId: realMalId,
        anilistId: resolvedAnilistId || realMalId,
        ep: currentEpNumber,
        subDub,
        tmdbId: epMapping?.tId || (initialTmdbId ? String(initialTmdbId) : undefined),
        season: epMapping?.s,
        tmdbEp: epMapping?.e
    }

    const availableMirrors = MIRRORS

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
        setIframeError(false)
    }

    const reloadPlayer = () => {
        setIframeKey(k => k + 1)
        setIframeError(false)
    }

    const handleIframeError = () => {
        setIframeError(true)
    }

    const [isLightsOut, setIsLightsOut] = useState(false)

    if (!mounted) return null

    const activeMirror = availableMirrors[Math.min(mirrorIndex, availableMirrors.length - 1)]
    const embedUrl = activeMirror.buildUrl(currentContext) ?? ''

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

            {/* Lights Out Overlay */}
            {isLightsOut && (
                <div 
                    className="fixed inset-0 bg-black/95 z-40 cursor-pointer transition-opacity duration-500" 
                    onClick={() => setIsLightsOut(false)}
                />
            )}

            {/* ── Server Selector ── */}
            <div className={`flex flex-wrap gap-2 items-center relative ${isLightsOut ? 'z-50' : 'z-10'}`}>
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/30 mr-1">
                    <Server className="w-3 h-3" /> Servers
                </span>
                {availableMirrors.map((mirror, idx) => (
                    <button
                        key={mirror.name}
                        onClick={() => selectMirror(idx)}
                        className={cn(
                            'px-3 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5',
                            idx === Math.min(mirrorIndex, availableMirrors.length - 1)
                                ? 'bg-primary/20 border-primary/40 text-primary'
                                : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
                        )}
                    >
                        {mirror.name}
                        {mirror.tag && (
                            <span className={cn(
                                "text-[8px] font-black px-1 py-0.5 rounded uppercase tracking-wider",
                                idx === Math.min(mirrorIndex, availableMirrors.length - 1)
                                    ? 'bg-primary/30 text-primary'
                                    : 'bg-white/10 text-white/30'
                            )}>
                                {mirror.tag}
                            </span>
                        )}
                    </button>
                ))}
                <button
                    onClick={() => setIsLightsOut(!isLightsOut)}
                    className={cn(
                        "ml-auto px-3 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5",
                        isLightsOut ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-500" : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"
                    )}
                    title="Toggle Lights Out"
                >
                    <span className="w-2.5 h-2.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
                    Lights
                </button>
                <button
                    onClick={reloadPlayer}
                    className="px-2 py-1 rounded-lg text-xs font-bold border border-white/10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1"
                    title="Reload player"
                >
                    <RefreshCw className="w-3 h-3" />
                </button>
            </div>

            {/* ── Video Player ── */}
            <div className={`relative ${isLightsOut ? 'z-50' : 'z-10'}`}>
                {/* Ambient Lighting Glow */}
                <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-[100px] pointer-events-none scale-90 mix-blend-screen transform-gpu" />
                
                <div
                    className="relative bg-black rounded-xl md:rounded-3xl overflow-hidden border border-white/8 shadow-2xl shadow-black/60 w-full pb-[56.25%]"
                >
                    {!embedUrl ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/90">
                            <p className="text-white/40 text-sm font-medium">This server requires a MAL ID which is unavailable for this anime.</p>
                            <div className="flex gap-2">
                                {availableMirrors.map((m, idx) => {
                                    const url = m.buildUrl(currentContext)
                                    if (!url || idx === mirrorIndex) return null
                                    return (
                                        <button
                                            key={m.name}
                                            onClick={() => selectMirror(idx)}
                                            className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-bold rounded-lg transition-colors"
                                        >
                                            Try {m.name}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ) : iframeError ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/90">
                            <p className="text-white/60 text-sm font-medium">Player failed to load</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={reloadPlayer}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors"
                                >
                                    Retry
                                </button>
                                {mirrorIndex < availableMirrors.length - 1 && (
                                    <button
                                        onClick={() => selectMirror(mirrorIndex + 1)}
                                        className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-bold rounded-lg transition-colors"
                                    >
                                        Try Next Server
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <iframe
                            key={`${iframeKey}-${currentEpNumber}-${mirrorIndex}`}
                            src={embedUrl}
                            className="absolute top-0 left-0 w-full h-full border-0 bg-black"
                            allowFullScreen={true}
                            allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write"
                            referrerPolicy="no-referrer-when-downgrade"
                            onError={handleIframeError}
                            {...({ webkitallowfullscreen: "true", mozallowfullscreen: "true", playsInline: true } as any)}
                        />
                    )}
                </div>
            </div>

            {/* ── Controls bar ── */}
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1 relative ${isLightsOut ? 'z-50' : 'z-10'}`}>
                <div className="flex flex-col gap-0.5 min-w-0">
                    <h2 className="font-outfit text-sm md:text-base font-bold text-white flex items-center gap-2 truncate">
                        Episode {currentEpNumber}
                    </h2>
                    <p className="text-[10px] md:text-xs text-white/40 font-medium truncate max-w-[280px] md:max-w-[400px]">
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
