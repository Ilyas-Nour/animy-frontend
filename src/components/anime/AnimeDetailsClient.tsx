'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Star, Calendar, Tv, Clock, TrendingUp, Users,
    Heart, ExternalLink, Plus, Loader2, Share2,
    Info, Play, List
} from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Anime } from '@/types/anime'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAnimeScore, getAnimeStatus, cn } from '@/lib/utils'
import { CharacterCard } from '@/components/characters/CharacterCard'
import { ShareModal } from '@/components/common/ShareModal'
import { AuthGuard } from '@/components/shared/AuthGuard'
import { StreamingContainer } from '@/components/streaming/StreamingContainer'

interface AnimeDetailsClientProps {
    anime: Anime
    characters: any[]
}

export function AnimeDetailsClient({ anime, characters }: AnimeDetailsClientProps) {
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
        <div className="min-h-screen pb-24 md:pb-12">
            {/* Hero Section */}
            <div className="relative h-[300px] md:h-[500px] w-full">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />
                {anime.images?.jpg?.large_image_url && (
                    <Image
                        src={anime.images.jpg.large_image_url}
                        alt={anime.title}
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
                                {anime.images?.jpg?.large_image_url ? (
                                    <Image
                                        src={anime.images.jpg.large_image_url}
                                        alt={anime.title}
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                ) : (
                                    <div className="w-full h-full bg-secondary flex items-center justify-center">No Image</div>
                                )}
                            </div>

                            {/* Desktop-only Quick Actions */}
                            <CardContent className="p-4 space-y-3 hidden md:block">
                                <AuthGuard
                                    title="Favorite Your Legend"
                                    description="Unlock the ability to save your all-time favorites and showcase them on your premium profile."
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

                                {isInWatchlist ? (
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <select
                                                value={watchlistStatus}
                                                onChange={handleUpdateWatchlistStatus}
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
                                            onClick={handleRemoveFromWatchlist}
                                            disabled={actionLoading}
                                        >
                                            Remove from Watchlist
                                        </Button>
                                    </div>
                                ) : (
                                    <AuthGuard
                                        title="Track Your Watchlist"
                                        description="Sign in to add this anime to your personal watchlist and never miss an episode again."
                                        fallback={
                                            <Button
                                                className="w-full gap-2 bg-primary/50 opacity-50"
                                            >
                                                <Plus className="h-4 w-4" /> Add to Watchlist
                                            </Button>
                                        }
                                    >
                                        <Button
                                            className="w-full gap-2 bg-primary hover:bg-primary/90"
                                            onClick={() => handleAddToWatchlist('PLAN_TO_WATCH')}
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                            Add to Watchlist
                                        </Button>
                                    </AuthGuard>
                                )}

                                <ShareModal
                                    title={anime.title}
                                    description={anime.synopsis?.substring(0, 100)}
                                    image={anime.images?.jpg?.large_image_url}
                                    type="ANIME"
                                    id={anime.mal_id}
                                    path={`/anime/${anime.mal_id}`}
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
                                    <span className="text-muted-foreground flex items-center gap-1"><Tv className="h-3 w-3" /> Type</span>
                                    <span className="font-medium">{anime.type || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-muted-foreground flex items-center gap-1"><Play className="h-3 w-3" /> Episodes</span>
                                    <span className="font-medium">{anime.episodes || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Duration</span>
                                    <span className="font-medium">{anime.duration || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Status</span>
                                    <span className="font-medium">{getAnimeStatus(anime.status)}</span>
                                </div>
                                {anime.studios && anime.studios.length > 0 && (
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground block">Studios</span>
                                        <div className="flex flex-wrap gap-1">
                                            {anime.studios.map(studio => (
                                                <Badge key={studio.name} variant="secondary" className="text-[10px] py-0">{studio.name}</Badge>
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
                                    {anime.title}
                                </h1>
                                {anime.title_english && (
                                    <p className="text-lg md:text-xl text-muted-foreground font-medium">
                                        {anime.title_english}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center">
                                {anime.score && (
                                    <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-2">
                                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                                        <div>
                                            <div className="text-xl font-bold text-yellow-500">{getAnimeScore(anime.score)}</div>
                                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2">
                                    <TrendingUp className="h-5 w-5 text-blue-500" />
                                    <div>
                                        <div className="text-xl font-bold text-blue-500">#{anime.rank || 'N/A'}</div>
                                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Ranked</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-2">
                                    <Users className="h-5 w-5 text-purple-500" />
                                    <div>
                                        <div className="text-xl font-bold text-purple-500">{anime.members?.toLocaleString()}</div>
                                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Members</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                {anime.genres?.map(genre => (
                                    <Badge key={genre.mal_id} variant="secondary" className="px-3 py-1 bg-white/5 border-white/10 hover:bg-white/10">
                                        {genre.name}
                                    </Badge>
                                ))}
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 gap-8">
                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <List className="h-6 w-6 text-primary" />
                                    Synopsis
                                </h2>
                                <p className="text-base md:text-lg leading-relaxed text-muted-foreground whitespace-pre-line bg-card/50 p-6 rounded-2xl border border-white/5">
                                    {anime.synopsis || 'No synopsis available.'}
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <Users className="h-6 w-6 text-primary" />
                                    Characters
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {Array.isArray(characters) && characters.slice(0, 8).map((char: any) => (
                                        <CharacterCard
                                            key={char.character.mal_id}
                                            character={char.character}
                                            role={char.role}
                                            isFavorited={favoriteCharacters.includes(char.character.mal_id)}
                                        />
                                    ))}
                                </div>
                            </section>

                            {anime.trailer?.youtube_id && (
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        <Play className="h-6 w-6 text-primary" />
                                        Trailer
                                    </h2>
                                    <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                                        <iframe
                                            src={`https://www.youtube.com/embed/${anime.trailer.youtube_id}`}
                                            title="Anime Trailer"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="w-full h-full"
                                        />
                                    </div>
                                </section>
                            )}

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <Play className="h-6 w-6 text-primary" />
                                    Watch Now
                                </h2>
                                <StreamingContainer
                                    animeTitle={anime.title}
                                    animeTitleEnglish={anime.title_english}
                                    animePoster={anime.images?.jpg?.large_image_url}
                                    malId={anime.mal_id}
                                />
                            </section>

                            {anime.streaming && anime.streaming.length > 0 && (
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        <ExternalLink className="h-6 w-6 text-primary" />
                                        Where to Watch
                                    </h2>
                                    <div className="flex flex-wrap gap-3">
                                        {anime.streaming.map((stream, index) => (
                                            <a key={index} href={stream.url} target="_blank" rel="noopener noreferrer">
                                                <Button variant="outline" className="gap-2 rounded-xl">
                                                    {stream.name}
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </a>
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
                    className="fixed bottom-[72px] left-4 right-4 z-[40] md:hidden"
                >
                    <div className="bg-background/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl flex items-center gap-3">
                        <div className="flex-1">
                            {isInWatchlist ? (
                                <select
                                    value={watchlistStatus}
                                    onChange={handleUpdateWatchlistStatus}
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
                                    title="Track Your Watchlist"
                                    description="Sign in to add this anime to your personal watchlist and never miss an episode again."
                                    fallback={
                                        <div className="w-full h-12 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center opacity-50">
                                            <Plus className="h-5 w-5 mr-2" />
                                            <span className="font-bold">Add to Watchlist</span>
                                        </div>
                                    }
                                >
                                    <Button
                                        className="w-full h-12 rounded-xl font-bold text-base shadow-lg shadow-primary/20"
                                        onClick={() => handleAddToWatchlist('PLAN_TO_WATCH')}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5 mr-2" />}
                                        Add to Watchlist
                                    </Button>
                                </AuthGuard>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <AuthGuard
                                title="Favorite Your Legend"
                                description="Unlock the ability to save your all-time favorites and showcase them on your premium profile."
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
                                title={anime.title}
                                description={anime.synopsis?.substring(0, 100)}
                                image={anime.images?.jpg?.large_image_url}
                                type="ANIME"
                                id={anime.mal_id}
                                path={`/anime/${anime.mal_id}`}
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
