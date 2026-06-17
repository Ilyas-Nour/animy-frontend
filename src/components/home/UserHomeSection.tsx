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
import { DashboardNews } from './DashboardNews'
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
            // Compare UTC dates to avoid timezone discrepancies
            const isToday = last.getUTCFullYear() === now.getUTCFullYear() &&
                            last.getUTCMonth() === now.getUTCMonth() &&
                            last.getUTCDate() === now.getUTCDate()
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
            
            // Skip logging the 400 error to console if it's just 'already claimed' to avoid console noise
            const isAlreadyClaimedError = errorMessage.toLowerCase().includes('already claimed')
            if (!isAlreadyClaimedError) {
                console.error('Claim Error:', err)
            }
            
            toast.error(errorMessage)

            // If the error implies already claimed, update state to reflect reality
            if (isAlreadyClaimedError) {
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
                                Welcome back,
                            </h2>
                            <p className="text-lg md:text-xl font-medium text-primary mb-6">
                                {user.username}
                            </p>

                            <div className="w-full bg-background/50 backdrop-blur-md rounded-2xl p-4 border border-white/5 space-y-4 text-left">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider">Rank</p>
                                        <p className="text-base md:text-lg font-black text-foreground">{user.rank || 'Beginner'}</p>
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
                <div className="md:col-span-2">
                    <DashboardNews />
                </div>

            </div>
        </section>
    )
}
