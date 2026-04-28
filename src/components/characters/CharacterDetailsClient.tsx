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

    const cleanAbout = (text: string) => {
        if (!text) return ""
        return text
            .replace(/__(.*?)__/g, "<strong>$1</strong>")
            .replace(/_(.*?)_/g, "<em>$1</em>")
            .replace(/~(.*?)~/g, "<strike>$1</strike>")
            .replace(/\[url=(.*?)\](.*?)\[\/url\]/g, '<a href="$1" target="_blank" class="text-primary hover:underline">$2</a>')
            .replace(/\[img\](.*?)\[\/img\]/g, "")
            .replace(/~!(.*?)!~/g, '<span class="bg-foreground/10 blur-sm hover:blur-none transition-all px-1 rounded cursor-help" title="Spoiler">$1</span>')
            .replace(/\n/g, "<br />")
    }

    return (
        <div className="min-h-screen pb-24 md:pb-12 bg-background">
            {/* Hero Section */}
            <div className="relative h-[300px] md:h-[500px] w-full overflow-hidden">
                {/* Layered Background */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src={character.images?.webp?.image_url || character.images?.jpg?.image_url}
                        alt=""
                        fill
                        className="object-cover blur-[100px] opacity-40 scale-125"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent z-10 hidden md:block" />
                </div>

                <div className="container relative h-full z-20 flex flex-col justify-between py-8">
                    <Button
                        variant="ghost"
                        className="w-fit gap-2 bg-background/20 backdrop-blur-md hover:bg-background/40 transition-all border border-white/10"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Anime
                    </Button>

                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4 mb-8 md:mb-12"
                    >
                        <h1 className="text-5xl md:text-8xl font-black text-foreground drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] tracking-tighter">
                            {character.name}
                        </h1>
                        <div className="flex flex-wrap gap-3">
                            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 px-4 py-1 text-sm font-bold">
                                Character
                            </Badge>
                            {character.name_kanji && (
                                <Badge variant="outline" className="bg-white/5 border-white/10 text-foreground/80 px-4 py-1 text-sm font-medium">
                                    {character.name_kanji}
                                </Badge>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="container relative z-30 -mt-20 md:-mt-32">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
                    {/* Left Column: Image & Details */}
                    <div className="lg:col-span-4 xl:col-span-3 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative group"
                        >
                            <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-background aspect-[3/4.5]">
                                <Image
                                    src={character.images?.webp?.image_url || character.images?.jpg?.image_url}
                                    alt={character.name}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    priority
                                />
                            </div>
                        </motion.div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={handleToggleFavorite}
                                disabled={loading}
                                size="lg"
                                className={cn(
                                    "w-full h-14 rounded-2xl gap-2 font-black shadow-xl transition-all text-base",
                                    isFavorited
                                        ? "bg-red-500 hover:bg-red-600 text-white"
                                        : "bg-primary hover:bg-primary/90"
                                )}
                            >
                                <Heart className={cn("h-6 w-6", isFavorited && "fill-current")} />
                                {isFavorited ? "In Favorites" : "Add to Favorites"}
                            </Button>

                            <ShareModal
                                title={character.name}
                                description={character.about?.substring(0, 100)}
                                image={character.images?.webp?.image_url || character.images?.jpg?.image_url}
                                type="CHARACTER"
                                id={character.mal_id}
                                path={`/character/${character.mal_id}`}
                                trigger={
                                    <Button variant="outline" size="lg" className="w-full h-14 rounded-2xl gap-2 font-bold border-white/10 bg-white/5 hover:bg-white/10">
                                        <Share2 className="h-5 w-5" />
                                        Share Character
                                    </Button>
                                }
                            />
                        </div>

                        {/* Stats / Details Card */}
                        <div className="bg-secondary/20 backdrop-blur-xl p-8 rounded-3xl border border-white/5 space-y-6">
                            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-3">
                                <Info className="h-4 w-4 text-primary" />
                                Quick Info
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Kanji Name</p>
                                    <p className="text-xl font-black text-foreground">{character.name_kanji || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Favorites</p>
                                    <p className="text-xl font-black text-pink-500 flex items-center gap-2">
                                        <Heart className="h-5 w-5 fill-current" />
                                        {(character.favorites || 0).toLocaleString()}
                                    </p>
                                </div>
                                {character.nicknames?.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nicknames</p>
                                        <div className="flex flex-wrap gap-2">
                                            {character.nicknames.map(nick => (
                                                <Badge key={nick} variant="secondary" className="bg-white/5 hover:bg-white/10 transition-colors border-none">
                                                    {nick}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: About */}
                    <div className="lg:col-span-8 xl:col-span-9">
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-secondary/10 backdrop-blur-md p-8 md:p-12 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-8"
                        >
                            <h2 className="text-3xl font-black flex items-center gap-4">
                                <span className="w-2 h-10 bg-primary rounded-full" />
                                Biography
                            </h2>
                            <div 
                                className="prose prose-invert max-w-none text-muted-foreground/90 leading-relaxed text-lg md:text-xl selection:bg-primary/30"
                                dangerouslySetInnerHTML={{ __html: cleanAbout(character.about) || 'No biography available.' }}
                            />
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
