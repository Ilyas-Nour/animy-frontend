'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Star, Calendar, Book, User, ExternalLink,
    Heart, Plus, Loader2, Share2, TrendingUp,
    Users, Info, BookOpen, Layers
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
}

export default function MangaDetailsClient({ manga, characters }: MangaDetailsClientProps) {
    const { isAuthenticated, user, updateUser } = useAuth()
    const [isInMangaList, setIsInMangaList] = useState(false)
    const [mangaListStatus, setMangaListStatus] = useState('PLAN_TO_READ')
    const [isFavorited, setIsFavorited] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [chapters, setChapters] = useState<any[]>([])
    const [chaptersLoading, setChaptersLoading] = useState(true)

    useEffect(() => {
        if (isAuthenticated) {
            checkStatus()
        }
    }, [isAuthenticated, manga.mal_id])

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 300)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        const fetchChapters = async () => {
            try {
                const res = await api.get(`/manga/${manga.mal_id}/read-chapters`)
                if (res.data?.chapters) {
                    setChapters(res.data.chapters)
                }
            } catch (error) {
                console.error('Failed to fetch chapters:', error)
            } finally {
                setChaptersLoading(false)
            }
        }
        
        fetchChapters()
    }, [manga.mal_id])

    const checkStatus = async () => {
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
    }

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

                // Update local user state with new XP if available
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

                // Update local user state with new XP if available
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

    return (
        <div className="min-h-screen pb-24 md:pb-12">
            {/* Hero Section */}
            <div className="relative h-[300px] md:h-[500px] w-full">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />
                {manga.images?.webp?.large_image_url && (
                    <Image
                        src={manga.images.webp.large_image_url}
                        alt={manga.title}
                        fill
                        className="object-cover object-center blur-sm opacity-50"
                        priority
                    />
                )}
            </div>

            <div className="container -mt-32 md:-mt-64 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Poster & Desktop Actions */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6"
                    >
                        <Card className="overflow-hidden border-white/10 shadow-2xl">
                            <div className="relative aspect-[2/3]">
                                {manga.images?.webp?.large_image_url || manga.images?.jpg?.large_image_url ? (
                                    <Image
                                        src={manga.images?.webp?.large_image_url || manga.images?.jpg?.large_image_url || ''}
                                        alt={manga.title}
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                ) : (
                                    <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground whitespace-nowrap">No Image</div>
                                )}
                            </div>

                            {/* Desktop-only Quick Actions */}
                            <CardContent className="p-4 space-y-3 hidden md:block">
                                <AuthGuard
                                    title="Favorite This Legend"
                                    description="Unlock the ability to save your all-time favorite manga and showcase them on your premium profile."
                                    fallback={
                                        <Button
                                            className="w-full gap-2 font-bold opacity-50"
                                            variant="outline"
                                        >
                                            <Heart className="h-4 w-4" /> Add to Favorites
                                        </Button>
                                    }
                                >
                                    <Button
                                        className="w-full gap-2 font-bold"
                                        variant={isFavorited ? 'default' : 'outline'}
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
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <select
                                                value={mangaListStatus}
                                                onChange={(e) => handleUpdateStatus(e.target.value)}
                                                disabled={actionLoading}
                                                className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm font-medium ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {statusOptions.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
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
                                            <Button
                                                className="w-full gap-2 bg-primary/50 opacity-50 font-bold"
                                            >
                                                <Plus className="h-4 w-4" /> Add to Read List
                                            </Button>
                                        }
                                    >
                                        <Button
                                            className="w-full gap-2 bg-primary hover:bg-primary/90 font-bold"
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
                                        <Button
                                            className="w-full gap-2 font-bold"
                                            variant="secondary"
                                        >
                                            <Share2 className="h-4 w-4" /> Share to Friends
                                        </Button>
                                    }
                                />
                            </CardContent>
                        </Card>

                        {/* Sidebar Info Card (Desktop Only) */}
                        <Card className="hidden md:block border-white/5 bg-background/50 backdrop-blur-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Info className="h-4 w-4 text-primary" />
                                    Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs space-y-3">
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-muted-foreground flex items-center gap-1"><BookOpen className="h-3 w-3" /> Type</span>
                                    <span className="font-medium">{manga.type || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-muted-foreground flex items-center gap-1"><Layers className="h-3 w-3" /> Chapters</span>
                                    <span className="font-medium">{manga.chapters || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Status</span>
                                    <span className="font-medium">{manga.status}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Rank</span>
                                    <span className="font-medium">#{manga.rank || 'N/A'}</span>
                                </div>
                                {Array.isArray(manga.authors) && manga.authors.length > 0 && (
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground block">Authors</span>
                                        <div className="flex flex-wrap gap-1">
                                            {manga.authors.map((author: any) => (
                                                <Badge key={author.mal_id || author.name} variant="secondary" className="text-[10px] py-0">{author.name}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Content Area */}
                    <div className="md:col-span-2 space-y-8">
                        {/* Title & Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center md:text-left space-y-4"
                        >
                            <div>
                                <h1 className="text-3xl md:text-5xl font-extrabold text-foreground drop-shadow-xl mb-2">
                                    {manga.title}
                                </h1>
                                {manga.title_english && (
                                    <p className="text-lg md:text-xl text-muted-foreground font-medium">
                                        {manga.title_english}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center">
                                {manga.score && (
                                    <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-2">
                                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                                        <div>
                                            <div className="text-xl font-bold text-yellow-500">{manga.score}</div>
                                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2">
                                    <TrendingUp className="h-5 w-5 text-blue-500" />
                                    <div>
                                        <div className="text-xl font-bold text-blue-500">#{manga.popularity}</div>
                                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Popularity</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-2">
                                    <Users className="h-5 w-5 text-purple-500" />
                                    <div>
                                        <div className="text-xl font-bold text-purple-500">{manga.members?.toLocaleString('en-US')}</div>
                                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Members</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                {Array.isArray(manga.genres) && manga.genres.map((genre: any) => (
                                    <Badge key={genre.mal_id || genre.name} variant="secondary" className="px-3 py-1 bg-white/5 border-white/10 hover:bg-white/10">
                                        {genre.name}
                                    </Badge>
                                ))}
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 gap-8">
                            <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <BookOpen className="h-6 w-6 text-primary" />
                                    Synopsis
                                </h2>
                                <p className="text-base md:text-lg leading-relaxed text-muted-foreground whitespace-pre-line bg-white/5 p-6 rounded-2xl border border-white/5">
                                    {manga.synopsis || 'No synopsis available.'}
                                </p>
                            </section>

                            <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <User className="h-6 w-6 text-primary" />
                                    Characters
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
                                    {Array.isArray(characters) && characters.slice(0, 8).map((char: any) => (
                                        <CharacterCard
                                            key={char.character?.mal_id || char.id}
                                            character={char.character}
                                            role={char.role}
                                        />
                                    ))}
                                </div>
                            </section>

                            {/* Chapters Section */}
                            <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <Layers className="h-6 w-6 text-primary" />
                                    Chapters
                                </h2>
                                
                                {chaptersLoading ? (
                                    <div className="flex justify-center py-8 bg-white/5 rounded-2xl border border-white/5">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                ) : chapters.length > 0 ? (
                                    <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                                            {chapters.map((chapter) => (
                                                <Link 
                                                    key={chapter.id} 
                                                    href={`/manga/read/${chapter.id}?mangaId=${manga.mal_id}`}
                                                    className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors group"
                                                >
                                                    <div>
                                                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                            {chapter.title ? chapter.title : `Chapter ${chapter.chapterNumber}`}
                                                        </h3>
                                                        <span className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                                            {chapter.chapterNumber ? `Ch. ${chapter.chapterNumber}` : ''}
                                                            {chapter.volumeNumber ? `• Vol. ${chapter.volumeNumber}` : ''}
                                                            {chapter.pages ? `• ${chapter.pages} Pages` : ''}
                                                        </span>
                                                    </div>
                                                    <Button variant="secondary" size="sm" className="opacity-0 md:opacity-100 group-hover:opacity-100 transition-opacity">
                                                        Read
                                                    </Button>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground bg-white/5 rounded-2xl border border-white/5 text-sm font-medium">
                                        No readable chapters found for this title.
                                    </div>
                                )}
                            </section>
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
                    className="fixed bottom-[72px] left-4 right-4 z-[40] md:hidden"
                >
                    <div className="bg-background/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl flex items-center gap-3">
                        <div className="flex-1">
                            {isInMangaList ? (
                                <select
                                    value={mangaListStatus}
                                    onChange={(e) => handleUpdateStatus(e.target.value)}
                                    className="w-full h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-sm font-bold focus:ring-2 focus:ring-primary"
                                >
                                    {statusOptions.map(option => (
                                        <option key={option.value} value={option.value} className="bg-background">
                                            {option.label}
                                        </option>
                                    ))}
                                    <option value="REMOVE" className="bg-destructive/10 text-destructive font-bold">
                                        Remove from List
                                    </option>
                                </select>
                            ) : (
                                <AuthGuard
                                    title="Track Your Reading"
                                    description="Sign in to add this manga to your personal read list and track your progress through the scrolls."
                                    fallback={
                                        <div className="w-full h-12 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center opacity-50">
                                            <Plus className="h-5 w-5 mr-2" />
                                            <span className="font-bold">Add to Read List</span>
                                        </div>
                                    }
                                >
                                    <Button
                                        className="w-full h-12 rounded-xl font-bold text-base shadow-lg shadow-primary/20"
                                        onClick={() => handleUpdateStatus('PLAN_TO_READ')}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5 mr-2" />}
                                        Add to Read List
                                    </Button>
                                </AuthGuard>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <AuthGuard
                                title="Favorite This Legend"
                                description="Unlock the ability to save your all-time favorite manga and showcase them on your premium profile."
                                fallback={
                                    <div className="h-12 w-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center opacity-50">
                                        <Heart className="h-6 w-6" />
                                    </div>
                                }
                            >
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className={cn(
                                        "h-12 w-12 rounded-xl border-white/10 bg-white/5 shrink-0",
                                        isFavorited && "bg-red-500/20 border-red-500/50 text-red-500"
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
                                    <Button size="icon" variant="outline" className="h-12 w-12 rounded-xl border-white/10 bg-white/5 shrink-0">
                                        <Share2 className="h-6 w-6" />
                                    </Button>
                                }
                            />
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
