'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Heart } from 'lucide-react'
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
        <div className="container py-8 space-y-8">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-white/10 p-8">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Sparkles className="h-24 w-24 text-purple-400" />
                </div>

                <div className="relative z-10">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Heart className="h-8 w-8 text-red-500 fill-red-500" />
                        Character Shrine
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-xl">
                        Your personal collection of beloved characters. Keep them close to your heart.
                    </p>
                </div>
            </div>

            {favorites.length === 0 ? (
                <div className="text-center py-20 border border-dashed rounded-xl">
                    <p className="text-muted-foreground">Your shrine is empty. Go add some characters!</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {favorites.map((fav, index) => (
                        <motion.div
                            key={fav.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
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
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
