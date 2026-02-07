'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Settings, Sparkles, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAvatarUrl } from '@/lib/utils'
import { XpBar } from '@/components/shared/XpBar'
import { XpInfoButton } from '@/components/shared/XpInfoButton'

interface DashboardHeaderProps {
    user: any;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
    const [greeting, setGreeting] = useState('')

    useEffect(() => {
        const hour = new Date().getHours()
        if (hour < 12) setGreeting('Good Morning')
        else if (hour < 18) setGreeting('Good Afternoon')
        else setGreeting('Good Evening')
    }, [])

    if (!user) return null

    return (
        <div className="relative group mb-8">
            {/* Banner Area */}
            <div className="relative h-64 md:h-80 w-full rounded-3xl overflow-hidden shadow-2xl border border-white/5">
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent z-10" />
                {user.bannerUrl ? (
                    <Image
                        src={getAvatarUrl(user.bannerUrl)!}
                        alt="Profile Banner"
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                        priority
                    />
                ) : (
                    <div className="w-full h-full bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-indigo-900" />
                )}

                {/* Quick Edit Banner Button could go here */}
            </div>

            {/* Profile Content Area */}
            <div className="relative px-6 md:px-12 -mt-20 md:-mt-24 z-20">
                <div className="flex flex-col md:flex-row gap-6 md:items-end">

                    {/* Avatar */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative shrink-0"
                    >
                        <div className="h-32 w-32 md:h-44 md:w-44 rounded-full border-[6px] border-background bg-background shadow-2xl overflow-hidden relative group/avatar ring-4 ring-white/5">
                            {user.avatar ? (
                                <Image
                                    src={getAvatarUrl(user.avatar)!}
                                    alt={user.firstName}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover/avatar:scale-110"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-4xl font-bold">
                                    {(user.firstName?.[0] || 'U').toUpperCase()}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* User Details */}
                    <div className="flex-1 pb-4 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <motion.h1
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-md"
                                >
                                    {greeting}, {user.firstName}!
                                </motion.h1>
                                <p className="text-muted-foreground font-medium text-lg mt-1">@{user.username}</p>
                            </div>

                            {/* Desktop Actions */}
                            <div className="hidden md:flex gap-3">
                                <Link href="/dashboard/profile">
                                    <Button variant="secondary" className="gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white shadow-lg">
                                        <Settings className="w-4 h-4" /> Edit Profile
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Level Bar Inline */}
                        <div className="max-w-2xl bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/5 flex items-center gap-4">
                            <div className="flex-1">
                                <div className="flex justify-between text-xs font-bold mb-1 uppercase tracking-wider text-muted-foreground">
                                    <span>Lvl {user.level} • {user.rank}</span>
                                    <span>{user.xp} / {user.nextLevelXp} XP</span>
                                </div>
                                <XpBar
                                    level={user.level}
                                    currentXp={user.xp}
                                    requiredXp={user.nextLevelXp}
                                    rank={user.rank}
                                    size="sm"
                                />
                            </div>
                            <XpInfoButton />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
