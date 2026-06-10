'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search, X, ChevronRight, Loader2, RefreshCw,
    ExternalLink, Clock, ArrowUpRight, Flame, Rss
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/utils'
import { NewsArticleModal } from './NewsArticleModal'

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
// Source Config
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
            // silent fail
        } finally {
            setIsLoading(false)
            setIsLoadingMore(false)
        }
    }, [activeSource, searchQuery])

    useEffect(() => {
        fetchNews()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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

    const featured = articles[0]
    const rest = articles.slice(1)

    return (
        <>
            {/* ── Controls ── */}
            <div className="space-y-5 mb-10">
                {/* Search */}
                <div className="relative max-w-lg mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                        value={searchInput}
                        onChange={e => handleSearch(e.target.value)}
                        placeholder="Search news, shows, studios..."
                        className="w-full h-12 pl-11 pr-10 bg-white/5 border border-white/10 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-white/25 focus:bg-white/8 transition-all"
                    />
                    {searchInput && (
                        <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Source filter tabs */}
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide justify-center flex-wrap">
                    {SOURCES.map(src => {
                        const cfg = SOURCE_CONFIG[src]
                        const active = activeSource === src
                        return (
                            <button
                                key={src}
                                onClick={() => handleSource(src)}
                                className={cn(
                                    "shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap",
                                    active
                                        ? "bg-white text-black shadow-lg shadow-white/10"
                                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                )}
                            >
                                {active && <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5 -translate-y-px", cfg.dot)} />}
                                {cfg.label}
                            </button>
                        )
                    })}
                </div>

                {/* Meta line */}
                {meta && !isLoading && (
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground/60 px-1">
                        <span>{meta.total} articles · 7 live sources</span>
                        <button onClick={() => fetchNews()} className="flex items-center gap-1 hover:text-muted-foreground transition-colors">
                            <RefreshCw className="w-3 h-3" /> Refresh
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
                <div className="space-y-12">
                    {/* Featured Hero Article */}
                    {featured && (
                        <FeaturedCard article={featured} onOpen={setSelectedArticle} />
                    )}

                    {/* Divider */}
                    {rest.length > 0 && (
                        <div className="flex items-center gap-4">
                            <div className="flex-1 h-px bg-border/40" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Latest</span>
                            <div className="flex-1 h-px bg-border/40" />
                        </div>
                    )}

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {rest.map((article, i) => (
                            <GridCard key={article.slug} article={article} index={i} onOpen={setSelectedArticle} />
                        ))}
                    </div>

                    {/* Load More */}
                    {meta?.hasMore && (
                        <div className="flex justify-center pt-4">
                            <button
                                onClick={() => fetchNews({ cursor, append: true })}
                                disabled={isLoadingMore}
                                className="flex items-center gap-2 px-8 py-3 rounded-2xl border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all disabled:opacity-40"
                            >
                                {isLoadingMore
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                                    : <><ChevronRight className="w-4 h-4" /> Load more</>
                                }
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Article Modal */}
            <AnimatePresence>
                {selectedArticle && (
                    <NewsArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
                )}
            </AnimatePresence>
        </>
    )
}

// ─────────────────────────────────────────────────────────
// Featured Hero Card
// ─────────────────────────────────────────────────────────
function FeaturedCard({ article, onOpen }: { article: AniNewsItem; onOpen: (a: AniNewsItem) => void }) {
    const [imgError, setImgError] = useState(false)
    const srcKey = getSourceKey(article.source)
    const srcCfg = SOURCE_CONFIG[srcKey]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="group relative rounded-3xl overflow-hidden cursor-pointer bg-card border border-border/30 hover:border-border/60 transition-all duration-500"
            onClick={() => onOpen(article)}
        >
            {/* Image */}
            {article.image && !imgError ? (
                <div className="relative w-full aspect-[21/9] overflow-hidden">
                    <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={() => setImgError(true)}
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    {/* Content on image */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                        <SourceBadge source={article.source} srcCfg={srcCfg} date={article.date} />
                        <h2 className="mt-3 text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight line-clamp-2 group-hover:text-white/90 transition-colors">
                            {article.title}
                        </h2>
                        {article.excerpt && (
                            <p className="mt-2 text-sm text-white/60 line-clamp-2 leading-relaxed">
                                {article.excerpt}
                            </p>
                        )}
                        <div className="mt-4 flex items-center gap-2 text-xs text-white/50 font-medium">
                            <span>Read article</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-8 md:p-10">
                    <SourceBadge source={article.source} srcCfg={srcCfg} date={article.date} />
                    <h2 className="mt-4 text-2xl md:text-3xl font-bold leading-tight tracking-tight line-clamp-3">
                        {article.title}
                    </h2>
                    {article.excerpt && (
                        <p className="mt-3 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                            {article.excerpt}
                        </p>
                    )}
                    <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors">
                        Read article <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                </div>
            )}
        </motion.div>
    )
}

// ─────────────────────────────────────────────────────────
// Grid Card (compact)
// ─────────────────────────────────────────────────────────
function GridCard({ article, index, onOpen }: { article: AniNewsItem; index: number; onOpen: (a: AniNewsItem) => void }) {
    const [imgError, setImgError] = useState(false)
    const srcKey = getSourceKey(article.source)
    const srcCfg = SOURCE_CONFIG[srcKey]

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.2) }}
            onClick={() => onOpen(article)}
            className="group flex flex-col rounded-2xl overflow-hidden cursor-pointer bg-card border border-border/30 hover:border-border/60 transition-all duration-300 hover:-translate-y-0.5"
        >
            {/* Image */}
            {article.image && !imgError ? (
                <div className="relative w-full aspect-[16/9] overflow-hidden bg-secondary/40 shrink-0">
                    <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={() => setImgError(true)}
                    />
                </div>
            ) : (
                <div className="w-full aspect-[16/9] bg-gradient-to-br from-secondary/60 to-secondary/20 flex items-center justify-center shrink-0">
                    <Rss className="w-8 h-8 text-muted-foreground/20" />
                </div>
            )}

            {/* Body */}
            <div className="flex flex-col flex-1 p-4">
                <SourceBadge source={article.source} srcCfg={srcCfg} date={article.date} small />
                <h3 className="mt-2.5 text-sm font-semibold leading-snug tracking-tight line-clamp-2 group-hover:text-foreground/80 transition-colors">
                    {article.title}
                </h3>
                {article.excerpt && (
                    <p className="mt-1.5 text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed">
                        {article.excerpt}
                    </p>
                )}
                <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
                    {article.tags && article.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                            {article.tags
                                .filter(t => !['news', 'anime', 'manga'].includes(t))
                                .slice(0, 2)
                                .map(tag => (
                                    <span key={tag} className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-wide">
                                        #{tag}
                                    </span>
                                ))}
                        </div>
                    )}
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-foreground/60 transition-colors ml-auto" />
                </div>
            </div>
        </motion.div>
    )
}

// ─────────────────────────────────────────────────────────
// Source Badge
// ─────────────────────────────────────────────────────────
function SourceBadge({ source, srcCfg, date, small = false }: {
    source: string
    srcCfg: { label: string; accent: string; dot: string }
    date: string
    small?: boolean
}) {
    const timeAgo = formatDistanceToNow(new Date(date), { addSuffix: true })
    return (
        <div className={cn("flex items-center gap-2", small ? "text-[10px]" : "text-xs")}>
            <span className={cn("font-bold uppercase tracking-wider", srcCfg.accent)}>{source}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-muted-foreground/60 flex items-center gap-1">
                <Clock className={cn(small ? "w-2.5 h-2.5" : "w-3 h-3")} />
                {timeAgo}
            </span>
        </div>
    )
}

// ─────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
    return (
        <div className="space-y-12 animate-pulse">
            {/* Featured */}
            <div className="rounded-3xl overflow-hidden bg-card border border-border/20">
                <div className="aspect-[21/9] bg-secondary/40" />
                <div className="p-6 space-y-3">
                    <div className="h-3 w-32 bg-secondary/60 rounded-full" />
                    <div className="h-7 w-3/4 bg-secondary/60 rounded-xl" />
                    <div className="h-4 w-full bg-secondary/40 rounded-lg" />
                </div>
            </div>
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden bg-card border border-border/20">
                        <div className="aspect-[16/9] bg-secondary/40" />
                        <div className="p-4 space-y-2">
                            <div className="h-2.5 w-24 bg-secondary/50 rounded-full" />
                            <div className="h-4 w-full bg-secondary/50 rounded-lg" />
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
            <div className="w-16 h-16 rounded-2xl bg-secondary/40 flex items-center justify-center mx-auto mb-5">
                <Flame className="w-7 h-7 text-muted-foreground/30" />
            </div>
            <p className="text-base font-semibold text-foreground/60">
                {query ? `No results for "${query}"` : 'No articles right now'}
            </p>
            <p className="text-sm text-muted-foreground/40 mt-1">Try a different source or check back soon</p>
        </motion.div>
    )
}
