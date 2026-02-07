'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    ChevronLeft,
    Users,
    TrendingUp,
    Calendar,
    Mail,
    User as UserIcon,
    Activity
} from 'lucide-react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getAvatarUrl, cn } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import UserAvatar from '@/components/common/UserAvatar'

interface GrowthData {
    date: string
    count: number
}

interface User {
    id: string
    username: string
    email: string
    avatar: string | null
    level: number
}

interface AnalyticsData {
    dailyGrowth: GrowthData[]
    users: User[]
}

export default function MediaItemDetailsPage() {
    const params = useParams()
    const { type, metric, id } = params as { type: string, metric: string, id: string }

    const [data, setData] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await api.get(`/admin/reports/details/${type}/${metric}/${id}`)
                setData(res.data?.data || res.data)
            } catch (error) {
                console.error('Failed to fetch details', error)
            } finally {
                setLoading(false)
            }
        }
        fetchDetails()
    }, [type, metric, id])

    if (loading) {
        return <div className="p-20 text-center animate-pulse">Loading analytics...</div>
    }

    const maxGrowth = Math.max(...(data?.dailyGrowth.map(d => d.count) || [1]))

    return (
        <div className="space-y-6 sm:space-y-8 pb-20 px-4 sm:px-0">
            <div className="flex items-center gap-3 sm:gap-4">
                <Link href={`/admin/reports/${type}/${metric}`}>
                    <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 sm:w-10 sm:h-10">
                        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black">Item <span className="text-primary italic">Deep Dive</span></h1>
                    <p className="text-muted-foreground font-medium uppercase text-[9px] sm:text-[10px] tracking-widest">
                        {type} • {metric.replace(/_/g, ' ')} • ID {id}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 sm:gap-8 lg:grid-cols-12">
                {/* Growth Chart */}
                <Card className="lg:col-span-8 shadow-xl bg-card/40 backdrop-blur-md overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-10">
                        <TrendingUp className="w-16 h-16 sm:w-24 sm:h-24" />
                    </div>
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                            Engagement Over Time
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Daily growth for the last active period.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64 sm:h-80 flex items-end gap-1 px-4 sm:px-8 pb-10">
                        {data?.dailyGrowth.map((day, idx) => (
                            <div key={day.date} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(day.count / maxGrowth) * 100}%` }}
                                    className="w-full bg-primary/40 group-hover:bg-primary transition-colors rounded-t-sm relative"
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-[9px] sm:text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity shadow-xl border whitespace-nowrap z-20">
                                        {day.count} Adds
                                    </div>
                                </motion.div>
                                <div className="absolute -bottom-6 text-[7px] sm:text-[8px] font-bold opacity-30 group-hover:opacity-100 rotate-45 origin-left whitespace-nowrap">
                                    {day.date.split('-').slice(1).join('/')}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Audience Summary */}
                <Card className="lg:col-span-4 shadow-md bg-primary/5 border border-primary/20">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase tracking-widest opacity-60">Audience</CardTitle>
                        <div className="text-5xl font-black">{data?.users.length || 0}</div>
                        <p className="text-xs font-bold text-muted-foreground pt-1">Unique users engaged via this metric.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-xs font-black uppercase opacity-60">
                            <span>Top Rank</span>
                            <span className="text-primary italic">#1 Viral</span>
                        </div>
                        <div className="w-full h-1 bg-accent rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="bg-primary h-full" />
                        </div>
                    </CardContent>
                </Card>

                {/* Users List */}
                <Card className="lg:col-span-12 shadow-md bg-card/30 border border-border/50 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between bg-muted/20 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold">Associated Users</CardTitle>
                                <CardDescription className="text-xs">Full list of individuals contributing to this metric.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {data?.users.map((user, idx) => (
                                <Link
                                    key={`${user.id}-${idx}`}
                                    href={`/admin/users/${user.id}`}
                                    className="flex items-center justify-between p-4 border-b border-border/40 hover:bg-accent/30 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <UserAvatar user={user} size="md" className="ring-1 ring-border group-hover:ring-primary/40 transition-all shadow-sm" />
                                        <div>
                                            <p className="font-bold text-sm">{user.username || 'Ghost'}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                                <Mail className="w-3 h-3" /> {user.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[9px] font-black text-muted-foreground uppercase opacity-40">Status</p>
                                            <p className="text-xs font-bold text-primary">Engaged</p>
                                        </div>
                                        <Badge variant="secondary" className="font-black text-[10px] bg-primary/10 text-primary border-none px-3">
                                            LVL {user.level}
                                        </Badge>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
