'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Heart, MessageCircle, ExternalLink, Flame, Users, Link2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import api from '@/lib/api'
import { toast } from 'sonner'
import Image from 'next/image'
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

// ... (interface stays same)
interface NewsItem {
    id: string
    url: string
    title: string
    created_utc: number
    author: string
    thumbnail?: string
    image_url?: string // High res image or null
    score: number
}

export function NewsFeed() {
    const [news, setNews] = useState<NewsItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [targetPostId, setTargetPostId] = useState<string | null>(null)

    useEffect(() => {
        // Get postId from URL on client side
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            setTargetPostId(params.get('postId'))
        }
    }, [])

    useEffect(() => {
        const fetchNews = async () => {
            try {
                // Use standard API route to bypass Cloudflare 405 issues with Server Actions
                const response = await fetch('/api/news')
                if (!response.ok) throw new Error('Failed to fetch news')
                
                const validPosts = await response.json()
                console.log('[NewsFeed] Posts from API:', validPosts)
                setNews(validPosts)
            } catch (error) {
                console.error("Failed to fetch news", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchNews()
    }, [])

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8">
            {isLoading ? (
                <div className="text-center text-white/20 animate-pulse">Scanning frequencies...</div>
            ) : (
                <>
                    {news.length === 0 && (
                        <div className="text-center text-white/20 p-8 border border-white/5 rounded-2xl">
                            No signals detected from the secure channel...
                        </div>
                    )}
                    {news.map((item, index) => (
                        <NewsCard key={item.id} item={item} index={index} targetPostId={targetPostId} />
                    ))}
                </>
            )}
        </div>
    )
}

function NewsCard({ item, index, targetPostId }: { item: NewsItem, index: number, targetPostId?: string | null }) {
    const { user } = useAuth()
    const [stats, setStats] = useState({ likes: 0, comments: 0, views: 0, isLiked: false })
    const [showComments, setShowComments] = useState(false)
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)

    // Deep-linking: Auto-expand if this is the target post
    useEffect(() => {
        if (targetPostId === item.id) {
            setShowComments(true)
        }
    }, [targetPostId, item.id])

    useEffect(() => {
        const fetchEngagement = async () => {
            try {
                // Only try to fetch user-specific data if we have a user
                const url = `/news-engagement/${item.id}${user ? `?userId=${user.id}` : ''}`
                const res = await api.get(url)
                const data = res.data.data
                setStats({
                    likes: data._count?.reactions || 0,
                    comments: data._count?.comments || 0,
                    views: data.views || 0,
                    isLiked: data.isLiked || false
                })
            } catch (error: any) {
                // Silence 401s for guests
                if (error.response?.status !== 401) {
                    console.error("Failed to fetch engagement stats", error)
                }
            }
        }
        fetchEngagement()
    }, [item.id, user])

    const handleLike = async () => {
        const wasLiked = stats.isLiked
        setStats(prev => ({
            ...prev,
            likes: wasLiked ? prev.likes - 1 : prev.likes + 1,
            isLiked: !wasLiked
        }))

        try {
            await api.post('/reactions', { type: 'LIKE', providerId: item.id })
        } catch (error: any) {
            setStats(prev => ({ ...prev, likes: wasLiked ? prev.likes + 1 : prev.likes - 1, isLiked: wasLiked }))
            let msg = error.response?.data?.message || 'Failed to react'
            if (typeof msg === 'object') {
                msg = Array.isArray(msg) ? msg.join(', ') : JSON.stringify(msg)
            }
            toast.error(msg)
        }
    }

    const handlePublicShare = async () => {
        if (navigator.share) {
            try { await navigator.share({ title: item.title, url: item.url }) } catch (e) { }
        } else {
            navigator.clipboard.writeText(item.url)
            toast.success('Frequency copied to clipboard!')
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="group relative bg-card dark:bg-[#0a0a0a]/80 border border-border/50 dark:border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 hover:-translate-y-1 backdrop-blur-xl"
        >
            {/* Top Shine Effect */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

            {/* Header: Author Info */}
            <div className="p-4 md:p-6 flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="relative">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/20">
                            <div className="w-full h-full rounded-[0.7rem] md:rounded-[0.9rem] bg-background flex items-center justify-center text-foreground font-black text-xs md:text-sm">
                                {item.author.slice(0, 2).toUpperCase()}
                            </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 rounded-full bg-green-500 border-2 border-background" />
                    </div>
                    <div>
                        <p className="text-foreground text-xs md:text-sm font-black tracking-tight group-hover:text-indigo-500 transition-colors">u/{item.author}</p>
                        <p className="text-muted-foreground text-[8px] md:text-[10px] font-bold uppercase tracking-widest">
                            {formatDistanceToNow(new Date(item.created_utc * 1000), { addSuffix: true })}
                        </p>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-secondary/50 border border-border hover:bg-secondary hover:scale-110 transition-all focus:outline-none">
                            <Share2 className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-card border-border rounded-2xl shadow-2xl min-w-[200px] p-2 z-50">
                        <DropdownMenuItem
                            onClick={() => setIsShareModalOpen(true)}
                            className="rounded-xl p-3 flex items-center gap-3 focus:bg-indigo-500/10 focus:text-indigo-500 cursor-pointer transition-colors"
                        >
                            <Users className="w-4 h-4" />
                            <span className="text-xs md:text-sm font-black uppercase tracking-tight">Share to Friends</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={handlePublicShare}
                            className="rounded-xl p-3 flex items-center gap-3 focus:bg-indigo-500/10 focus:text-indigo-500 cursor-pointer transition-colors"
                        >
                            <Link2 className="w-4 h-4" />
                            <span className="text-xs md:text-sm font-black uppercase tracking-tight">Public Share</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <ShareNewsModal
                open={isShareModalOpen}
                onOpenChange={setIsShareModalOpen}
                newsItem={{
                    id: item.id,
                    title: item.title,
                    url: item.url,
                    image_url: item.image_url
                }}
            />

            {/* Body: Title & Image */}
            <div className="space-y-4 md:space-y-6">
                <div className="px-4 md:px-6">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="block group/link">
                        <h3 className="text-lg md:text-2xl font-black text-foreground leading-[1.2] md:leading-[1.1] tracking-tighter group-hover/link:text-indigo-500 transition-colors">
                            {item.title}
                        </h3>
                    </a>
                </div>

                {item.image_url ? (
                    <div className="px-2 md:px-3">
                        <div className="w-full aspect-[16/10] relative rounded-[1.2rem] md:rounded-[2rem] overflow-hidden bg-muted group/img">
                            <img
                                src={item.image_url}
                                alt={item.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105"
                                onError={(e) => e.currentTarget.style.display = 'none'}
                            />
                            {/* Overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
                        </div>
                    </div>
                ) : (
                    <div className="px-4 md:px-6 pb-2">
                        <div className="bg-secondary/30 dark:bg-white/5 rounded-[1.2rem] md:rounded-[1.5rem] p-3 md:p-4 text-[9px] md:text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-3 border border-border/50">
                            <div className="px-2 py-0.5 md:py-1 bg-foreground/5 rounded-lg text-foreground shrink-0">TEXT_INTEL</div>
                            <span className="truncate">Encrypted discussion feed from Reddit servers</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer: Actions */}
            <div className="p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3">
                    <button
                        onClick={handleLike}
                        className={cn(
                            "flex-1 h-12 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 md:gap-3 transition-all font-black text-[10px] md:text-sm uppercase tracking-widest border",
                            stats.isLiked
                                ? "bg-rose-500/10 border-rose-500/20 text-rose-500 shadow-lg shadow-rose-500/5 scale-[0.98]"
                                : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                    >
                        <Heart className={cn("w-4 h-4 md:w-5 md:h-5", stats.isLiked && "fill-current")} />
                        <span>{item.score + stats.likes}</span>
                    </button>

                    <button
                        onClick={() => setShowComments(!showComments)}
                        className={cn(
                            "flex-1 h-12 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 md:gap-3 transition-all font-black text-[10px] md:text-sm uppercase tracking-widest border",
                            showComments
                                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-500 shadow-lg shadow-indigo-500/5"
                                : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                    >
                        <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                        <span>{stats.comments}</span>
                    </button>
                </div>

                {/* Comment Section (Collapsible) */}
                <AnimatePresence>
                    {showComments && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                            className="overflow-hidden"
                        >
                            <div className="pt-8 mt-6 border-t border-border/50">
                                <CommentSection newsId={item.id} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}
