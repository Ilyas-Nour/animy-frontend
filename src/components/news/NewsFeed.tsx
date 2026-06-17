'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search, X, ChevronRight, Loader2, RefreshCw,
    ExternalLink, Clock, ArrowUpRight, Flame, Rss,
    FileText, Share2, Users, Link2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { NewsArticleModal } from './NewsArticleModal'
import { ShareNewsModal } from './ShareNewsModal'
import { toast } from 'sonner'

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
export interface AniNewsItem {
    title: string
    slug: string
    source: string
    excerpt: string
    date: string
    image: string | null
    link: string
    tags: string[]
}

interface NewsMeta {
    total: number
    returned: number
    hasMore: boolean
    nextCursor?: string
}

// ─────────────────────────────────────────────────────────
// Source config
// ─────────────────────────────────────────────────────────
const SOURCE_CONFIG: Record<string, { label: string; accent: string; dot: string }> = {
    all:          { label: 'All',          accent: 'text-white',         dot: 'bg-white' },
    ann:          { label: 'ANN',          accent: 'text-blue-400',      dot: 'bg-blue-400' },
    animecorner:  { label: 'Anime Corner', accent: 'text-violet-400',    dot: 'bg-violet-400' },
    myanimelist:  { label: 'MAL',          accent: 'text-sky-400',       dot: 'bg-sky-400' },
    otakuusa:     { label: 'Otaku USA',    accent: 'text-orange-400',    dot: 'bg-orange-400' },
    crunchyroll:  { label: 'Crunchyroll',  accent: 'text-amber-400',     dot: 'bg-amber-400' },
    animeherald:  { label: 'Anime Herald', accent: 'text-emerald-400',   dot: 'bg-emerald-400' },
    comicbook:    { label: 'Comic Book',   accent: 'text-rose-400',      dot: 'bg-rose-400' },
}
const SOURCES = Object.keys(SOURCE_CONFIG)

function getSourceKey(sourceName: string): string {
    const lower = sourceName.toLowerCase().replace(/\s+/g, '')
    return SOURCES.find(k => k !== 'all' && lower.includes(k)) || 'ann'
}

// ─────────────────────────────────────────────────────────
// Main Feed
// ─────────────────────────────────────────────────────────
export function NewsFeed() {
    const [articles, setArticles] = useState<AniNewsItem[]>([])
    const [meta, setMeta] = useState<NewsMeta | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [activeSource, setActiveSource] = useState('all')
    const [searchInput, setSearchInput] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [cursor, setCursor] = useState<string | undefined>()
    const [selectedArticle, setSelectedArticle] = useState<AniNewsItem | null>(null)
    const debounceRef = useRef<NodeJS.Timeout>()

    const fetchNews = useCallback(async (opts: {
        source?: string; query?: string; cursor?: string; append?: boolean
    } = {}) => {
        const { source = activeSource, query = searchQuery, cursor: cur, append = false } = opts
        if (!append) { setIsLoading(true); setArticles([]) }
        else setIsLoadingMore(true)

        try {
            const p = new URLSearchParams({ limit: '16' })
            if (source !== 'all') p.set('source', source)
            if (query) p.set('q', query)
            if (cur) p.set('cursor', cur)

            const res = await fetch(`/api/news?${p}`)
            if (!res.ok) throw new Error()
            const json = await res.json()

            const items: AniNewsItem[] = json.data || []
            const newMeta: NewsMeta = json.meta || { total: 0, returned: 0, hasMore: false }

            setArticles(prev => append ? [...prev, ...items] : items)
            setMeta(newMeta)
            setCursor(newMeta.nextCursor)
        } catch {
            // silent
        } finally {
            setIsLoading(false)
            setIsLoadingMore(false)
        }
    }, [activeSource, searchQuery])

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchNews() }, [])

    const handleSource = (src: string) => {
        setActiveSource(src)
        setSearchInput('')
        setSearchQuery('')
        fetchNews({ source: src, query: '' })
    }

    const handleSearch = (val: string) => {
        setSearchInput(val)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            setSearchQuery(val)
            fetchNews({ query: val, source: activeSource })
        }, 480)
    }

    // Separate articles with and without images for smart layout
    const withImages = articles.filter(a => a.image)
    const withoutImages = articles.filter(a => !a.image)
    const featured = withImages[0] ?? articles[0]
    const gridArticles = featured ? articles.filter(a => a.slug !== featured.slug) : articles

    return (
        <>
            {/* ── Controls ── */}
            <div className="space-y-4 mb-10">
                <div className="relative max-w-lg mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                        value={searchInput}
                        onChange={e => handleSearch(e.target.value)}
                        placeholder="Search anime news..."
                        className="w-full h-12 pl-11 pr-10 bg-white/5 border border-white/10 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-white/25 focus:bg-white/8 transition-all"
                    />
                    {searchInput && (
                        <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Source pills — horizontal scroll on mobile, wrapped on larger screens */}
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide sm:flex-wrap sm:justify-center">
                    {SOURCES.map(src => {
                        const cfg = SOURCE_CONFIG[src]
                        const active = activeSource === src
                        return (
                            <button
                                key={src}
                                onClick={() => handleSource(src)}
                                className={cn(
                                    "shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap",
                                    active
                                        ? "bg-white text-black shadow-md shadow-white/10"
                                        : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent hover:border-white/10"
                                )}
                            >
                                {active && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />}
                                {cfg.label}
                            </button>
                        )
                    })}
                </div>

                {meta && !isLoading && (
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground/50 px-1">
                        <span>{meta.total} articles · 7 live sources</span>
                        <button onClick={() => fetchNews()} className="flex items-center gap-1.5 hover:text-muted-foreground transition-colors">
                            <RefreshCw className="w-3 h-3" />Refresh
                        </button>
                    </div>
                )}
            </div>

            {/* ── Feed ── */}
            {isLoading ? (
                <LoadingSkeleton />
            ) : articles.length === 0 ? (
                <EmptyState query={searchQuery} />
            ) : (
                <div className="space-y-6">
                    {/* Featured hero */}
                    {featured && (
                        <FeaturedCard article={featured} onOpen={setSelectedArticle} />
                    )}

                    {/* Divider */}
                    {gridArticles.length > 0 && (
                        <div className="flex items-center gap-3 pt-2">
                            <div className="flex-1 h-px bg-border/30" />
                            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/30">Latest</span>
                            <div className="flex-1 h-px bg-border/30" />
                        </div>
                    )}

                    {/*
                      Responsive grid:
                      - Mobile (<640px): 1 column
                      - Tablet (640-1024px): 2 columns
                      - Desktop (>1024px): 3 columns
                      Text-only cards auto-size to their column without image placeholder.
                    */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
                        {gridArticles.map((article, i) => (
                            article.image
                                ? <ImageCard key={article.slug} article={article} index={i} onOpen={setSelectedArticle} />
                                : <TextCard key={article.slug} article={article} index={i} onOpen={setSelectedArticle} />
                        ))}
                    </div>

                    {meta?.hasMore && (
                        <div className="flex justify-center pt-6">
                            <button
                                onClick={() => fetchNews({ cursor, append: true })}
                                disabled={isLoadingMore}
                                className="flex items-center gap-2 px-8 py-3 rounded-2xl border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all disabled:opacity-40"
                            >
                                {isLoadingMore
                                    ? <><Loader2 className="w-4 h-4 animate-spin" />Loading...</>
                                    : <><ChevronRight className="w-4 h-4" />Load more</>
                                }
                            </button>
                        </div>
                    )}
                </div>
            )}

            <AnimatePresence>
                {selectedArticle && (
                    <NewsArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
                )}
            </AnimatePresence>
        </>
    )
}

// ─────────────────────────────────────────────────────────
// Source badge
// ─────────────────────────────────────────────────────────
function safeFormatDistance(dateStr: string) {
    try {
        const d = new Date(dateStr)
        if (isNaN(d.getTime())) return 'recently'
        return formatDistanceToNow(d, { addSuffix: true })
    } catch {
        return 'recently'
    }
}

function SourceBadge({ source, date, small }: { source: string; date: string; small?: boolean }) {
    const srcKey = getSourceKey(source)
    const cfg = SOURCE_CONFIG[srcKey]
    return (
        <div className={cn("flex items-center gap-2 flex-wrap", small ? "text-[10px]" : "text-xs")}>
            <span className={cn("font-bold", cfg.accent)}>{source}</span>
            <span className="text-muted-foreground/30">·</span>
            <span className="text-muted-foreground/50 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {safeFormatDistance(date)}
            </span>
        </div>
    )
}

// ─────────────────────────────────────────────────────────
// Share button (split: friends / external)
// ─────────────────────────────────────────────────────────
function ShareButton({ article }: { article: AniNewsItem }) {
    const [open, setOpen] = useState(false)
    const [showFriendsModal, setShowFriendsModal] = useState(false)

    const handleExternalShare = (e: React.MouseEvent) => {
        e.stopPropagation()
        setOpen(false)
        if (navigator.share) {
            navigator.share({ title: article.title, url: article.link }).catch(() => { })
        } else {
            navigator.clipboard.writeText(article.link)
            toast.success('Link copied to clipboard')
        }
    }

    return (
        <>
            <div className="relative" onClick={e => e.stopPropagation()}>
                <button
                    onClick={() => setOpen(v => !v)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                    <Share2 className="w-3.5 h-3.5" />
                </button>

                <AnimatePresence>
                    {open && (
                        <>
                            {/* Click-away backdrop */}
                            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-8 z-50 min-w-[170px] bg-card border border-border/60 rounded-xl shadow-xl overflow-hidden"
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); setOpen(false); setShowFriendsModal(true) }}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium hover:bg-accent/50 transition-colors text-left"
                                >
                                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                                    Share to friends
                                </button>
                                <div className="h-px bg-border/40 mx-3" />
                                <button
                                    onClick={handleExternalShare}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium hover:bg-accent/50 transition-colors text-left"
                                >
                                    <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                                    Copy link
                                </button>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            <ShareNewsModal
                open={showFriendsModal}
                onOpenChange={setShowFriendsModal}
                newsItem={{ id: article.slug, title: article.title, url: article.link, image_url: article.image ?? undefined }}
            />
        </>
    )
}

// ─────────────────────────────────────────────────────────
// Featured hero card (full-width)
// ─────────────────────────────────────────────────────────
function FeaturedCard({ article, onOpen }: { article: AniNewsItem; onOpen: (a: AniNewsItem) => void }) {
    const [imgError, setImgError] = useState(false)
    const hasImage = article.image && !imgError

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="group relative rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer bg-card border border-border/30 hover:border-border/60 transition-all duration-400"
            onClick={() => onOpen(article)}
        >
            {hasImage ? (
                <>
                    {/* Responsive image height */}
                    <div className="relative w-full h-52 sm:h-72 md:h-80 overflow-hidden">
                        <img
                            src={article.image!}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={() => setImgError(true)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
                        <SourceBadge source={article.source} date={article.date} />
                        <h2 className="mt-2 text-lg sm:text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight line-clamp-2">
                            {article.title}
                        </h2>
                        {article.excerpt && (
                            <p className="mt-1.5 text-xs sm:text-sm text-white/55 line-clamp-2 leading-relaxed hidden sm:block">
                                {article.excerpt}
                            </p>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs text-white/40 group-hover:text-white/70 transition-colors">
                                Read article <ArrowUpRight className="w-3.5 h-3.5" />
                            </span>
                            <div onClick={e => e.stopPropagation()}>
                                <ShareButton article={article} />
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="p-6 sm:p-8 md:p-10">
                    <SourceBadge source={article.source} date={article.date} />
                    <h2 className="mt-3 text-xl sm:text-2xl md:text-3xl font-bold leading-tight tracking-tight">
                        {article.title}
                    </h2>
                    {article.excerpt && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                            {article.excerpt}
                        </p>
                    )}
                    <div className="mt-5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                            Read article <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                        <ShareButton article={article} />
                    </div>
                </div>
            )}
        </motion.div>
    )
}

// ─────────────────────────────────────────────────────────
// Image card (grid)
// ─────────────────────────────────────────────────────────
function ImageCard({ article, index, onOpen }: { article: AniNewsItem; index: number; onOpen: (a: AniNewsItem) => void }) {
    const [imgError, setImgError] = useState(false)

    if (imgError) return <TextCard article={article} index={index} onOpen={onOpen} />

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.16) }}
            onClick={() => onOpen(article)}
            className="group flex flex-col rounded-2xl overflow-hidden cursor-pointer bg-card border border-border/30 hover:border-border/60 transition-all duration-300 hover:-translate-y-0.5"
        >
            <div className="relative w-full aspect-video overflow-hidden bg-secondary/30 shrink-0">
                <img
                    src={article.image!}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={() => setImgError(true)}
                    loading="lazy"
                />
            </div>
            <div className="flex flex-col flex-1 p-4">
                <SourceBadge source={article.source} date={article.date} small />
                <h3 className="mt-2 text-sm font-semibold leading-snug tracking-tight line-clamp-2 group-hover:text-foreground/80 transition-colors">
                    {article.title}
                </h3>
                {article.excerpt && (
                    <p className="mt-1.5 text-xs text-muted-foreground/60 line-clamp-2 leading-relaxed hidden sm:block">
                        {article.excerpt}
                    </p>
                )}
                <div className="mt-auto pt-3 flex items-center justify-between">
                    <div className="flex gap-1.5 flex-wrap">
                        {article.tags?.filter(t => !['news', 'anime', 'manga'].includes(t)).slice(0, 2).map(tag => (
                            <span key={tag} className="text-[9px] font-medium text-muted-foreground/40 uppercase tracking-wide">#{tag}</span>
                        ))}
                    </div>
                    <div className="flex items-center gap-1">
                        <ShareButton article={article} />
                        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/70 transition-colors" />
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// ─────────────────────────────────────────────────────────
// Text-only card (no image) — distinct design, no placeholder
// ─────────────────────────────────────────────────────────
function TextCard({ article, index, onOpen }: { article: AniNewsItem; index: number; onOpen: (a: AniNewsItem) => void }) {
    const srcKey = getSourceKey(article.source)
    const cfg = SOURCE_CONFIG[srcKey]

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.16) }}
            onClick={() => onOpen(article)}
            className={cn(
                "group flex flex-col rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5",
                "border-l-[3px] bg-card/50 border border-border/20 hover:border-border/50 p-4",
                // Left border uses source accent color
                srcKey === 'ann' && "border-l-blue-500/50",
                srcKey === 'animecorner' && "border-l-violet-500/50",
                srcKey === 'myanimelist' && "border-l-sky-500/50",
                srcKey === 'otakuusa' && "border-l-orange-500/50",
                srcKey === 'crunchyroll' && "border-l-amber-500/50",
                srcKey === 'animeherald' && "border-l-emerald-500/50",
                srcKey === 'comicbook' && "border-l-rose-500/50",
            )}
        >
            {/* Text indicator badge */}
            <div className="flex items-center gap-2 mb-2.5">
                <FileText className="w-3 h-3 text-muted-foreground/30 shrink-0" />
                <SourceBadge source={article.source} date={article.date} small />
            </div>

            <h3 className="text-sm font-semibold leading-snug tracking-tight line-clamp-3 group-hover:text-foreground/80 transition-colors flex-1">
                {article.title}
            </h3>

            {article.excerpt && (
                <p className="mt-2 text-xs text-muted-foreground/55 line-clamp-2 leading-relaxed">
                    {article.excerpt}
                </p>
            )}

            <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-1.5">
                    {article.tags?.filter(t => !['news', 'anime', 'manga'].includes(t)).slice(0, 1).map(tag => (
                        <span key={tag} className="text-[9px] font-medium text-muted-foreground/35 uppercase tracking-wide">#{tag}</span>
                    ))}
                </div>
                <div className="flex items-center gap-0.5">
                    <ShareButton article={article} />
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/70 transition-colors" />
                </div>
            </div>
        </motion.div>
    )
}

// ─────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="rounded-2xl sm:rounded-3xl overflow-hidden bg-card border border-border/20">
                <div className="h-52 sm:h-72 bg-secondary/40" />
                <div className="p-5 space-y-2">
                    <div className="h-3 w-28 bg-secondary/50 rounded-full" />
                    <div className="h-6 w-3/4 bg-secondary/50 rounded-xl" />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden bg-card border border-border/20">
                        <div className="aspect-video bg-secondary/40" />
                        <div className="p-4 space-y-2">
                            <div className="h-2.5 w-20 bg-secondary/40 rounded-full" />
                            <div className="h-4 bg-secondary/40 rounded-lg" />
                            <div className="h-3 w-4/5 bg-secondary/30 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function EmptyState({ query }: { query: string }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <div className="w-14 h-14 rounded-2xl bg-secondary/30 flex items-center justify-center mx-auto mb-4">
                <Flame className="w-6 h-6 text-muted-foreground/20" />
            </div>
            <p className="text-sm font-semibold text-foreground/50">
                {query ? `No results for "${query}"` : 'No articles right now'}
            </p>
            <p className="text-xs text-muted-foreground/30 mt-1">Try a different source or check back soon</p>
        </motion.div>
    )
}
