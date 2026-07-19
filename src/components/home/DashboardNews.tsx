'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ChevronRight, Flame, Clock, ArrowUpRight, FileText, Loader2, Link2, Share2, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import type { AniNewsItem } from '@/components/news/NewsFeed'
import { NewsArticleModal } from '@/components/news/NewsArticleModal'
import { ShareNewsModal } from '@/components/news/ShareNewsModal'
import { toast } from 'sonner'

const SOURCE_CONFIG: Record<string, { label: string; accent: string; dot: string }> = {
    ann:          { label: 'ANN',          accent: 'text-blue-400',      dot: 'bg-blue-400' },
    animecorner:  { label: 'Anime Corner', accent: 'text-violet-400',    dot: 'bg-violet-400' },
    myanimelist:  { label: 'MAL',          accent: 'text-sky-400',       dot: 'bg-sky-400' },
    otakuusa:     { label: 'Otaku USA',    accent: 'text-orange-400',    dot: 'bg-orange-400' },
    crunchyroll:  { label: 'Crunchyroll',  accent: 'text-amber-400',     dot: 'bg-amber-400' },
    animeherald:  { label: 'Anime Herald', accent: 'text-emerald-400',   dot: 'bg-emerald-400' },
    comicbook:    { label: 'Comic Book',   accent: 'text-rose-400',      dot: 'bg-rose-400' },
}

function getSourceKey(sourceName: string): string {
    const lower = sourceName.toLowerCase().replace(/\s+/g, '')
    const sources = Object.keys(SOURCE_CONFIG)
    return sources.find(k => lower.includes(k)) || 'ann'
}

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
    const cfg = SOURCE_CONFIG[srcKey] || SOURCE_CONFIG.ann
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
                    className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground/50 hover:text-white transition-colors"
                >
                    <Share2 className="w-3.5 h-3.5" />
                </button>

                <AnimatePresence>
                    {open && (
                        <>
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

export function DashboardNews() {
    const [articles, setArticles] = useState<AniNewsItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedArticle, setSelectedArticle] = useState<AniNewsItem | null>(null)

    useEffect(() => {
        async function fetchLatestNews() {
            try {
                const res = await fetch('/api/news?limit=4&imagesOnly=true')
                if (!res.ok) throw new Error()
                const json = await res.json()
                setArticles(json.data || [])
            } catch (error) {
                console.error("Failed to fetch news", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchLatestNews()
    }, [])

    if (isLoading) {
        return (
            <div className="space-y-6 md:space-y-8 animate-pulse">
                <div className="flex items-center justify-between">
                    <div className="h-8 w-48 bg-secondary/40 rounded-lg"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-64 bg-secondary/40 rounded-3xl"></div>
                    <div className="space-y-4">
                        <div className="h-20 bg-secondary/30 rounded-2xl"></div>
                        <div className="h-20 bg-secondary/30 rounded-2xl"></div>
                        <div className="h-20 bg-secondary/30 rounded-2xl"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!articles.length) return null

    const featured = articles[0]
    const listArticles = articles.slice(1, 4)

    return (
        <div className="space-y-6 md:space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black italic tracking-tight bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">Latest News</h3>
                </div>
                <Link href="/news" className="text-sm font-bold text-muted-foreground hover:text-orange-400 transition-colors flex items-center gap-1 group">
                    Live Feed <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Featured Card */}
                {featured && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        onClick={() => setSelectedArticle(featured)}
                        className="group relative h-64 md:h-full min-h-[320px] rounded-3xl overflow-hidden cursor-pointer bg-card border border-border/30 hover:border-white/20 transition-all duration-500 shadow-xl"
                    >
                        {featured.image ? (
                            <div className="absolute inset-0">
                                <img
                                    src={featured.image}
                                    alt={featured.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                            </div>
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-secondary/50 to-background" />
                        )}
                        
                        <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                            <SourceBadge source={featured.source} date={featured.date} />
                            <h2 className="mt-3 text-xl md:text-2xl font-bold text-white leading-tight tracking-tight line-clamp-3 group-hover:text-orange-50 transition-colors">
                                {featured.title}
                            </h2>
                            <div className="mt-4 flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-xs font-medium text-white/50 group-hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
                                    Read Briefing <ArrowUpRight className="w-3.5 h-3.5" />
                                </span>
                                <div onClick={e => e.stopPropagation()}>
                                    <ShareButton article={featured} />
                                </div>
                            </div>
                        </div>
                        {/* Hover glow */}
                        <div className="absolute inset-0 bg-orange-500/0 group-hover:bg-orange-500/10 transition-colors duration-500 pointer-events-none" />
                    </motion.div>
                )}

                {/* List Cards */}
                <div className="flex flex-col gap-4">
                    {listArticles.map((article, i) => (
                        <motion.div
                            key={article.slug}
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => setSelectedArticle(article)}
                            className="group flex gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 bg-card/40 border border-white/5 hover:bg-white/5 hover:border-white/10"
                        >
                            {article.image && (
                                <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 relative bg-secondary/30 border border-white/5 hidden sm:block">
                                    <img
                                        src={article.image}
                                        alt={article.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                </div>
                            )}
                            <div className="flex-1 flex flex-col justify-center py-1">
                                <SourceBadge source={article.source} date={article.date} small />
                                <h3 className="mt-1.5 text-sm md:text-base font-semibold leading-snug tracking-tight text-foreground/90 group-hover:text-white transition-colors line-clamp-2">
                                    {article.title}
                                </h3>
                                <div className="mt-auto pt-2 flex items-center justify-between">
                                    <div className="flex gap-1.5">
                                        {article.tags?.slice(0, 2).map(tag => (
                                            <span key={tag} className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    
                    {/* View All Banner */}
                    <Link href="/news" className="mt-auto relative h-16 rounded-2xl overflow-hidden group border border-border">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 group-hover:from-orange-500/20 group-hover:to-red-500/20 transition-colors duration-500" />
                        <div className="absolute inset-0 flex items-center justify-between px-6">
                            <span className="text-sm font-bold tracking-widest uppercase text-foreground/80 group-hover:text-white transition-colors">
                                View All News
                            </span>
                            <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center text-foreground group-hover:scale-110 transition-transform shadow-lg border border-white/10">
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            <AnimatePresence>
                {selectedArticle && (
                    <NewsArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
                )}
            </AnimatePresence>
        </div>
    )
}
