'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Activity, Users, Crown, Medal, User as UserIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'

interface UserLeaderboard {
    id: string
    username: string
    avatar: string | null
    xp: number
    level: number
    rank: string
    bannerUrl: string | null
}

export function SocialHomeSection() {
    const [leaderboard, setLeaderboard] = useState<UserLeaderboard[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await api.get('/users/leaderboard')
                if (res.data) {
                    setLeaderboard(res.data)
                }
            } catch (error) {
                console.error('Failed to fetch leaderboard:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchLeaderboard()
    }, [])

    return (
        <div className="space-y-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* 1. Leaderboard Column (2/3 width on large) */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-2">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">
                                Elite <span className="text-purple-500 italic">Global</span>
                            </h2>
                            <p className="text-muted-foreground font-medium">Top ranked members of the Animy community</p>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {loading ? (
                            // Skeleton Loading
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-20 bg-muted/50 rounded-2xl animate-pulse" />
                            ))
                        ) : (
                            leaderboard.slice(0, 5).map((user, index) => (
                                <motion.div
                                    key={user.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Link href={`/users/${user.username}`}>
                                        <Card className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors border-border/50 overflow-hidden relative group">
                                            {/* Rank Indicator */}
                                            <div className="w-12 text-center flex-shrink-0 relative z-10">
                                                {index === 0 ? <Crown className="w-8 h-8 text-yellow-500 mx-auto fill-yellow-500/20" /> :
                                                    index === 1 ? <Medal className="w-7 h-7 text-gray-400 mx-auto" /> :
                                                        index === 2 ? <Medal className="w-7 h-7 text-amber-700 mx-auto" /> :
                                                            <span className="text-xl font-black text-muted-foreground">#{index + 1}</span>}
                                            </div>

                                            {/* Avatar */}
                                            <div className="relative h-14 w-14 rounded-full overflow-hidden border-2 border-background shadow-md">
                                                <Image
                                                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                                                    alt={user.username}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>

                                            {/* User Info */}
                                            <div className="flex-1 z-10">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-lg leading-none">{user.username}</h3>
                                                    <Badge variant="outline" className="text-[10px] h-5 border-purple-500/30 text-purple-500">
                                                        {user.rank}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">Level {user.level} • {user.xp.toLocaleString()} XP</p>
                                            </div>

                                            {/* Banner Background Effect on Hover */}
                                            {user.bannerUrl && (
                                                <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500">
                                                    <Image src={user.bannerUrl} alt="banner" fill className="object-cover grayscale" />
                                                </div>
                                            )}
                                        </Card>
                                    </Link>
                                </motion.div>
                            ))
                        )}
                        <Link href="/dashboard/friends" className="w-full">
                            <Button variant="outline" className="w-full h-12 rounded-xl border-dashed border-border text-muted-foreground hover:bg-muted/50">
                                View Full Rankings
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* 2. Community Pulse / Activity (1/3 width) */}
                <div className="space-y-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-green-500 font-bold uppercase tracking-widest text-sm">
                            <Activity size={16} /> Live Feed
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter italic">
                            Pulse
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {/* Mock Activities for 'Pulse' feel */}
                        {[1, 2, 3, 4].map((i) => (
                            <Card key={i} className="p-4 bg-muted/20 border-border/50 backdrop-blur-sm">
                                <div className="flex gap-3">
                                    <div className="h-2 w-2 rounded-full bg-green-500 mt-2 flex-shrink-0 animate-pulse" />
                                    <div className="space-y-1">
                                        <p className="text-sm">
                                            <span className="font-bold">@otaku_{i}</span> just completed <span className="text-primary font-semibold">One Piece</span>
                                        </p>
                                        <span className="text-xs text-muted-foreground block">{i * 5} minutes ago</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        <Card className="p-6 bg-gradient-to-br from-purple-600 to-blue-600 border-none text-white text-center space-y-4 shadow-xl">
                            <Users size={32} className="mx-auto opacity-80" />
                            <div>
                                <h3 className="font-black text-xl">Join the Discussion</h3>
                                <p className="text-white/80 text-sm mt-1">Connect with thousands of fans.</p>
                            </div>
                            <Link href="/chat">
                                <Button className="w-full bg-white text-purple-600 hover:bg-white/90 font-bold rounded-xl">
                                    Open Global Chat
                                </Button>
                            </Link>
                        </Card>
                    </div>
                </div>

            </div>
        </div>
    )
}
