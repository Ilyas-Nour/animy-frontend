'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { useAuth } from '@/context/AuthContext'
import { Trophy, ChevronRight, Play, Star, Plus } from 'lucide-react'
import { Anime } from '@/types/anime'
import { XpBar } from '@/components/shared/XpBar'
import { XpInfoButton } from '@/components/shared/XpInfoButton'
import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'
import { getAvatarUrl } from '@/lib/utils'

interface UserHomeSectionProps {
    trending: Anime[]
}

export function UserHomeSection({ trending }: UserHomeSectionProps) {
    const { user, updateUser } = useAuth()
    const [claiming, setClaiming] = useState(false)
    const [alreadyClaimed, setAlreadyClaimed] = useState(false)

    // Check if already claimed today
    useEffect(() => {
        if (user?.lastCheckIn) {
            const last = new Date(user.lastCheckIn)
            const now = new Date()
            // Compare local dates
            const isToday = last.toDateString() === now.toDateString()
            setAlreadyClaimed(isToday)
        }
    }, [user])

    const recommendedAnime = trending.slice(0, 3) // Mock recommendations

    const handleClaimReward = async () => {
        if (alreadyClaimed || claiming) return
        setClaiming(true)
        try {
            await api.post('/users/daily-reward')
            toast.success('Daily Reward Claimed! +50 XP')
            setAlreadyClaimed(true)

            // Refresh user profile to get new XP
            const profile = await api.get('/auth/me')
            // const fullProfile = await api.get('/users/profile') // Ensure we get full profile including XP
            updateUser(profile.data.data) // 'profile.data.data' from /auth/me should have XP if we added it to select

        } catch (err: any) {
            console.error('Claim Error:', err)
            // Handle potentially nested error objects from NestJS/Backend
            let errorMessage = 'Failed to claim reward'
            if (err.response?.data) {
                const data = err.response.data
                if (typeof data.message === 'string') {
                    errorMessage = data.message
                } else if (Array.isArray(data.message)) {
                    // Handle class-validator array
                    errorMessage = data.message.join(', ')
                } else if (typeof data.message === 'object') {
                    // Handle weird nested object case if any
                    errorMessage = JSON.stringify(data.message)
                }
            }
            toast.error(errorMessage)

            // If the error implies already claimed, update state to reflect reality
            if (errorMessage.toLowerCase().includes('already claimed')) {
                setAlreadyClaimed(true)
            }
        } finally {
            setClaiming(false)
        }
    }

    if (!user) return null

    return (
        <section className="container py-8 md:py-24">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">

                {/* 1. Welcome & Stats (Left Column) */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="md:col-span-1 space-y-4 md:space-y-6"
                >
                    <div className="p-6 md:p-8 rounded-[2rem] bg-gradient-to-br from-card to-card/50 border border-border shadow-2xl relative overflow-hidden group">

                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                            <Trophy size={140} />
                        </div>

                        <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">

                            {/* Avatar - Centered on Mobile */}
                            <div className="mb-6 relative">
                                <div className="h-24 w-24 md:h-20 md:w-20 rounded-full border-4 border-background bg-secondary overflow-hidden shadow-lg">
                                    {user.avatar ? (
                                        <Image
                                            src={getAvatarUrl(user.avatar) || '/placeholder.png'}
                                            alt={user.username || 'User'}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-2xl font-bold">
                                            {user.username?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter mb-1">
                                WELCOME BACK,
                            </h2>
                            <p className="text-lg md:text-xl font-medium text-primary mb-6">
                                {user.username}
                            </p>

                            <div className="w-full bg-background/50 backdrop-blur-md rounded-2xl p-4 border border-white/5 space-y-4 text-left">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider">Current Rank</p>
                                        <p className="text-base md:text-lg font-black text-foreground">{user.rank || 'Initiate'}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                        <span className="font-bold text-primary">{user.level}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <XpBar currentXp={user.xp} requiredXp={user.nextLevelXp || 1000} level={user.level} />
                                </div>
                            </div>

                            <div className="pt-6 w-full">
                                <Link href="/dashboard" className="w-full">
                                    <Button className="w-full rounded-xl font-bold bg-foreground text-background hover:bg-foreground/90">
                                        Go to Dashboard
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Quick Daily Daily Reward or Action */}
                    <div className="p-6 rounded-[2rem] bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-border flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-foreground">Daily Check-in</h4>
                            <p className="text-xs text-muted-foreground">
                                {alreadyClaimed ? 'Come back tomorrow!' : 'Claim +50 XP now'}
                            </p>
                        </div>
                        {alreadyClaimed ? (
                            <Button
                                size="sm"
                                variant="secondary"
                                disabled
                                className="rounded-full h-8 font-bold bg-muted/50 text-muted-foreground border border-transparent"
                            >
                                Collected
                            </Button>
                        ) : (
                            <motion.button
                                onClick={handleClaimReward}
                                disabled={claiming}
                                animate={{
                                    y: [0, -4, 0],
                                    boxShadow: [
                                        "0px 0px 0px rgba(0,0,0,0)",
                                        "0px 4px 12px rgba(var(--primary), 0.3)",
                                        "0px 0px 0px rgba(0,0,0,0)"
                                    ]
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative h-8 px-4 rounded-full bg-primary text-primary-foreground font-bold overflow-hidden shadow-lg group-hover:shadow-primary/25"
                            >
                                {/* Shine Effect */}
                                <motion.div
                                    animate={{ x: ["-100%", "200%"] }}
                                    transition={{
                                        duration: 2.5,
                                        repeat: Infinity,
                                        ease: "linear",
                                        repeatDelay: 1
                                    }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                                />
                                <span className="relative z-10 flex items-center gap-1">
                                    {claiming ? 'Claiming...' : 'Claim Reward 🎁'}
                                </span>
                            </motion.button>
                        )}
                    </div>
                </motion.div>


                {/* 2. Content Board (Right Column - Wider) */}
                <div className="md:col-span-2 space-y-6 md:space-y-8">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl md:text-2xl font-black italic tracking-tight">CONTINUE WATCHING</h3>
                        <Link href="/dashboard/watchlist" className="text-sm font-bold text-muted-foreground hover:text-primary flex items-center gap-1">
                            View All <ChevronRight size={16} />
                        </Link>
                    </div>

                    {/* Recommendations / Continue Watching Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* 
                           Since we don't have real history API yet, we'll use trending anime 
                           as "Recommended for You" or placeholders.
                        */}
                        {recommendedAnime.map((anime, index) => (
                            <motion.div
                                key={anime.mal_id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className={`group relative aspect-[4/5] rounded-3xl overflow-hidden bg-muted ${index === 2 ? 'hidden lg:block' : ''}`}
                            >
                                <Image
                                    src={anime.images?.jpg?.large_image_url || '/placeholder.jpg'}
                                    alt={anime.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 md:p-6 flex flex-col justify-end">
                                    <h4 className="font-bold text-white line-clamp-2 leading-tight mb-2 text-sm md:text-base">{anime.title}</h4>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Badge variant="outline" className="border-white/30 text-white bg-white/10 backdrop-blur-sm text-[10px]">
                                            Eps {anime.episodes || '?'}
                                        </Badge>
                                        <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                                            <Star size={12} fill="currentColor" /> {anime.score}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Link href={`/anime/${anime.mal_id}`} className="w-full">
                                            <Button size="sm" className="w-full rounded-xl bg-white text-black hover:bg-white/90 font-bold text-xs h-8">
                                                <Play size={12} className="mr-1" fill="currentColor" /> Watch
                                            </Button>
                                        </Link>
                                        <Button size="sm" variant="outline" className="w-full rounded-xl border-white/20 hover:bg-white/10 text-white font-bold text-xs h-8"
                                        // Add to watchlist logic requires client component complexity, keep simple for now
                                        >
                                            <Plus size={12} className="mr-1" /> Add
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Banner: Explore */}
                    <Link href="/anime" className="block relative h-28 md:h-32 rounded-[2rem] overflow-hidden group border border-border">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 opacity-20 group-hover:opacity-30 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-between px-6 md:px-10">
                            <div>
                                <h3 className="text-lg md:text-xl font-black italic text-foreground">DISCOVER NEW GEMS</h3>
                                <p className="text-xs md:text-sm text-muted-foreground">Browse the top rated anime of all time.</p>
                            </div>
                            <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground group-hover:scale-110 transition-transform">
                                <ChevronRight size={24} />
                            </div>
                        </div>
                    </Link>

                </div>

            </div>
        </section>
    )
}
