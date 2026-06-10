'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Share2, Heart, MessageCircle, ExternalLink, Search,
    X, ChevronDown, Loader2, RefreshCw, Rss, Filter,
    TrendingUp, Clock, Newspaper
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import api from '@/lib/api'
import { toast } from 'sonner'
import { CommentSection } from './CommentSection'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { ShareNewsModal } from './ShareNewsModal'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface AniNewsItem {
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
    availableSources?: string[]
}

// Source display config
const SOURCE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    all:          { label: 'All Sources', color: 'text-foreground',   bg: 'bg-secondary/60',        border: 'border-border' },
    ann:          { label: 'ANN',          color: 'text-blue-400',    bg: 'bg-blue-500/10',          border: 'border-blue-500/20' },
    animecorner:  { label: 'Anime Corner', color: 'text-purple-400',  bg: 'bg-purple-500/10',        border: 'border-purple-500/20' },
    myanimelist:  { label: 'MAL',          color: 'text-sky-400',     bg: 'bg-sky-500/10',           border: 'border-sky-500/20' },
    otakuusa:     { label: 'Otaku USA',    color: 'text-orange-400',  bg: 'bg-orange-500/10',        border: 'border-orange-500/20' },
    crunchyroll:  { label: 'Crunchyroll',  color: 'text-amber-400',   bg: 'bg-amber-500/10',         border: 'border-amber-500/20' },
    animeherald:  { label: 'Anime Herald', color: 'text-green-400',   bg: 'bg-green-500/10',         border: 'border-green-500/20' },
    comicbook:    { label: 'Comic Book',   color: 'text-red-400',     bg: 'bg-red-500/10',           border: 'border-red-500/20' },
}

const SOURCES = ['all', 'ann', 'animecorner', 'myanimelist', 'otakuusa', 'crunchyroll', 'animeherald', 'comicbook']

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────
export function NewsFeed() {
    const [articles, setArticles] = useState<AniNewsItem[]>([])
    const [meta, setMeta] = useState<NewsMeta | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [activeSource, setActiveSource] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [cursor, setCursor] = useState<string | undefined>(undefined)
    const searchTimeoutRef = useRef<NodeJS.Timeout>()

    const fetchNews = useCallback(async (opts: {
        source?: string
        query?: string
        cursor?: string
        append?: boolean
    } = {}) => {
        const { source = activeSource, query = searchQuery, cursor: cur, append = false } = opts

        if (!append) {
            setIsLoading(true)
            setArticles([])
            setCursor(undefined)
        } else {
            setIsLoadingMore(true)
        }

        try {
            const params = new URLSearchParams({ limit: '15' })
            if (source && source !== 'all') params.set('source', source)
            if (query) params.set('q', query)
            if (cur) params.set('cursor', cur)

            const res = await fetch(`/api/news?${params.toString()}`)
            if (!res.ok) throw new Error('Failed to fetch')
            const json = await res.json()

            const newArticles: AniNewsItem[] = json.data || []
            const newMeta: NewsMeta = json.meta || { total: 0, returned: 0, hasMore: false }

            setArticles(prev => append ? [...prev, ...newArticles] : newArticles)
            setMeta(newMeta)
            setCursor(newMeta.nextCursor)
        } catch (err) {
            toast.error('Failed to load news. Please try again.')
        } finally {
            setIsLoading(false)
            setIsLoadingMore(false)
            setIsRefreshing(false)
        }
    }, [activeSource, searchQuery])

    // Initial load - intentionally runs once on mount
    useEffect(() => {
        fetchNews()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Handle source change
    const handleSourceChange = (source: string) => {
        setActiveSource(source)
        setSearchQuery('')
        setSearchInput('')
        fetchNews({ source, query: '' })
    }

    // Handle search with debounce
    const handleSearchInputChange = (val: string) => {
        setSearchInput(val)
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
        searchTimeoutRef.current = setTimeout(() => {
            setSearchQuery(val)
            fetchNews({ query: val, source: activeSource })
        }, 500)
    }

    const handleRefresh = () => {
        setIsRefreshing(true)
        fetchNews({ source: activeSource, query: searchQuery })
    }

    const handleLoadMore = () => {
        if (cursor && !isLoadingMore) {
            fetchNews({ source: activeSource, query: searchQuery, cursor, append: true })
        }
    }

    return (
        <div className="w-full max-w-3xl mx-auto space-y-8">
            {/* ── Controls: Search + Source Filter ── */}
            <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={e => handleSearchInputChange(e.target.value)}
                        placeholder="Search anime news..."
                        className="w-full h-12 pl-11 pr-10 rounded-2xl bg-secondary/60 border border-border/50 focus:border-orange-500/40 focus:bg-secondary text-sm font-medium placeholder:text-muted-foreground/60 text-foreground outline-none transition-all"
                    />
                    {searchInput && (
                        <button
                            onClick={() => { setSearchInput(''); handleSearchInputChange('') }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl hover:bg-accent/50 text-muted-foreground transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Source Filter Pills */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {SOURCES.map(src => {
                        const cfg = SOURCE_CONFIG[src]
                        const isActive = activeSource === src
                        return (
                            <button
                                key={src}
                                onClick={() => handleSourceChange(src)}
                                className={cn(
                                    "shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all",
                                    isActive
                                        ? `${cfg.bg} ${cfg.border} ${cfg.color} shadow-sm`
                                        : "bg-secondary/40 border-border/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                )}
                            >
                                {cfg.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ── Stats bar ── */}
            {meta && !isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between text-xs text-muted-foreground px-1"
                >
                    <div className="flex items-center gap-1.5">
                        <Newspaper className="w-3.5 h-3.5" />
                        <span><span className="font-bold text-foreground">{meta.total}</span> articles from 7 sources</span>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
                        Refresh
                    </button>
                </motion.div>
            )}

            {/* ── Feed ── */}
            {isLoading ? (
                <NewsSkeletons />
            ) : articles.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20 text-muted-foreground"
                >
                    <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-bold text-sm">
                        {searchQuery ? `No results for "${searchQuery}"` : 'No news available right now'}
                    </p>
                    <p className="text-xs mt-1 opacity-60">Try a different source or check back soon</p>
                </motion.div>
            ) : (
                <div className="space-y-6">
                    <AnimatePresence mode="popLayout">
                        {articles.map((item, index) => (
                            <NewsCard key={item.slug} item={item} index={index} />
                        ))}
                    </AnimatePresence>

                    {/* Load More */}
                    {meta?.hasMore && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-center pt-4"
                        >
                            <button
                                onClick={handleLoadMore}
                                disabled={isLoadingMore}
                                className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-secondary/60 border border-border/50 hover:bg-secondary text-sm font-bold text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
                            >
                                {isLoadingMore ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" />Loading...</>
                                ) : (
                                    <><ChevronDown className="w-4 h-4" />Load More</>
                                )}
                            </button>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────
// Loading Skeletons
// ─────────────────────────────────────────────────────────
function NewsSkeletons() {
    return (
        <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-[2rem] overflow-hidden bg-card border border-border/30 animate-pulse">
                    <div className="p-5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary/80" />
                        <div className="space-y-2 flex-1">
                            <div className="h-3 w-24 bg-secondary/80 rounded-full" />
                            <div className="h-2 w-16 bg-secondary/50 rounded-full" />
                        </div>
                    </div>
                    <div className="px-5 pb-4 space-y-2">
                        <div className="h-5 bg-secondary/80 rounded-xl w-4/5" />
                        <div className="h-4 bg-secondary/60 rounded-xl w-3/5" />
                    </div>
                    <div className="w-full aspect-[16/9] bg-secondary/40" />
                    <div className="p-5">
                        <div className="h-3 w-full bg-secondary/40 rounded-full mb-2" />
                        <div className="h-3 w-2/3 bg-secondary/30 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    )
}

// ─────────────────────────────────────────────────────────
// Individual News Card
// ─────────────────────────────────────────────────────────
function NewsCard({ item, index }: { item: AniNewsItem; index: number }) {
    const { user } = useAuth()
    const [stats, setStats] = useState({ likes: 0, comments: 0, isLiked: false })
    const [showComments, setShowComments] = useState(false)
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [imgError, setImgError] = useState(false)

    const sourceKey = Object.keys(SOURCE_CONFIG).find(k =>
        item.source.toLowerCase().replace(/\s+/g, '').includes(k) ||
        k.includes(item.source.toLowerCase().replace(/\s+/g, '').slice(0, 5))
    ) || 'ann'
    const srcCfg = SOURCE_CONFIG[sourceKey] || SOURCE_CONFIG['ann']

    useEffect(() => {
        const fetchEngagement = async () => {
            try {
                const url = `/news-engagement/${item.slug}${user ? `?userId=${user.id}` : ''}`
                const res = await api.get(url)
                const data = res.data.data
                setStats({
                    likes: data._count?.reactions || 0,
                    comments: data._count?.comments || 0,
                    isLiked: data.isLiked || false
                })
            } catch {
                // silence - engagement is optional
            }
        }
        fetchEngagement()
    }, [item.slug, user])

    const handleLike = async () => {
        if (!user) { toast.error('Sign in to like articles'); return }
        const wasLiked = stats.isLiked
        setStats(prev => ({ ...prev, likes: wasLiked ? prev.likes - 1 : prev.likes + 1, isLiked: !wasLiked }))
        try {
            await api.post('/reactions', { type: 'LIKE', providerId: item.slug })
        } catch {
            setStats(prev => ({ ...prev, likes: wasLiked ? prev.likes + 1 : prev.likes - 1, isLiked: wasLiked }))
        }
    }

    const handleShare = async () => {
        if (navigator.share) {
            try { await navigator.share({ title: item.title, url: item.link }) } catch { }
        } else {
            navigator.clipboard.writeText(item.link)
            toast.success('Link copied!')
        }
    }

    const hasImage = item.image && !imgError

    return (
        <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.2) }}
            className="group relative bg-card dark:bg-[#0a0a0a]/80 border border-border/40 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-lg hover:shadow-orange-500/10 hover:border-border/70 transition-all duration-500 hover:-translate-y-0.5 backdrop-blur-xl"
        >
            {/* Top shimmer */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

            {/* Source badge + meta */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    {/* Source pill */}
                    <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border",
                        srcCfg.bg, srcCfg.border, srcCfg.color
                    )}>
                        <Rss className="w-2.5 h-2.5" />
                        {item.source}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-medium flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                    </span>
                </div>

                {/* Share dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded-xl bg-secondary/50 border border-border hover:bg-secondary hover:scale-105 transition-all focus:outline-none">
                            <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-card border-border rounded-2xl shadow-2xl min-w-[180px] p-2 z-50">
                        <DropdownMenuItem
                            onClick={() => setIsShareModalOpen(true)}
                            className="rounded-xl p-2.5 flex items-center gap-2.5 focus:bg-indigo-500/10 focus:text-indigo-500 cursor-pointer text-xs font-black uppercase tracking-tight"
                        >
                            Share to Friends
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={handleShare}
                            className="rounded-xl p-2.5 flex items-center gap-2.5 focus:bg-indigo-500/10 focus:text-indigo-500 cursor-pointer text-xs font-black uppercase tracking-tight"
                        >
                            Copy Link
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <ShareNewsModal
                open={isShareModalOpen}
                onOpenChange={setIsShareModalOpen}
                newsItem={{ id: item.slug, title: item.title, url: item.link, image_url: item.image ?? undefined }}
            />

            {/* Title */}
            <div className="px-5 pb-4">
                <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/link block"
                >
                    <h2 className="text-lg md:text-xl font-black text-foreground leading-[1.25] tracking-tight group-hover/link:text-orange-500 transition-colors">
                        {item.title}
                    </h2>
                </a>
            </div>

            {/* Image */}
            {hasImage && (
                <div className="px-3 pb-0">
                    <div className="w-full aspect-[16/9] relative rounded-[1.5rem] overflow-hidden bg-secondary group/img">
                        <img
                            src={item.image!}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105"
                            onError={() => setImgError(true)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
                        {/* External link overlay */}
                        <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 flex items-end justify-end p-3 opacity-0 group-hover/img:opacity-100 transition-opacity"
                        >
                            <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold">
                                <ExternalLink className="w-3 h-3" />
                                Read Full Article
                            </span>
                        </a>
                    </div>
                </div>
            )}

            {/* Excerpt */}
            {item.excerpt && (
                <p className="px-5 py-4 text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {item.excerpt}
                </p>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
                <div className="px-5 pb-4 flex flex-wrap gap-1.5">
                    {item.tags.filter(t => !['news', 'anime', 'manga'].includes(t)).slice(0, 4).map(tag => (
                        <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md bg-secondary/60 text-muted-foreground text-[9px] font-bold uppercase tracking-wide border border-border/30"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Actions Footer */}
            <div className="px-5 pb-5">
                <div className="flex items-center gap-2 pt-3 border-t border-border/30">
                    <button
                        onClick={handleLike}
                        className={cn(
                            "flex-1 h-11 rounded-xl flex items-center justify-center gap-2 transition-all font-black text-[10px] uppercase tracking-wider border",
                            stats.isLiked
                                ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                    >
                        <Heart className={cn("w-4 h-4", stats.isLiked && "fill-current")} />
                        <span>{stats.likes}</span>
                    </button>

                    <button
                        onClick={() => setShowComments(!showComments)}
                        className={cn(
                            "flex-1 h-11 rounded-xl flex items-center justify-center gap-2 transition-all font-black text-[10px] uppercase tracking-wider border",
                            showComments
                                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-500"
                                : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span>{stats.comments}</span>
                    </button>

                    <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-11 px-4 rounded-xl flex items-center justify-center gap-1.5 bg-secondary/50 border border-border text-muted-foreground hover:bg-orange-500/10 hover:border-orange-500/20 hover:text-orange-500 transition-all font-black text-[10px] uppercase tracking-wider"
                    >
                        <ExternalLink className="w-4 h-4" />
                        <span className="hidden sm:inline">Source</span>
                    </a>
                </div>

                {/* Comment Section */}
                <AnimatePresence>
                    {showComments && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                            className="overflow-hidden"
                        >
                            <div className="pt-6 mt-4 border-t border-border/30">
                                <CommentSection newsId={item.slug} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.article>
    )
}
