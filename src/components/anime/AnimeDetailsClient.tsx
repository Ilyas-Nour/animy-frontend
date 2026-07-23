'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Star, Calendar, Tv, Clock, TrendingUp, Users,
    Heart, ExternalLink, Plus, Loader2, Share2,
    Info, Play, List, ChevronRight, Hash, Bookmark,
    UserCheck, Settings2, Sparkles, MessageSquare
} from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Anime, Relation, Staff, Recommendation, CharacterEdge } from '@/types/anime'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAnimeScore, getAnimeStatus, cn } from '@/lib/utils'
import { ShareModal } from '@/components/common/ShareModal'
import { AuthGuard } from '@/components/shared/AuthGuard'
import dynamic from 'next/dynamic'

const StreamingContainer = dynamic(() => import('@/components/streaming/StreamingContainer').then(mod => mod.StreamingContainer), {
  loading: () => <div className="h-[600px] w-full animate-pulse bg-card rounded-lg flex items-center justify-center border border-border/40">Loading Player...</div>,
  ssr: false
})
const RelationCard = dynamic(() => import('./RelationCard').then(mod => mod.RelationCard))
const CharacterVoiceCard = dynamic(() => import('./CharacterVoiceCard').then(mod => mod.CharacterVoiceCard))
const StaffCard = dynamic(() => import('./StaffCard').then(mod => mod.StaffCard))

interface AnimeDetailsClientProps {
    anime: Anime
}

export function AnimeDetailsClient({ anime }: AnimeDetailsClientProps) {
    const router = useRouter()
    const { isAuthenticated, user, updateUser } = useAuth()

    // Action states
    const [isFavorited, setIsFavorited] = useState(false)
    const [isInWatchlist, setIsInWatchlist] = useState(false)
    const [watchlistStatus, setWatchlistStatus] = useState<string>('PLAN_TO_WATCH')
    const [actionLoading, setActionLoading] = useState(false)
    const [favoriteCharacters, setFavoriteCharacters] = useState<number[]>([])
    const [scrolled, setScrolled] = useState(false)
    const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false)
    const primaryColor = anime.color || '#8b5cf6'

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 300)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Check status on mount if authenticated
    useEffect(() => {
        if (isAuthenticated && anime) {
            checkFavoriteStatus()
            checkWatchlistStatus()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, anime])

    const checkFavoriteStatus = async () => {
        try {
            const response = await api.get('/users/favorites')
            const favorites = response.data.data
            const favorited = favorites.some((fav: any) => fav.animeId === anime.mal_id)
            setIsFavorited(favorited)

            // Also check favorite characters
            const charResponse = await api.get('/users/favorites/characters')
            const favChars = charResponse.data.data
            setFavoriteCharacters(favChars.map((fc: any) => fc.characterId))
        } catch (error) {
            console.error('Failed to check favorite status:', error)
        }
    }

    const checkWatchlistStatus = async () => {
        try {
            const response = await api.get('/users/watchlist')
            const watchlist = response.data.data
            const item = watchlist.find((w: any) => w.animeId === anime.mal_id)
            if (item) {
                setIsInWatchlist(true)
                setWatchlistStatus(item.status)
            }
        } catch (error) {
            console.error('Failed to check watchlist status:', error)
        }
    }

    const handleToggleFavorite = async () => {

        try {
            setActionLoading(true)
            if (isFavorited) {
                await api.delete(`/users/favorites/${anime.mal_id}`)
                setIsFavorited(false)
            } else {
                const response = await api.post(`/users/favorites/${anime.mal_id}`, {
                    title: anime.title || '',
                    image: anime.images?.jpg?.large_image_url || '',
                })

                // Update local user state with new XP if available
                if (response.data.data?.userUpdates && user) {
                    updateUser({ ...user, ...response.data.data.userUpdates })
                }

                setIsFavorited(true)
            }
        } catch (error: any) {
            console.error('Failed to toggle favorite:', error)
        } finally {
            setActionLoading(false)
        }
    }

    const handleRemoveFromWatchlist = async () => {
        if (!isAuthenticated) return

        try {
            setActionLoading(true)
            await api.delete(`/users/watchlist/${anime.mal_id}`)
            setIsInWatchlist(false)
            setWatchlistStatus('PLAN_TO_WATCH')
        } catch (error: any) {
            console.error('Failed to remove from watchlist:', error)
        } finally {
            setActionLoading(false)
        }
    }

    const handleAddToWatchlist = async (status: string = 'PLAN_TO_WATCH') => {
        try {
            setActionLoading(true)
            const response = await api.post('/users/watchlist', {
                animeId: anime.mal_id,
                animeTitle: anime.title || '',
                animeImage: anime.images?.jpg?.large_image_url || '',
                status,
            })

            // Update local user state with new XP if available
            if (response.data.data?.userUpdates && user) {
                updateUser({ ...user, ...response.data.data.userUpdates })
            }

            setIsInWatchlist(true)
            setWatchlistStatus(status)
        } catch (error: any) {
            console.error('Failed to add to watchlist:', error)
        } finally {
            setActionLoading(false)
        }
    }

    const handleUpdateWatchlistStatus = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (!isAuthenticated) return

        const newStatus = e.target.value

        if (newStatus === 'REMOVE') {
            await handleRemoveFromWatchlist()
            return
        }

        try {
            setActionLoading(true)
            await api.patch(`/users/watchlist/${anime.mal_id}`, { status: newStatus })
            setWatchlistStatus(newStatus)
        } catch (error: any) {
            console.error('Failed to update watchlist status:', error)
        } finally {
            setActionLoading(false)
        }
    }

    const statusOptions = [
        { value: 'WATCHING', label: 'Watching' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'ON_HOLD', label: 'On Hold' },
        { value: 'DROPPED', label: 'Dropped' },
        { value: 'PLAN_TO_WATCH', label: 'Plan to Watch' },
    ]

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 pb-20">
            {/* Unified Hero Section */}
            <div className="relative w-full min-h-[400px] md:min-h-[600px] pb-6 md:pb-12 mb-6 md:mb-12">
                {/* Background Banner */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    {/* Sophisticated Gradients for blending */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent z-10" />
                    <div className="absolute inset-0 bg-black/40 z-[5]" />
                    {anime.images?.jpg?.large_image_url && (
                        <motion.div
                            initial={{ scale: 1.05, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.8 }}
                            className="w-full h-full"
                        >
                            <Image
                                src={anime.images.jpg.large_image_url}
                                alt={anime.title}
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
                                {anime.images?.jpg?.large_image_url ? (
                                    <Image
                                        src={anime.images.jpg.large_image_url}
                                        alt={anime.title}
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
                            {/* Title & Meta Row */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex flex-col gap-4"
                            >
                                <div>
                                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white drop-shadow-2xl mb-2 leading-tight">
                                        {anime.title}
                                    </h1>
                                    {anime.title_english && anime.title_english !== anime.title && (
                                        <p className="text-lg md:text-xl text-white/60 font-medium drop-shadow-lg">
                                            {anime.title_english}
                                        </p>
                                    )}
                                </div>

                                {/* Quick Meta Row */}
                                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 md:gap-4">
                                    {anime.score && (
                                        <div className="flex items-center gap-1.5 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-3 py-1 rounded-full font-bold text-sm backdrop-blur-md">
                                            <Star className="h-4 w-4 fill-current" />
                                            {getAnimeScore(anime.score)}
                                        </div>
                                    )}
                                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 md:gap-3 text-sm font-bold text-white/80">
                                        {anime.type && <span>{anime.type}</span>}
                                        {anime.episodes && (
                                            <>
                                                <span className="w-1.5 h-1.5 rounded-full bg-white/30 hidden md:block" />
                                                <span>{anime.episodes} Episodes</span>
                                            </>
                                        )}
                                        {anime.year && (
                                            <>
                                                <span className="w-1.5 h-1.5 rounded-full bg-white/30 hidden md:block" />
                                                <span>{anime.season} {anime.year}</span>
                                            </>
                                        )}
                                        {anime.status && (
                                            <>
                                                <span className="w-1.5 h-1.5 rounded-full bg-white/30 hidden md:block" />
                                                <span className={anime.status === 'Currently Airing' ? 'text-green-400' : ''}>
                                                    {getAnimeStatus(anime.status)}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Action Bar (Desktop & Large Mobile) */}
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="hidden md:flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-2"
                            >
                                <Button 
                                    size="lg"
                                    className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-base shadow-[0_0_30px_-5px] shadow-primary/40 group transition-all"
                                    onClick={() => document.getElementById('streaming-section')?.scrollIntoView({ behavior: 'smooth' })}
                                >
                                    <Play className="h-5 w-5 mr-2 fill-current group-hover:scale-110 transition-transform" />
                                    WATCH NOW
                                </Button>

                                {isInWatchlist ? (
                                    <div className="relative group/watchlist min-w-[160px]">
                                        <select
                                            value={watchlistStatus}
                                            onChange={handleUpdateWatchlistStatus}
                                            disabled={actionLoading}
                                            className="w-full h-12 px-4 rounded-xl border border-white/20 bg-black/40 backdrop-blur-xl text-sm font-bold text-white focus:ring-2 focus:ring-primary appearance-none cursor-pointer transition-colors hover:bg-black/60"
                                        >
                                            {statusOptions.map(option => (
                                                <option key={option.value} value={option.value} className="bg-background text-foreground">
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <Button
                                            variant="ghost"
                                            className="absolute -bottom-8 left-0 text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10 h-6 px-2 font-medium opacity-0 group-hover/watchlist:opacity-100 transition-opacity"
                                            onClick={handleRemoveFromWatchlist}
                                            disabled={actionLoading}
                                        >
                                            Remove from List
                                        </Button>
                                    </div>
                                ) : (
                                    <AuthGuard
                                        title="Watchlist"
                                        description="Add this anime to your watchlist."
                                        fallback={
                                            <Button variant="secondary" className="h-12 px-6 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md opacity-50 cursor-not-allowed">
                                                <Plus className="h-5 w-5 mr-2" /> Add to List
                                            </Button>
                                        }
                                    >
                                        <Button
                                            variant="secondary"
                                            className="h-12 px-6 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-all"
                                            onClick={() => handleAddToWatchlist('PLAN_TO_WATCH')}
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Plus className="h-5 w-5 mr-2" />}
                                            Add to List
                                        </Button>
                                    </AuthGuard>
                                )}

                                <AuthGuard
                                    title="Favorite"
                                    description="Add this anime to your favorites list."
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
                                    title={anime.title}
                                    description={anime.synopsis}
                                    image={anime.images?.jpg?.large_image_url}
                                    type="ANIME"
                                    id={anime.mal_id}
                                    path={`/anime/${anime.mal_id}`}
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
                                {anime.genres?.map(genre => (
                                    <Badge
                                        key={genre.mal_id}
                                        className="h-8 px-4 bg-white/10 hover:bg-white/20 border-white/10 text-white transition-colors font-medium rounded-full backdrop-blur-md"
                                    >
                                        {genre.name}
                                    </Badge>
                                ))}
                            </motion.div>

                            {/* Synopsis in Hero */}
                            {anime.synopsis && (
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
                                        className="text-base leading-relaxed text-white/80 line-clamp-4 hover:line-clamp-none transition-all duration-500 cursor-pointer text-left"
                                        dangerouslySetInnerHTML={{ __html: anime.synopsis }}
                                    />
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="container px-4 md:px-8 relative z-30">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Left Sidebar: Meta Details */}
                    <div className="lg:col-span-3 space-y-8">
                        

                        {/* Metadata Sidebar */}
                        <div className="bg-secondary/20 backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-6 shadow-xl">
                            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary" /> Details
                            </h3>

                            <div className="grid grid-cols-1 gap-4">
                                <MetadataItem icon={<Tv />} label="Format" value={anime.type} />
                                <MetadataItem icon={<Hash />} label="Episodes" value={anime.episodes?.toString() || 'Unknown'} />
                                <MetadataItem icon={<Clock />} label="Duration" value={anime.duration} />
                                <MetadataItem icon={<Sparkles />} label="Status" value={getAnimeStatus(anime.status || 'Unknown')} />
                                <MetadataItem
                                    icon={<Calendar />}
                                    label="Season"
                                    value={anime.season && anime.year ? `${anime.season} ${anime.year}` : 'Unknown'}
                                />
                                <MetadataItem icon={<TrendingUp />} label="Popularity" value={anime.popularity ? `#${anime.popularity}` : 'N/A'} />

                                {anime.studios && anime.studios.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Studios</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {anime.studios.map(studio => (
                                                <Badge key={studio.name} variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] px-2 py-0.5">
                                                    {studio.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <MetadataItem icon={<Bookmark />} label="Source" value={anime.source} />
                            </div>
                        </div>
                    </div>

                    {/* Right Content Area */}
                    <div className="lg:col-span-9 space-y-12">
                        

                        {/* Mobile Synopsis */}
                        {anime.synopsis && (
                            <section className="md:hidden bg-secondary/10 rounded-3xl p-6 border border-white/5">
                                <h2 className="text-xl font-black mb-4 flex items-center gap-3">
                                    <span className="w-1.5 h-6 bg-primary rounded-full" />
                                    Synopsis
                                </h2>
                                <div
                                    className="text-base leading-relaxed text-muted-foreground prose prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: anime.synopsis }}
                                />
                            </section>
                        )}

                        {/* Streaming */}
                        <section id="streaming-section" className="bg-background relative rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
                            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h2 className="text-2xl font-black flex items-center gap-3">
                                    <span className="w-1.5 h-8 bg-primary rounded-full" />
                                    Streaming
                                </h2>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white/5 px-4 py-2 rounded-full">
                                    <Play className="h-4 w-4" /> Selected: <span className="text-primary font-bold">{anime.title}</span>
                                </div>
                            </div>
                            <div className="p-2 md:p-6 lg:p-8">
                                <StreamingContainer
                                    animeTitle={anime.title}
                                    animeTitleEnglish={anime.title_english}
                                    animePoster={anime.images?.jpg?.large_image_url}
                                    malId={anime.idMal || 0}
                                    anilistId={anime.mal_id}
                                    tmdbId={anime.tmdbId}
                                    totalEpisodes={anime.episodes || 0}
                                />
                            </div>
                        </section>

                        {/* Relations */}
                        {anime.relations && anime.relations.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                                    <span className="w-1.5 h-8 bg-primary rounded-full" />
                                    Relations
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {Array.isArray(anime.relations) && anime.relations.filter(r => r && r.node).map((relation) => (
                                        <RelationCard key={relation.node.id} relation={relation} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Characters */}
                        <section>
                            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                                <span className="w-1.5 h-8 bg-primary rounded-full" />
                                Characters
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {Array.isArray(anime.characters) && anime.characters.filter(edge => edge && edge.node).slice(0, 12).map((edge: CharacterEdge, index: number) => (
                                    <CharacterVoiceCard
                                        key={edge.node.id || index}
                                        edge={edge}
                                    />
                                ))}
                            </div>
                            {(!anime.characters || anime.characters.length === 0) && (
                                <p className="text-muted-foreground italic">No character information available.</p>
                            )}
                        </section>

                        {/* Trailer */}
                        {(anime.trailer?.youtube_id || anime.trailer?.embed_url) && (
                            <section>
                                <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                                    <span className="w-1.5 h-8 bg-primary rounded-full" />
                                    Trailer
                                </h2>
                                <div className="aspect-video w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                                    <iframe
                                        src={`${(anime.trailer.embed_url || `https://www.youtube.com/embed/${anime.trailer.youtube_id}`).replace('youtube.com', 'youtube-nocookie.com')}?enablejsapi=1${typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}&widget_referrer=${encodeURIComponent(window.location.href)}` : ''}`}
                                        title={`${anime.title} Trailer`}
                                        className="w-full h-full border-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        referrerPolicy="strict-origin-when-cross-origin"
                                        allowFullScreen
                                     />
                                </div>
                            </section>
                        )}

                        {/* Staff */}
                        {anime.staff && anime.staff.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                                    <span className="w-1.5 h-8 bg-primary rounded-full" />
                                    Key Staff
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                    {Array.isArray(anime.staff) && anime.staff.filter(s => s && s.node).map((staffMember, index) => (
                                        <StaffCard key={staffMember.node.id || index} staff={staffMember} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Recommendations */}
                        {anime.recommendations && anime.recommendations.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                                    <span className="w-1.5 h-8 bg-primary rounded-full" />
                                    Recommended for You
                                </h2>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                                    {Array.isArray(anime.recommendations) && anime.recommendations.filter(rec => rec && rec.mediaRecommendation).map((rec) => (
                                        <motion.div
                                            key={rec.mediaRecommendation.id}
                                            whileHover={{ y: -8 }}
                                            className="group cursor-pointer"
                                            onClick={() => router.push(`/anime/${rec.mediaRecommendation.id}`)}
                                        >
                                            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-3 shadow-lg border border-white/5">
                                                <Image
                                                    src={rec.mediaRecommendation.coverImage.large}
                                                    alt={rec.mediaRecommendation.title.romaji}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                                    <div className="text-[10px] font-bold text-primary uppercase mb-1">View Details</div>
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                                {rec.mediaRecommendation.title.english || rec.mediaRecommendation.title.romaji}
                                            </h4>
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

function MetadataItem({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string }) {
    if (!value) return null
    return (
        <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                {React.cloneElement(icon as React.ReactElement, { className: "h-4 w-4" })}
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                <p className="text-sm font-bold text-foreground/90">{value}</p>
            </div>
        </div>
    )
}

function StatCard({ color, icon, value, label }: { color: 'yellow' | 'blue' | 'purple' | 'green', icon: React.ReactNode, value: string, label: string }) {
    const variants = {
        yellow: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
        blue: "bg-blue-500/10 border-blue-500/20 text-blue-500",
        purple: "bg-purple-500/10 border-purple-500/20 text-purple-500",
        green: "bg-green-500/10 border-green-500/20 text-green-500"
    }

    return (
        <div className={cn("flex items-center gap-4 border rounded-2xl px-6 py-3 min-w-[140px]", variants[color])}>
            {icon}
            <div>
                <div className="text-2xl font-black">{value}</div>
                <div className="text-[10px] uppercase font-bold tracking-widest opacity-70">{label}</div>
            </div>
        </div>
    )
}
