'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, User, Heart, Share2, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CharacterCard } from '@/components/characters/CharacterCard'
import { ShareModal } from '@/components/common/ShareModal'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'

interface CharacterDetail {
    mal_id: number
    name: string
    name_kanji: string
    about: string
    images: {
        jpg: { image_url: string }
        webp: { image_url: string }
    }
    nicknames: string[]
    favorites: number
}

interface CharacterDetailsClientProps {
    character: CharacterDetail
}

export function CharacterDetailsClient({ character }: CharacterDetailsClientProps) {
    const router = useRouter()
    const { isAuthenticated } = useAuth()
    const [isFavorited, setIsFavorited] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const checkFavoriteStatus = async () => {
            if (!isAuthenticated) return
            try {
                const response = await api.get('/users/favorites/characters')
                const favorites = response.data.data || []
                const isFav = favorites.some((fav: any) => fav.characterId === character.mal_id)
                setIsFavorited(isFav)
            } catch (error) {
                console.error('Failed to check favorite status:', error)
            }
        }
        checkFavoriteStatus()
    }, [isAuthenticated, character.mal_id])

    const handleToggleFavorite = async () => {
        if (!isAuthenticated) {
            router.push('/auth/login')
            return
        }

        try {
            setLoading(true)
            if (isFavorited) {
                await api.delete(`/users/favorites/characters/${character.mal_id}`)
                toast.info(`${character.name} removed from favorites`)
            } else {
                await api.post('/users/favorites/characters', {
                    characterId: character.mal_id,
                    name: character.name,
                    imageUrl: character.images?.webp?.image_url || character.images?.jpg?.image_url,
                    role: 'Main' // Defaulting to Main since detail page doesn't have role context usually
                })
                toast.success(`${character.name} added to favorites!`)
            }
            setIsFavorited(!isFavorited)
        } catch (error: any) {
            toast.error('Failed to update favorite status')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen pb-24 md:pb-12">
            {/* Hero Section / Blurred Background */}
            <div className="relative h-[250px] md:h-[400px] w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />
                {character.images?.webp?.image_url || character.images?.jpg?.image_url ? (
                    <Image
                        src={character.images?.webp?.image_url || character.images?.jpg?.image_url}
                        alt={character.name}
                        fill
                        className="object-cover blur-3xl opacity-30 scale-110"
                        priority
                    />
                ) : null}

                <div className="absolute top-8 left-8 z-20">
                    <Button
                        variant="ghost"
                        className="gap-2 bg-background/20 backdrop-blur-md hover:bg-background/40 transition-all border border-white/10"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>
            </div>

            <div className="container -mt-32 md:-mt-48 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                    {/* Left Column: Image & Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Character Image/Card */}
                        <div className="max-w-xs mx-auto md:mx-0 relative group">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-background transform transition-transform duration-500 hover:scale-[1.02]">
                                <CharacterCard
                                    character={{
                                        mal_id: character.mal_id,
                                        name: character.name,
                                        images: character.images
                                    }}
                                    isFavorited={isFavorited}
                                    onToggleFavorite={(id, state) => setIsFavorited(state)}
                                />
                            </div>
                        </div>

                        {/* Desktop Only Actions */}
                        <div className="hidden md:flex flex-col gap-3">
                            <Button
                                onClick={handleToggleFavorite}
                                disabled={loading}
                                className={cn(
                                    "w-full h-12 gap-2 font-bold shadow-lg transition-all",
                                    isFavorited
                                        ? "bg-red-500 hover:bg-red-600 text-white"
                                        : "bg-primary hover:bg-primary/90"
                                )}
                            >
                                <Heart className={cn("h-5 w-5", isFavorited && "fill-current")} />
                                {isFavorited ? "Favorited" : "Add to Favorites"}
                            </Button>

                            <ShareModal
                                title={character.name}
                                description={character.about?.substring(0, 100) || `Checking out ${character.name}`}
                                image={character.images?.webp?.image_url || character.images?.jpg?.image_url}
                                type="CHARACTER"
                                id={character.mal_id}
                                path={`/character/${character.mal_id}`}
                                trigger={
                                    <Button variant="secondary" className="w-full h-12 gap-2 font-bold shadow-lg">
                                        <Share2 className="h-4 w-4" />
                                        Share Character
                                    </Button>
                                }
                            />
                        </div>

                        {/* Stats Card */}
                        <div className="bg-card/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5 space-y-4 shadow-xl">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                Details
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-sm text-muted-foreground">Kanji</span>
                                    <span className="font-bold text-lg">{character.name_kanji || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center pb-1">
                                    <span className="text-sm text-muted-foreground">Favorites</span>
                                    <span className="font-bold text-lg flex items-center gap-2 text-pink-500">
                                        <Heart className="h-5 w-5 fill-current" />
                                        {(character.favorites || 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Info */}
                    <div className="md:col-span-2 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h1 className="text-4xl md:text-6xl font-black text-foreground drop-shadow-2xl">
                                {character.name}
                            </h1>
                            {character.nicknames?.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {character.nicknames.map(nick => (
                                        <Badge key={nick} variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                                            {nick}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-card/30 backdrop-blur-md p-6 md:p-10 rounded-3xl border border-white/5 shadow-2xl space-y-6"
                        >
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <User className="h-6 w-6 text-primary" />
                                Biography
                            </h2>
                            <div className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-line leading-relaxed text-lg md:text-xl selection:bg-primary/30">
                                {character.about || 'No biography available.'}
                            </div>
                        </motion.section>
                    </div>
                </div>
            </div>

            {/* Sticky Bottom Action Bar for Mobile */}
            <AnimatePresence>
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-[58px] left-1 right-1 z-50 md:hidden"
                >
                    <div className="bg-background/95 backdrop-blur-2xl border-x border-t border-white/10 rounded-t-2xl p-3 shadow-2xl flex items-center gap-3">
                        <div className="flex-1 flex gap-2">
                            <Button
                                onClick={handleToggleFavorite}
                                disabled={loading}
                                className={cn(
                                    "flex-1 h-12 rounded-xl gap-2 font-bold shadow-lg transition-all",
                                    isFavorited
                                        ? "bg-red-500 hover:bg-red-600 text-white"
                                        : "bg-primary hover:bg-primary/90"
                                )}
                            >
                                <Heart className={cn("h-5 w-5", isFavorited && "fill-current")} />
                                {isFavorited ? "Favorited" : "Favorite"}
                            </Button>

                            <ShareModal
                                title={character.name}
                                description={character.about?.substring(0, 100)}
                                image={character.images?.webp?.image_url || character.images?.jpg?.image_url}
                                type="CHARACTER"
                                id={character.mal_id}
                                path={`/character/${character.mal_id}`}
                                trigger={
                                    <Button variant="secondary" className="flex-1 h-12 rounded-xl font-bold text-base shadow-lg shadow-primary/20 gap-2">
                                        <Share2 className="h-5 w-5" />
                                        Share
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
