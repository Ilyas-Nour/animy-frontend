'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Heart, Crown, Search, Users } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'
import { CharacterCard } from '@/components/characters/CharacterCard'
import { Loading } from '@/components/common/Loading'

interface FavoriteCharacter {
    id: string
    characterId: number
    name: string
    imageUrl: string
    role?: string
}

export default function ProfileShrinePage() {
    const [favorites, setFavorites] = useState<FavoriteCharacter[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const res = await api.get('/users/favorites/characters')
                setFavorites(res.data.data || [])
            } catch (error) {
                console.error('Failed to fetch shrine', error)
            } finally {
                setLoading(false)
            }
        }

        fetchFavorites()
    }, [])

    const handleToggle = (id: number, newState: boolean) => {
        if (!newState) {
            setFavorites(prev => prev.filter(c => c.characterId !== id))
        }
    }

    if (loading) return <Loading />

    return (
        <div className="container py-8 md:py-12 space-y-12">
            {/* Premium Hero Section */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative rounded-3xl overflow-hidden border border-white/10 p-8 md:p-12 bg-[#0B0F19] shadow-2xl"
            >
                {/* Animated Background Gradients */}
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-purple-500/5 to-transparent pointer-events-none" />
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-500/20 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />
                
                {/* Floating Decorative Elements */}
                <motion.div 
                    animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-12 right-12 opacity-30 hidden md:block"
                >
                    <Crown className="h-32 w-32 text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]" />
                </motion.div>

                <div className="relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-semibold mb-6"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>Hall of Fame</span>
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-purple-400 to-indigo-400 tracking-tight"
                    >
                        Character Shrine
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-lg md:text-xl text-muted-foreground mt-4 max-w-2xl leading-relaxed"
                    >
                        Your personal sanctuary of beloved anime and manga characters. 
                        Curate your ultimate dream team and keep them close to your heart.
                    </motion.p>
                </div>
            </motion.div>

            {/* Content Area */}
            {favorites.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="flex flex-col items-center justify-center py-32 px-4 border border-white/5 bg-white/[0.01] rounded-3xl backdrop-blur-sm relative overflow-hidden"
                >
                    <motion.div 
                        animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="relative mb-8"
                    >
                        <div className="absolute inset-0 bg-rose-500/20 blur-[60px] rounded-full scale-150" />
                        <Heart className="h-24 w-24 text-rose-500/40 relative z-10 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]" />
                    </motion.div>
                    
                    <h3 className="text-3xl font-bold text-white mb-4">Your Shrine is Empty</h3>
                    <p className="text-muted-foreground text-center text-lg max-w-md mb-10">
                        You haven't dedicated any characters to your shrine yet. Explore your favorite series to find them!
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
                        <Link 
                            href="/anime" 
                            className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-semibold shadow-lg shadow-rose-500/25 transition-all hover:scale-105 active:scale-95"
                        >
                            <Search className="w-5 h-5" />
                            Discover Anime
                        </Link>
                        <Link 
                            href="/manga" 
                            className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold transition-all hover:scale-105 active:scale-95 border border-white/10"
                        >
                            Read Manga
                        </Link>
                    </div>
                </motion.div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    <AnimatePresence>
                        {favorites.map((fav, index) => (
                            <motion.div
                                key={fav.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                                transition={{ 
                                    opacity: { duration: 0.3 },
                                    layout: { duration: 0.3 },
                                    delay: Math.min(index * 0.05, 0.5) 
                                }}
                                className="group relative"
                            >
                                {/* Glowing aura effect on hover */}
                                <div className="absolute -inset-2 bg-gradient-to-r from-rose-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                                
                                <div className="relative z-10 h-full">
                                    <CharacterCard
                                        character={{
                                            mal_id: fav.characterId,
                                            name: fav.name,
                                            images: {
                                                jpg: { image_url: fav.imageUrl },
                                                webp: { image_url: fav.imageUrl }
                                            }
                                        }}
                                        role={fav.role}
                                        isFavorited={true}
                                        onToggleFavorite={handleToggle}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
