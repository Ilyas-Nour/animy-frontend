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
import { StreamingContainer } from '@/components/streaming/StreamingContainer'
import { RelationCard } from './RelationCard'
import { CharacterVoiceCard } from './CharacterVoiceCard'
import { StaffCard } from './StaffCard'

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

    useEffect(() => {
        if (anime) {
            document.title = `${anime.title} | Animy`
        }
    }, [anime])

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
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            {/* Banner Section */}
            <div className="relative w-full h-[300px] md:h-[450px] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
                <div className="absolute inset-0 bg-black/20 z-[1]" />
                {anime.images?.jpg?.large_image_url && (
                    <motion.div
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        className="w-full h-full"
                    >
                        <Image
                            src={anime.images.jpg.large_image_url}
                            alt={anime.title}
                            fill
                            className="object-cover object-center blur-2xl opacity-60 scale-110"
                            priority
                        />
                    </motion.div>
                )}

                {/* Content Overlay */}
                <div className="absolute inset-0 z-20 flex flex-col justify-end pb-12">
                    <div className="container px-4 md:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="max-w-4xl"
                        >
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white drop-shadow-2xl mb-4 leading-tight">
                                {anime.title}
                            </h1>
                            {anime.title_english && anime.title_english !== anime.title && (
                                <p className="text-lg md:text-2xl text-white/80 font-medium drop-shadow-lg mb-6">
                                    {anime.title_english}
                                </p>
                            )}
                            <div className="flex flex-wrap gap-3">
                                {anime.genres?.map(genre => (
                                    <Badge
                                        key={genre.mal_id}
                                        className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 transition-all duration-300"
                                    >
                                        {genre.name}
                                    </Badge>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="container -mt-8 md:-mt-16 px-4 md:px-8 relative z-30 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Left Sidebar: Poster & Meta */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Poster */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="relative group"
                        >
                            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-secondary">
                                {anime.images?.jpg?.large_image_url ? (
                                    <Image
                                        src={anime.images.jpg.large_image_url}
                                        alt={anime.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        priority
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">No Image</div>
                                )}
                            </div>
                        </motion.div>

                        {/* Actions (Desktop) */}
                        <div className="hidden lg:flex flex-col gap-3">
                            <AuthGuard
                                title="Favorite"
                                description="Add this anime to your favorites list."
                                fallback={
                                    <Button variant="outline" className="w-full h-12 rounded-xl opacity-50 cursor-not-allowed">
                                        <Heart className="h-5 w-5 mr-2" /> Favorite
                                    </Button>
                                }
                            >
                                <Button
                                    variant={isFavorited ? "default" : "outline"}
                                    className={cn(
                                        "w-full h-12 rounded-xl font-bold transition-all",
                                        isFavorited && "bg-red-500 hover:bg-red-600 text-white border-red-500"
                                    )}
                                    onClick={handleToggleFavorite}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Heart className={cn("h-5 w-5 mr-2", isFavorited && "fill-current")} />
                                    )}
                                    {isFavorited ? 'Favorited' : 'Add to Favorites'}
                                </Button>
                            </AuthGuard>

                            {isInWatchlist ? (
                                <div className="space-y-2">
                                    <select
                                        value={watchlistStatus}
                                        onChange={handleUpdateWatchlistStatus}
                                        disabled={actionLoading}
                                        className="w-full h-12 px-4 rounded-xl border border-white/10 bg-secondary/50 backdrop-blur-md text-sm font-bold focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                                    >
                                        {statusOptions.map(option => (
                                            <option key={option.value} value={option.value} className="bg-background">
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <Button
                                        variant="ghost"
                                        className="w-full text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 font-medium"
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
                                        <Button className="w-full h-12 rounded-xl bg-primary/20 text-primary opacity-50 cursor-not-allowed">
                                            <Plus className="h-5 w-5 mr-2" /> Watchlist
                                        </Button>
                                    }
                                >
                                    <Button
                                        className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
                                        onClick={() => handleAddToWatchlist('PLAN_TO_WATCH')}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5 mr-2" />}
                                        Add to Watchlist
                                    </Button>
                                </AuthGuard>
                            )}

                            <ShareModal
                                title={anime.title}
                                description={anime.synopsis}
                                image={anime.images?.jpg?.large_image_url}
                                type="ANIME"
                                id={anime.mal_id}
                                path={`/anime/${anime.mal_id}`}
                                trigger={
                                    <Button variant="secondary" className="w-full h-12 rounded-xl font-bold border border-white/5">
                                        <Share2 className="h-5 w-5 mr-2" /> Share
                                    </Button>
                                }
                            />
                        </div>

                        {/* Metadata Sidebar */}
                        <div className="bg-secondary/20 backdrop-blur-md rounded-2xl p-6 border border-white/5 space-y-6">
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
                                <MetadataItem
                                    icon={<Star className="text-yellow-500 fill-yellow-500" />}
                                    label="Score"
                                    value={getAnimeScore(anime.score)}
                                />
                                <MetadataItem icon={<TrendingUp />} label="Popularity" value={`#${anime.popularity || 'N/A'}`} />

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
                        {/* Stats Ribbons */}
                        <div className="flex flex-wrap gap-4 items-center justify-center lg:justify-start">
                            {anime.score && (
                                <StatCard
                                    color="yellow"
                                    icon={<Star className="h-6 w-6 fill-current" />}
                                    value={getAnimeScore(anime.score)}
                                    label="Global Score"
                                />
                            )}
                            <StatCard
                                color="blue"
                                icon={<TrendingUp className="h-6 w-6" />}
                                value={`#${anime.rank || 'N/A'}`}
                                label="Ranked"
                            />
                            <StatCard
                                color="purple"
                                icon={<Users className="h-6 w-6" />}
                                value={anime.members?.toLocaleString() || 'N/A'}
                                label="Members"
                            />
                            <StatCard
                                color="green"
                                icon={<Heart className="h-6 w-6" />}
                                value={anime.favorites?.toLocaleString() || 'N/A'}
                                label="Favorites"
                            />
                        </div>

                        {/* Synopsis */}
                        <section className="bg-secondary/10 rounded-3xl p-8 border border-white/5">
                            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                                <span className="w-1.5 h-8 bg-primary rounded-full" />
                                Synopsis
                            </h2>
                            <div
                                className="text-lg leading-loose text-muted-foreground prose prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: anime.synopsis || 'No synopsis available.' }}
                            />
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

                        {/* Streaming */}
                        <section className="bg-background relative rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
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
                                    malId={anime.idMal || anime.mal_id}
                                    totalEpisodes={anime.episodes || 0}
                                />
                            </div>
                        </section>

                        {/* Trailer */}
                        {anime.trailer?.youtube_id && (
                            <section>
                                <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                                    <span className="w-1.5 h-8 bg-primary rounded-full" />
                                    Trailer
                                </h2>
                                <div className="aspect-video w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${anime.trailer.youtube_id}?autoplay=0&modestbranding=1&rel=0`}
                                        title={`${anime.title} Trailer`}
                                        className="w-full h-full"
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

                        {/* External Links */}
                        {anime.streaming && anime.streaming.length > 0 && (
                            <section className="border-t border-white/5 pt-12">
                                <h2 className="text-2xl font-black mb-6">Official Sources</h2>
                                <div className="flex flex-wrap gap-4">
                                    {anime.streaming.map((stream, index) => (
                                        <a
                                            key={index}
                                            href={stream.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group"
                                        >
                                            <Button variant="outline" className="gap-2 rounded-xl h-12 px-6 border-white/10 hover:border-primary/50 hover:bg-primary/10 transition-all">
                                                <ExternalLink className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                                                <span className="font-bold">{stream.name}</span>
                                            </Button>
                                        </a>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Bar */}
            <AnimatePresence>
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    exit={{ y: 100 }}
                    className="fixed bottom-[72px] left-4 right-4 z-[40] lg:hidden"
                >
                    <div className="bg-secondary/90 backdrop-blur-3xl border border-white/10 rounded-3xl p-4 shadow-2xl flex items-center gap-3">
                        <div className="flex-1">
                            {isInWatchlist ? (
                                <select
                                    value={watchlistStatus}
                                    onChange={handleUpdateWatchlistStatus}
                                    className="w-full h-14 px-6 rounded-2xl border border-white/10 bg-white/5 text-sm font-black focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                                >
                                    {statusOptions.map(option => (
                                        <option key={option.value} value={option.value} className="bg-background">
                                            {option.label}
                                        </option>
                                    ))}
                                    <option value="REMOVE" className="bg-destructive/10 text-destructive font-bold">Remove</option>
                                </select>
                            ) : (
                                <AuthGuard
                                    title="Watchlist"
                                    description="Add this to your watchlist."
                                    fallback={
                                        <Button className="w-full h-14 rounded-2xl font-black opacity-50">
                                            <Plus className="h-5 w-5 mr-2" /> Add to List
                                        </Button>
                                    }
                                >
                                    <Button
                                        className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20"
                                        onClick={() => handleAddToWatchlist('PLAN_TO_WATCH')}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-6 w-6 mr-2" />}
                                        Add to List
                                    </Button>
                                </AuthGuard>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <AuthGuard
                                title="Favorite"
                                description="Add to your favorites."
                                fallback={
                                    <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl opacity-50">
                                        <Heart className="h-6 w-6" />
                                    </Button>
                                }
                            >
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className={cn(
                                        "h-14 w-14 rounded-2xl border-white/10 bg-white/5 shrink-0 transition-all",
                                        isFavorited && "bg-red-500/20 border-red-500/50 text-red-500"
                                    )}
                                    onClick={handleToggleFavorite}
                                    disabled={actionLoading}
                                >
                                    <Heart className={cn("h-6 w-6", isFavorited && "fill-current")} />
                                </Button>
                            </AuthGuard>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
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
