'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, ExternalLink, Clock, Heart, MessageCircle, Share2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { AniNewsItem } from './NewsFeed'
import { cn } from '@/lib/utils'
import { CommentSection } from './CommentSection'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import { toast } from 'sonner'

interface Props {
    article: AniNewsItem
    onClose: () => void
}

export function NewsArticleModal({ article, onClose }: Props) {
    const { user } = useAuth()
    const [imgError, setImgError] = useState(false)
    const [stats, setStats] = useState({ likes: 0, comments: 0, isLiked: false })
    const [showComments, setShowComments] = useState(false)

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    // Fetch engagement
    useEffect(() => {
        const fetch = async () => {
            try {
                const url = `/news-engagement/${article.slug}${user ? `?userId=${user.id}` : ''}`
                const res = await api.get(url)
                const data = res.data.data
                setStats({ likes: data._count?.reactions || 0, comments: data._count?.comments || 0, isLiked: data.isLiked || false })
            } catch { }
        }
        fetch()
    }, [article.slug, user])

    const handleLike = async () => {
        if (!user) { toast.error('Sign in to like articles'); return }
        const wasLiked = stats.isLiked
        setStats(prev => ({ ...prev, likes: wasLiked ? prev.likes - 1 : prev.likes + 1, isLiked: !wasLiked }))
        try {
            await api.post('/reactions', { type: 'LIKE', providerId: article.slug })
        } catch {
            setStats(prev => ({ ...prev, likes: wasLiked ? prev.likes + 1 : prev.likes - 1, isLiked: wasLiked }))
        }
    }

    const handleShare = () => {
        if (navigator.share) navigator.share({ title: article.title, url: article.link }).catch(() => { })
        else { navigator.clipboard.writeText(article.link); toast.success('Link copied!') }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

            {/* Panel */}
            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.97 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="relative w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] bg-background border border-border/50 rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{article.source}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(article.date), { addSuffix: true })}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="overflow-y-auto flex-1">
                    {/* Hero Image */}
                    {article.image && !imgError && (
                        <div className="w-full aspect-[16/9] overflow-hidden bg-secondary/30">
                            <img
                                src={article.image}
                                alt={article.title}
                                className="w-full h-full object-cover"
                                onError={() => setImgError(true)}
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-6 space-y-4">
                        {/* Tags */}
                        {article.tags && article.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {article.tags.filter(t => !['news', 'anime', 'manga'].includes(t)).slice(0, 5).map(tag => (
                                    <span key={tag} className="px-2 py-0.5 rounded-md bg-secondary/60 text-muted-foreground text-[10px] font-semibold uppercase tracking-wider border border-border/30">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Title */}
                        <h2 className="text-xl md:text-2xl font-bold leading-snug tracking-tight">
                            {article.title}
                        </h2>

                        {/* Excerpt */}
                        {article.excerpt && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {article.excerpt}
                            </p>
                        )}

                        {/* Read Full CTA */}
                        <a
                            href={article.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-opacity"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Read Full Article on {article.source}
                        </a>

                        {/* Engagement */}
                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={handleLike}
                                className={cn(
                                    "flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold border transition-all",
                                    stats.isLiked
                                        ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                        : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                                )}
                            >
                                <Heart className={cn("w-3.5 h-3.5", stats.isLiked && "fill-current")} />
                                {stats.likes > 0 ? stats.likes : 'Like'}
                            </button>

                            <button
                                onClick={() => setShowComments(!showComments)}
                                className={cn(
                                    "flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold border transition-all",
                                    showComments
                                        ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-500"
                                        : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                                )}
                            >
                                <MessageCircle className="w-3.5 h-3.5" />
                                {stats.comments > 0 ? stats.comments : 'Comment'}
                            </button>

                            <button
                                onClick={handleShare}
                                className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold border bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                            >
                                <Share2 className="w-3.5 h-3.5" />
                                Share
                            </button>
                        </div>

                        {/* Comments */}
                        {showComments && (
                            <div className="pt-4 border-t border-border/30">
                                <CommentSection newsId={article.slug} />
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}
