'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Star, Calendar, User, ExternalLink,
    Heart, Plus, Loader2, Share2, TrendingUp,
    Users, Info, BookOpen, Layers, ArrowRight, Clock, Play
} from 'lucide-react'
import { Manga } from '@/types/manga'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import dynamic from 'next/dynamic'
import { ShareModal } from '@/components/common/ShareModal'
import { AuthGuard } from '@/components/shared/AuthGuard'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

const CharacterCard = dynamic(() => import('@/components/characters/CharacterCard').then(mod => mod.CharacterCard), { ssr: false })

interface MangaDetailsClientProps {
    manga: Manga
    characters: any[]
    initialChapters?: any[]
}

const EMPTY_ARRAY: any[] = []

export default function MangaDetailsClient({ manga, characters, initialChapters = EMPTY_ARRAY }: MangaDetailsClientProps) {
    const { isAuthenticated, user, updateUser } = useAuth()
    const [isInMangaList, setIsInMangaList] = useState(false)
    const [mangaListStatus, setMangaListStatus] = useState('PLAN_TO_READ')
    const [isFavorited, setIsFavorited] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false)
    const primaryColor = manga.color || '#f97316'
    const [chapters, setChapters] = useState<any[]>(initialChapters)
    const [chaptersLoading, setChaptersLoading] = useState(initialChapters.length === 0)
    const [isMounted, setIsMounted] = useState(false)
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

    const sortedChapters = sortOrder === 'desc' 
        ? chapters 
        : [...chapters].reverse()

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        const fetchChapters = async () => {
            if (initialChapters && initialChapters.length > 0) {
                setChapters(initialChapters)
                setChaptersLoading(false)
                return
            }

            try {
                setChaptersLoading(true)
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 25000)

                const res = await fetch(`/api/manga/${manga.mal_id}/chapters`, {
                    signal: controller.signal
                })
                clearTimeout(timeoutId)

                if (res.ok) {
                    const json = await res.json()
                    const chaptersData = json.data?.chapters || json.chapters || []
                    setChapters(Array.isArray(chaptersData) ? chaptersData : [])
                } else {
                    console.error('Backend returned error:', res.status)
                    setChapters([])
                }
            } catch (error: any) {
                console.error('Failed to fetch chapters:', error)
                setChapters([])
            } finally {
                setChaptersLoading(false)
            }
        }

        fetchChapters()
    }, [manga.mal_id, initialChapters])

    const checkStatus = useCallback(async () => {
        try {
            const [listRes, favRes] = await Promise.all([
                api.get('/users/mangalist'),
                api.get('/users/favorites/manga')
            ])

            const listData = listRes.data?.data
            const favData = favRes.data?.data

            if (Array.isArray(listData)) {
                const listEntry = listData.find((item: any) => item.mangaId === manga.mal_id)
                if (listEntry) {
                    setIsInMangaList(true)
                    setMangaListStatus(listEntry.status)
                }
            }

            if (Array.isArray(favData)) {
                const isFav = favData.some((item: any) => item.mangaId === manga.mal_id)
                setIsFavorited(isFav)
            }
        } catch (error) {
            console.error('Failed to check manga status:', error)
        }
    }, [manga.mal_id])

    useEffect(() => {
        if (isAuthenticated) {
            checkStatus()
        }
    }, [isAuthenticated, checkStatus])

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 300)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleToggleFavorite = async () => {
        try {
            setActionLoading(true)
            if (isFavorited) {
                await api.delete(`/users/favorites/manga/${manga.mal_id}`)
            } else {
                const response = await api.post(`/users/favorites/manga/${manga.mal_id}`, {
                    title: manga.title,
                    image: manga.images?.webp?.large_image_url || manga.images?.jpg?.large_image_url
                })
                if (response.data.data?.userUpdates && user) {
                    updateUser({ ...user, ...response.data.data.userUpdates })
                }
            }
            setIsFavorited(!isFavorited)
        } catch (error) {
            console.error('Failed to toggle favorite:', error)
        } finally {
            setActionLoading(false)
        }
    }

    const handleUpdateStatus = async (status: string) => {
        if (status === 'REMOVE') {
            await handleRemoveFromList()
            return
        }
        try {
            setActionLoading(true)
            if (!isInMangaList) {
                const response = await api.post('/users/mangalist', {
                    mangaId: manga.mal_id,
                    title: manga.title,
                    image: manga.images?.webp?.large_image_url || manga.images?.jpg?.large_image_url,
                    status
                })
                if (response.data.data?.userUpdates && user) {
                    updateUser({ ...user, ...response.data.data.userUpdates })
                }
                setIsInMangaList(true)
            } else {
                await api.patch(`/users/mangalist/${manga.mal_id}`, { status })
            }
            setMangaListStatus(status)
        } catch (error) {
            console.error('Failed to update manga status:', error)
        } finally {
            setActionLoading(false)
        }
    }

    const handleRemoveFromList = async () => {
        try {
            setActionLoading(true)
            await api.delete(`/users/mangalist/${manga.mal_id}`)
            setIsInMangaList(false)
            setMangaListStatus('PLAN_TO_READ')
        } catch (error) {
            console.error('Failed to remove from manga list:', error)
        } finally {
            setActionLoading(false)
        }
    }

    const statusOptions = [
        { value: 'READING', label: 'Reading' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'ON_HOLD', label: 'On Hold' },
        { value: 'DROPPED', label: 'Dropped' },
        { value: 'PLAN_TO_READ', label: 'Plan to Read' },
    ]

    if (!isMounted) return null

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 pb-20">
            {/* Unified Hero Section */}
            <div className="relative w-full min-h-[400px] md:min-h-[600px] pb-6 md:pb-12 mb-6 md:mb-12">
                {/* Background Banner */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent z-10" />
                    <div className="absolute inset-0 bg-black/40 z-[5]" />
                    <div className="absolute inset-0 z-[6] opacity-20 dark:opacity-30 mix-blend-overlay" style={{ background: `linear-gradient(to right, transparent, ${primaryColor})` }} />
                    {manga.images?.webp?.large_image_url && (
                        <motion.div
                            initial={{ scale: 1.05, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.8 }}
                            className="w-full h-full"
                        >
                            <Image
                                src={manga.images.webp.large_image_url}
                                alt={manga.title}
                                fill
                                className="object-cover object-top blur-[40px] opacity-50 scale-110"
                                priority
                            />
                        </motion.div>
                    )}
                </div>

                {/* Hero Content */}
                <div className="container relative z-20 pt-16 md:pt-32 px-4 md:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
                        {/* Left: Poster */}
                        <div className="lg:col-span-3 lg:col-start-1 flex flex-col gap-6 items-center lg:items-start shrink-0">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative w-[160px] sm:w-[220px] lg:w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 bg-secondary group"
                            >
                                {manga.images?.webp?.large_image_url || manga.images?.jpg?.large_image_url ? (
                                    <Image
                                        src={manga.images?.webp?.large_image_url || manga.images?.jpg?.large_image_url || ''}
                                        alt={manga.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        priority
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                                )}
                            </motion.div>
                        </div>

                        {/* Right: Info */}
                        <div className="lg:col-span-9 flex flex-col gap-4 lg:gap-6 lg:pt-8 text-center lg:text-left">
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex flex-col gap-4">
                                <div>
                                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white drop-shadow-2xl mb-2 leading-tight">
                                        {manga.title}
                                    </h1>
                                    {manga.title_english && manga.title_english !== manga.title && (
                                        <p className="text-lg md:text-xl text-white/60 font-medium drop-shadow-lg">
                                            {manga.title_english}
                                        </p>
                                    )}
                                </div>

                                {/* Quick Meta Row */}
                                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                                    {manga.score && (
                                        <div className="flex items-center gap-1.5 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-3 py-1 rounded-full font-bold text-sm backdrop-blur-md">
                                            <Star className="h-4 w-4 fill-current" />
                                            {manga.score}
                                        </div>
                                    )}
                                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 md:gap-3 text-sm font-bold text-white/80">
                                        {manga.type && <span>{manga.type}</span>}
                                        {manga.chapters && (
                                            <>
                                                <span className="w-1.5 h-1.5 rounded-full bg-white/30 hidden md:block" />
                                                <span>{manga.chapters} Chapters</span>
                                            </>
                                        )}
                                        {manga.status && (
                                            <>
                                                <span className="w-1.5 h-1.5 rounded-full bg-white/30 hidden md:block" />
                                                <span className={manga.status === 'Publishing' ? 'text-green-400' : ''}>
                                                    {manga.status}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Action Bar */}
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-2"
                            >
                                {chapters.length > 0 ? (
                                    <Link href={`/manga/read/${encodeURIComponent(chapters[chapters.length - 1].id)}?mangaId=${manga.mal_id}&type=${manga.type}`} className="block">
                                        <Button 
                                            size="lg"
                                            style={{ backgroundColor: primaryColor, boxShadow: `0 0 30px -5px ${primaryColor}80` }}
                                            className="h-12 px-8 rounded-xl text-white font-black text-base group transition-all border-none hover:opacity-90"
                                        >
                                            <BookOpen className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                                            READ NOW
                                        </Button>
                                    </Link>
                                ) : (
                                    <Button size="lg" disabled className="h-12 px-8 rounded-xl font-black text-base opacity-50 cursor-not-allowed">
                                        <BookOpen className="h-5 w-5 mr-2" /> NO CHAPTERS
                                    </Button>
                                )}

                                {isInMangaList ? (
                                    <div className="relative group/watchlist min-w-[160px]">
                                        <select
                                            value={mangaListStatus}
                                            onChange={(e) => handleUpdateStatus(e.target.value)}
                                            disabled={actionLoading}
                                            className="w-full h-12 px-4 rounded-xl border border-white/20 bg-black/40 backdrop-blur-xl text-sm font-bold text-white focus:ring-2 focus:ring-primary appearance-none cursor-pointer transition-colors hover:bg-black/60"
                                        >
                                            {statusOptions.map(option => (
                                                <option key={option.value} value={option.value} className="bg-background text-foreground">
                                                    {option.label}
                                                </option>
                                            ))}
                                            <option value="REMOVE" className="bg-destructive/10 text-destructive font-bold">Remove</option>
                                        </select>
                                    </div>
                                ) : (
                                    <AuthGuard
                                        title="Readlist"
                                        description="Add this manga to your readlist."
                                        fallback={
                                            <Button variant="secondary" className="h-12 px-6 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md opacity-50 cursor-not-allowed">
                                                <Plus className="h-5 w-5 mr-2" /> Add to List
                                            </Button>
                                        }
                                    >
                                        <Button
                                            variant="secondary"
                                            className="h-12 px-6 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-all"
                                            onClick={() => handleUpdateStatus('PLAN_TO_READ')}
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Plus className="h-5 w-5 mr-2" />}
                                            Add to List
                                        </Button>
                                    </AuthGuard>
                                )}

                                <AuthGuard
                                    title="Favorite"
                                    description="Add this manga to your favorites list."
                                    fallback={
                                        <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl bg-white/5 border-white/10 text-white backdrop-blur-md opacity-50 cursor-not-allowed">
                                            <Heart className="h-5 w-5" />
                                        </Button>
                                    }
                                >
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className={cn(
                                            "h-12 w-12 rounded-xl border-white/10 backdrop-blur-md transition-all",
                                            isFavorited 
                                                ? "bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)]" 
                                                : "bg-white/5 hover:bg-white/20 text-white"
                                        )}
                                        onClick={handleToggleFavorite}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <Heart className={cn("h-5 w-5", isFavorited && "fill-current")} />
                                        )}
                                    </Button>
                                </AuthGuard>

                                <ShareModal
                                    title={manga.title}
                                    description={manga.synopsis}
                                    image={manga.images?.webp?.large_image_url}
                                    type="MANGA"
                                    id={manga.mal_id}
                                    path={`/manga/${manga.mal_id}`}
                                    trigger={
                                        <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl bg-white/5 hover:bg-white/20 text-white border-white/10 backdrop-blur-md transition-all">
                                            <Share2 className="h-5 w-5" />
                                        </Button>
                                    }
                                />
                            </motion.div>

                            {/* Genres */}
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-wrap items-center justify-center lg:justify-start gap-2"
                            >
                                {manga.genres?.map((genre: any) => (
                                    <Badge
                                        key={genre.mal_id || genre.name}
                                        className="h-8 px-4 bg-white/10 hover:bg-white/20 border-white/10 text-white transition-colors font-medium rounded-full backdrop-blur-md"
                                    >
                                        {genre.name}
                                    </Badge>
                                ))}
                            </motion.div>

                            {/* Synopsis in Hero */}
                            {manga.synopsis && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="mt-4 hidden md:block"
                                >
                                    <h3 className="text-sm font-black uppercase tracking-widest text-white/50 mb-3 flex items-center gap-2 justify-center lg:justify-start">
                                        <Info className="h-4 w-4" /> Synopsis
                                    </h3>
                                    <div
                                        className={cn("text-base leading-relaxed text-white/80 transition-all duration-500 cursor-pointer text-left", !isSynopsisExpanded && "line-clamp-4 hover:line-clamp-none")}
                                        onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
                                        dangerouslySetInnerHTML={{ __html: manga.synopsis }}
                                    />
                                    <button onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)} style={{ color: primaryColor }} className="text-sm font-bold mt-2 hover:underline">
                                        {isSynopsisExpanded ? 'Show Less' : 'Read More'}
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="container px-4 md:px-8 relative z-30">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Left Sidebar */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Details Sidebar */}
                        <div className="bg-secondary/20 backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-6 shadow-xl">
                            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary" /> Details
                            </h3>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary"><BookOpen className="h-4 w-4" /></div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Type</p>
                                        <p className="text-sm font-bold">{manga.type || 'Unknown'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary"><Layers className="h-4 w-4" /></div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Chapters</p>
                                        <p className="text-sm font-bold">{manga.chapters || 'Unknown'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary"><Calendar className="h-4 w-4" /></div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</p>
                                        <p className="text-sm font-bold">{manga.status || 'Unknown'}</p>
                                    </div>
                                </div>
                                
                                {Array.isArray(manga.authors) && manga.authors.length > 0 && (
                                    <div className="space-y-2 mt-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Authors</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {manga.authors.map((author: any) => (
                                                <Badge key={author.mal_id || author.name} variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] px-2 py-0.5">
                                                    {author.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats Sidebar */}
                        <div className="bg-secondary/20 backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-4 shadow-xl">
                            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
                                <TrendingUp className="h-4 w-4 text-primary" /> Statistics
                            </h3>
                            <div className="flex flex-col gap-3">
                                {manga.score && (
                                    <div className="flex items-center gap-4 border border-yellow-500/20 bg-yellow-500/10 text-yellow-500 rounded-2xl px-6 py-3">
                                        <Star className="h-5 w-5 fill-current" />
                                        <div>
                                            <div className="text-2xl font-black">{manga.score}</div>
                                            <div className="text-[10px] uppercase font-bold tracking-widest opacity-70">Global Score</div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-4 border border-blue-500/20 bg-blue-500/10 text-blue-500 rounded-2xl px-6 py-3">
                                    <TrendingUp className="h-5 w-5" />
                                    <div>
                                        <div className="text-2xl font-black">#{manga.rank || 'N/A'}</div>
                                        <div className="text-[10px] uppercase font-bold tracking-widest opacity-70">Ranked</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 border border-purple-500/20 bg-purple-500/10 text-purple-500 rounded-2xl px-6 py-3">
                                    <Users className="h-5 w-5" />
                                    <div>
                                        <div className="text-2xl font-black">{manga.members?.toLocaleString() || 'N/A'}</div>
                                        <div className="text-[10px] uppercase font-bold tracking-widest opacity-70">Members</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Content Area */}
                    <div className="lg:col-span-9 space-y-12">
                        {/* Mobile Synopsis */}
                        {manga.synopsis && (
                            <section className="md:hidden bg-secondary/10 rounded-3xl p-6 border border-white/5 mt-6">
                                <h2 className="text-xl font-black mb-4 flex items-center gap-3">
                                    <span className="w-1.5 h-6 bg-primary rounded-full" />
                                    Synopsis
                                </h2>
                                <div
                                    className="text-base leading-relaxed text-muted-foreground prose prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: manga.synopsis }}
                                />
                            </section>
                        )}

                        {/* Chapters Grid */}
                        <section id="streaming-section" className="bg-background relative rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
                            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-black flex items-center gap-3">
                                        <span className="w-1.5 h-8 bg-primary rounded-full" />
                                        Chapters
                                    </h2>
                                    <p className="text-muted-foreground mt-1 text-sm font-medium ml-4">Read the latest releases directly.</p>
                                </div>
                                {chapters.length > 0 && (
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                                        className="gap-2 font-bold uppercase text-xs tracking-wider rounded-xl bg-card hover:bg-accent"
                                    >
                                        {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                                        <TrendingUp className={cn("h-4 w-4", sortOrder === 'asc' && "rotate-180")} />
                                    </Button>
                                )}
                            </div>
                            
                            {chaptersLoading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                                    <p className="text-muted-foreground font-semibold tracking-wide animate-pulse">Summoning chapters...</p>
                                </div>
                            ) : chapters.length > 0 ? (
                                <div className="p-2 md:p-6 lg:p-8">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                        {sortedChapters.map((chapter) => (
                                            <Link 
                                                key={chapter.id} 
                                                href={`/manga/read/${encodeURIComponent(chapter.id)}?mangaId=${manga.mal_id}&type=${manga.type}`}
                                                className="flex flex-col p-4 bg-card rounded-2xl border border-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group relative overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="relative z-10 flex flex-col items-center text-center">
                                                    <span className="text-xs font-black uppercase tracking-widest text-primary mb-1">
                                                        {(chapter.chapterNumber || chapter.chapter) ? `Ch. ${chapter.chapterNumber || chapter.chapter}` : 'Oneshot'}
                                                    </span>
                                                    <h3 className="font-bold text-foreground text-sm line-clamp-1 mb-1" title={chapter.title}>
                                                        {chapter.title || `Chapter ${chapter.chapterNumber || chapter.chapter}`}
                                                    </h3>
                                                    <span className="text-[10px] text-muted-foreground font-medium">
                                                        {chapter.pages ? `${chapter.pages} Pages` : 'Read'}
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-20 px-4">
                                    <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                                        <Layers className="h-10 w-10 text-muted-foreground opacity-50" />
                                    </div>
                                    <h3 className="text-xl font-black text-foreground mb-2">No Chapters Available</h3>
                                    <p className="text-muted-foreground font-medium max-w-sm mx-auto mb-6">The archives are currently empty for this title. Please check back later.</p>
                                </div>
                            )}
                        </section>

                        {/* Characters */}
                        {characters && characters.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                                    <span className="w-1.5 h-8 bg-primary rounded-full" />
                                    Characters
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {characters.slice(0, 12).map((char: any) => (
                                        <CharacterCard
                                            key={char.character?.mal_id || char.id}
                                            character={char.character}
                                            role={char.role}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Relations */}
                        {manga.relations && manga.relations.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                                    <span className="w-1.5 h-8 bg-primary rounded-full" />
                                    Relations
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {manga.relations.map((rel: any, i: number) => (
                                        <div key={i} className="flex flex-col p-5 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                                            <span className="text-[10px] uppercase font-black tracking-widest text-primary mb-3">{rel.relation}</span>
                                            <div className="flex flex-col gap-2">
                                                {rel.entry.map((entry: any) => (
                                                    <Link 
                                                        key={entry.mal_id} 
                                                        href={`/${entry.type}/${entry.mal_id}`}
                                                        className="text-sm font-bold text-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                                                    >
                                                        <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                                                        <span className="line-clamp-1">{entry.name}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Recommendations */}
                        {manga.recommendations && manga.recommendations.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                                    <span className="w-1.5 h-8 bg-primary rounded-full" />
                                    Recommended for You
                                </h2>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                                    {manga.recommendations.slice(0, 14).map((rec: any) => (
                                        <motion.div
                                            key={rec.entry.mal_id}
                                            whileHover={{ y: -8 }}
                                            className="group cursor-pointer"
                                        >
                                            <Link href={`/manga/${rec.entry.mal_id}`} className="block">
                                                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-3 shadow-lg border border-white/5">
                                                    <Image 
                                                        src={rec.entry.images?.webp?.image_url || rec.entry.images?.jpg?.image_url || ''} 
                                                        alt={rec.entry.title}
                                                        fill
                                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                                        <div className="text-[10px] font-bold text-primary uppercase mb-1">View Details</div>
                                                    </div>
                                                </div>
                                                <h4 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                                    {rec.entry.title}
                                                </h4>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
