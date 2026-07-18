'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Star, Calendar, User, ExternalLink,
    Heart, Plus, Loader2, Share2, TrendingUp,
    Users, Info, BookOpen, Layers, ArrowRight, Clock
} from 'lucide-react'
import { Manga } from '@/types/manga'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShareModal } from '@/components/common/ShareModal'
import { CharacterCard } from '@/components/characters/CharacterCard'
import { AuthGuard } from '@/components/shared/AuthGuard'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

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
    const [chapters, setChapters] = useState<any[]>(initialChapters)
    const [chaptersLoading, setChaptersLoading] = useState(initialChapters.length === 0)
    const [isMounted, setIsMounted] = useState(false)
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

    const sortedChapters = [...chapters].sort((a, b) => {
        const numA = parseFloat(a.chapterNumber || a.chapter) || 0
        const numB = parseFloat(b.chapterNumber || b.chapter) || 0
        return sortOrder === 'desc' ? numB - numA : numA - numB
    })

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
        <div className="min-h-screen pb-24 md:pb-12 bg-background">
            {/* Hero Section */}
            <div className="relative h-[400px] md:h-[550px] w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />
                <div className="absolute inset-0 bg-background/20 z-0" />
                {manga.images?.webp?.large_image_url && (
                    <Image
                        src={manga.images.webp.large_image_url}
                        alt={manga.title}
                        fill
                        className="object-cover object-center blur-md opacity-40 dark:opacity-30 scale-105"
                        priority
                    />
                )}
            </div>

            <div className="container -mt-48 md:-mt-80 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Poster & Actions (Sidebar) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-3 space-y-6"
                    >
                        <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border shadow-black/20 dark:shadow-black/50 group">
                            {manga.images?.webp?.large_image_url || manga.images?.jpg?.large_image_url ? (
                                <Image
                                    src={manga.images?.webp?.large_image_url || manga.images?.jpg?.large_image_url || ''}
                                    alt={manga.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground whitespace-nowrap">No Image</div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        </div>

                        {/* Desktop-only Quick Actions */}
                        <div className="p-5 space-y-3 hidden lg:block bg-card border border-border rounded-2xl shadow-xl">
                            {chapters.length > 0 && (
                                <Link 
                                    href={`/manga/read/${encodeURIComponent(chapters[chapters.length - 1].id)}?mangaId=${manga.mal_id}&type=${manga.type}`}
                                    className="block"
                                >
                                    <Button className="w-full h-12 gap-2 font-black text-sm bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02]">
                                        <BookOpen className="h-4 w-4" /> Start Reading
                                    </Button>
                                </Link>
                            )}

                            <AuthGuard
                                title="Favorite This Legend"
                                description="Unlock the ability to save your all-time favorite manga and showcase them on your premium profile."
                                fallback={
                                    <Button className="w-full gap-2 font-bold opacity-50 bg-secondary text-secondary-foreground" variant="secondary">
                                        <Heart className="h-4 w-4" /> Add to Favorites
                                    </Button>
                                }
                            >
                                <Button
                                    className="w-full gap-2 font-bold"
                                    variant={isFavorited ? 'default' : 'secondary'}
                                    onClick={handleToggleFavorite}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Heart className={cn("h-4 w-4", isFavorited && "fill-current text-red-500")} />
                                    )}
                                    {isFavorited ? 'Favorited' : 'Add to Favorites'}
                                </Button>
                            </AuthGuard>

                            {isInMangaList ? (
                                <div className="space-y-2 pt-2 border-t border-border">
                                    <select
                                        value={mangaListStatus}
                                        onChange={(e) => handleUpdateStatus(e.target.value)}
                                        disabled={actionLoading}
                                        className="w-full h-10 px-3 py-2 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {statusOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={handleRemoveFromList}
                                        disabled={actionLoading}
                                    >
                                        Remove from List
                                    </Button>
                                </div>
                            ) : (
                                <AuthGuard
                                    title="Track Your Reading"
                                    description="Sign in to add this manga to your personal read list and track your progress through the scrolls."
                                    fallback={
                                        <Button className="w-full gap-2 bg-primary/50 opacity-50 font-bold text-primary-foreground">
                                            <Plus className="h-4 w-4" /> Add to Read List
                                        </Button>
                                    }
                                >
                                    <Button
                                        className="w-full gap-2 bg-primary hover:bg-primary/90 font-bold text-primary-foreground"
                                        onClick={() => handleUpdateStatus('PLAN_TO_READ')}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                        Add to Read List
                                    </Button>
                                </AuthGuard>
                            )}

                            <ShareModal
                                title={manga.title}
                                description={manga.synopsis?.substring(0, 100)}
                                image={manga.images?.webp?.large_image_url || manga.images?.jpg?.large_image_url}
                                type="MANGA"
                                id={manga.mal_id}
                                path={`/manga/${manga.mal_id}`}
                                trigger={
                                    <Button className="w-full gap-2 font-bold" variant="outline">
                                        <Share2 className="h-4 w-4" /> Share
                                    </Button>
                                }
                            />
                        </div>

                        {/* Sidebar Info Card */}
                        <Card className="hidden lg:block border-border bg-card shadow-lg">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-primary">
                                    <Info className="h-4 w-4" />
                                    Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-4">
                                <div className="flex justify-between items-center border-b border-border pb-3">
                                    <span className="text-muted-foreground font-medium flex items-center gap-2"><BookOpen className="h-4 w-4" /> Type</span>
                                    <Badge variant="secondary" className="font-bold">{manga.type || 'Unknown'}</Badge>
                                </div>
                                <div className="flex justify-between items-center border-b border-border pb-3">
                                    <span className="text-muted-foreground font-medium flex items-center gap-2"><Layers className="h-4 w-4" /> Chapters</span>
                                    <span className="font-black">{manga.chapters || '?'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-border pb-3">
                                    <span className="text-muted-foreground font-medium flex items-center gap-2"><Calendar className="h-4 w-4" /> Status</span>
                                    <span className="font-bold">{manga.status}</span>
                                </div>
                                <div className="flex justify-between items-center pb-3">
                                    <span className="text-muted-foreground font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Rank</span>
                                    <span className="font-black text-primary">#{manga.rank || 'N/A'}</span>
                                </div>
                                {Array.isArray(manga.authors) && manga.authors.length > 0 && (
                                    <div className="space-y-2 pt-2 border-t border-border">
                                        <span className="text-muted-foreground font-medium block">Authors</span>
                                        <div className="flex flex-wrap gap-2">
                                            {manga.authors.map((author: any) => (
                                                <Badge key={author.mal_id || author.name} variant="outline" className="font-semibold bg-background">{author.name}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Content Area */}
                    <div className="lg:col-span-9 space-y-10 lg:pl-4">
                        {/* Title & Stats */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-center lg:text-left space-y-6"
                        >
                            <div className="space-y-2">
                                <h1 className="text-4xl md:text-6xl font-black text-foreground drop-shadow-2xl leading-tight tracking-tight">
                                    {manga.title}
                                </h1>
                                {manga.title_english && (
                                    <p className="text-xl md:text-2xl text-muted-foreground font-semibold">
                                        {manga.title_english}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-wrap justify-center lg:justify-start gap-4 items-center">
                                {manga.score && (
                                    <div className="flex items-center gap-3 bg-card border border-yellow-500/30 dark:border-yellow-500/20 shadow-lg rounded-2xl px-5 py-3 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <Star className="h-7 w-7 text-yellow-500 fill-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                                        <div>
                                            <div className="text-2xl font-black text-foreground leading-none mb-1">{manga.score}</div>
                                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Score</div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 bg-card border border-border shadow-lg rounded-2xl px-5 py-3">
                                    <TrendingUp className="h-6 w-6 text-blue-500" />
                                    <div>
                                        <div className="text-xl font-black text-foreground leading-none mb-1">#{manga.popularity}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Popularity</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-card border border-border shadow-lg rounded-2xl px-5 py-3">
                                    <Users className="h-6 w-6 text-purple-500" />
                                    <div>
                                        <div className="text-xl font-black text-foreground leading-none mb-1">{manga.members?.toLocaleString('en-US')}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Members</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-center lg:justify-start gap-2 pt-2">
                                {Array.isArray(manga.genres) && manga.genres.map((genre: any) => (
                                    <Badge key={genre.mal_id || genre.name} variant="secondary" className="px-4 py-1.5 text-xs font-bold rounded-full shadow-sm hover:shadow-md transition-shadow">
                                        {genre.name}
                                    </Badge>
                                ))}
                            </div>
                        </motion.div>

                        {/* --- CHAPTERS FIRST --- */}
                        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                            <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
                                <div>
                                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                            <Layers className="h-6 w-6" />
                                        </div>
                                        Chapters
                                    </h2>
                                    <p className="text-muted-foreground mt-1 font-medium">Read the latest releases directly.</p>
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
                                <div className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border border-border shadow-sm">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                                    <p className="text-muted-foreground font-semibold tracking-wide animate-pulse">Summoning chapters...</p>
                                </div>
                            ) : chapters.length > 0 ? (
                                <div className="bg-card rounded-3xl border border-border shadow-xl overflow-hidden ring-1 ring-border/50">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-[1px] bg-border max-h-[600px] overflow-y-auto p-[1px]">
                                        {sortedChapters.map((chapter) => (
                                            <Link 
                                                key={chapter.id} 
                                                href={`/manga/read/${encodeURIComponent(chapter.id)}?mangaId=${manga.mal_id}&type=${manga.type}`}
                                                className="flex flex-col p-5 bg-card hover:bg-accent hover:text-accent-foreground transition-all duration-200 group relative overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="relative z-10">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1 block">
                                                        {(chapter.chapterNumber || chapter.chapter) ? `Chapter ${chapter.chapterNumber || chapter.chapter}` : 'Oneshot'}
                                                    </span>
                                                    <h3 className="font-bold text-foreground text-sm line-clamp-2 mb-3">
                                                        {chapter.title || `Chapter ${chapter.chapterNumber || chapter.chapter}`}
                                                    </h3>
                                                    <div className="flex items-center justify-between mt-auto">
                                                        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {chapter.pages ? `${chapter.pages} Pages` : 'Read'}
                                                        </span>
                                                        <ArrowRight className="w-4 h-4 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-20 px-4 bg-card rounded-3xl border border-border shadow-sm">
                                    <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                                        <Layers className="h-10 w-10 text-muted-foreground opacity-50" />
                                    </div>
                                    <h3 className="text-xl font-black text-foreground mb-2">No Chapters Available</h3>
                                    <p className="text-muted-foreground font-medium max-w-sm mx-auto mb-6">The archives are currently empty for this title. Please check back later.</p>
                                    <Button onClick={() => window.location.reload()} variant="outline" className="rounded-xl font-bold">
                                        Refresh Data
                                    </Button>
                                </div>
                            )}
                        </section>

                        <div className="grid grid-cols-1 gap-12 pt-8 border-t border-border">
                            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                                <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
                                    <Info className="h-6 w-6 text-primary" />
                                    Synopsis
                                </h2>
                                <div
                                    className="text-base lg:text-lg leading-relaxed text-muted-foreground whitespace-pre-line bg-card p-8 rounded-3xl border border-border shadow-sm font-medium"
                                    dangerouslySetInnerHTML={{ __html: manga.synopsis || 'No synopsis available.' }}
                                />
                            </section>

                            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                                <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
                                    <User className="h-6 w-6 text-primary" />
                                    Characters
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 lg:gap-6">
                                    {Array.isArray(characters) && characters.slice(0, 8).map((char: any) => (
                                        <CharacterCard
                                            key={char.character?.mal_id || char.id}
                                            character={char.character}
                                            role={char.role}
                                        />
                                    ))}
                                </div>
                            </section>

                            {/* Relations Section */}
                            {manga.relations && manga.relations.length > 0 && (
                                <section className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
                                    <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
                                        <BookOpen className="h-6 w-6 text-primary" />
                                        Relations
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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

                            {/* Recommendations Section */}
                            {manga.recommendations && manga.recommendations.length > 0 && (
                                <section className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                                    <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
                                        <Star className="h-6 w-6 text-primary" />
                                        Recommended
                                    </h2>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 lg:gap-6">
                                        {manga.recommendations.slice(0, 10).map((rec: any) => (
                                            <Link key={rec.entry.mal_id} href={`/manga/${rec.entry.mal_id}`} className="group space-y-3">
                                                <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-border shadow-sm group-hover:shadow-xl transition-all duration-300">
                                                    <Image 
                                                        src={rec.entry.images?.webp?.image_url || rec.entry.images?.jpg?.image_url || ''} 
                                                        alt={rec.entry.title}
                                                        fill
                                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <ExternalLink className="w-6 h-6 text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-300" />
                                                    </div>
                                                </div>
                                                <h3 className="text-xs font-bold line-clamp-2 text-muted-foreground group-hover:text-primary transition-colors">{rec.entry.title}</h3>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Bottom Action Bar for Mobile */}
            <AnimatePresence>
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    exit={{ y: 100 }}
                    className="fixed bottom-[72px] left-4 right-4 z-[40] lg:hidden"
                >
                    <div className="bg-background/95 backdrop-blur-2xl border border-border rounded-2xl p-4 shadow-2xl flex flex-col gap-3 ring-1 ring-border/50">
                        {chapters.length > 0 && (
                            <Link href={`/manga/read/${encodeURIComponent(chapters[chapters.length - 1].id)}?mangaId=${manga.mal_id}&type=${manga.type}`} className="w-full">
                                <Button className="w-full h-14 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-transform">
                                    <BookOpen className="h-6 w-6 mr-2" /> Start Reading
                                </Button>
                            </Link>
                        )}
                        
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                {isInMangaList ? (
                                    <select
                                        value={mangaListStatus}
                                        onChange={(e) => handleUpdateStatus(e.target.value)}
                                        className="w-full h-12 px-4 rounded-xl border border-border bg-muted text-foreground font-bold focus:ring-2 focus:ring-primary"
                                    >
                                        {statusOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                        <option value="REMOVE" className="text-destructive font-bold">
                                            Remove from List
                                        </option>
                                    </select>
                                ) : (
                                    <AuthGuard
                                        title="Track Your Reading"
                                        description="Sign in to add this manga to your personal read list and track your progress through the scrolls."
                                        fallback={
                                            <Button className="w-full h-12 rounded-xl bg-primary/20 text-primary font-bold shadow-none" disabled>
                                                <Plus className="h-5 w-5 mr-2" /> Add to List
                                            </Button>
                                        }
                                    >
                                        <Button
                                            className="w-full h-12 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                            onClick={() => handleUpdateStatus('PLAN_TO_READ')}
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5 mr-2" />}
                                            Add to List
                                        </Button>
                                    </AuthGuard>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <AuthGuard
                                    title="Favorite This Legend"
                                    description="Unlock the ability to save your all-time favorite manga and showcase them on your premium profile."
                                    fallback={
                                        <Button size="icon" variant="outline" className="h-12 w-12 rounded-xl border-border bg-card shadow-sm" disabled>
                                            <Heart className="h-6 w-6" />
                                        </Button>
                                    }
                                >
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className={cn(
                                            "h-12 w-12 rounded-xl border-border bg-card shadow-sm transition-colors",
                                            isFavorited && "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20"
                                        )}
                                        onClick={handleToggleFavorite}
                                        disabled={actionLoading}
                                    >
                                        <Heart className={cn("h-6 w-6", isFavorited && "fill-current")} />
                                    </Button>
                                </AuthGuard>

                                <ShareModal
                                    title={manga.title}
                                    description={manga.synopsis?.substring(0, 100)}
                                    image={manga.images?.webp?.image_url || manga.images?.jpg?.image_url}
                                    type="MANGA"
                                    id={manga.mal_id}
                                    path={`/manga/${manga.mal_id}`}
                                    trigger={
                                        <Button size="icon" variant="outline" className="h-12 w-12 rounded-xl border-border bg-card shadow-sm hover:bg-accent">
                                            <Share2 className="h-5 w-5" />
                                        </Button>
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
