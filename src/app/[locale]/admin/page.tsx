'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users,
    Heart,
    Tv,
    BookOpen,
    TrendingUp,
    UserPlus,
    ArrowUpRight,
    ShieldCheck,
    Mail,
    Zap,
    Activity,
    Settings,
    Library,
    Flame,
    ChevronRight,
    BarChart3,
    CheckCircle2,
    XCircle,
    Clock,
    Award,
    Database
} from 'lucide-react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getAvatarUrl, cn } from '@/lib/utils'
import Image from 'next/image'
import UserAvatar from '@/components/common/UserAvatar'
import Link from 'next/link'

interface AnalyticsItem {
    id: number
    title: string
    image: string
    count: number
}

interface TopUser {
    id: string
    username: string
    email: string
    level: number
    xp: number
    avatar: string | null
}

interface Stats {
    totalUsers: number
    totalFavorites: number
    totalWatchlist: number
    totalManga: number
    unreadMessages: number
    watchlistStats: Record<string, number>
    topFavorites: AnalyticsItem[]
    topWatchlist: AnalyticsItem[]
    topMangaFavorites: AnalyticsItem[]
    topMangaList: AnalyticsItem[]
    topUsers: TopUser[]
    recentUsers: any[]
    mangaStats: Record<string, number>
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats')
                setStats(res.data?.data || res.data)
            } catch (error) {
                console.error('Failed to fetch admin stats', error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-10 w-64 bg-muted animate-pulse rounded-lg" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />)}
                </div>
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 h-96 bg-muted animate-pulse rounded-2xl" />
                    <div className="h-96 bg-muted animate-pulse rounded-2xl" />
                </div>
            </div>
        )
    }

    const mainStatCards = [
        { name: 'Total Users', value: stats?.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', href: '/admin/users' },
        { name: 'Unread Messages', value: stats?.unreadMessages, icon: Mail, color: 'text-orange-500', bg: 'bg-orange-500/10', href: '/admin/messages', highlight: !!stats?.unreadMessages },
        { name: 'Anime Favorites', value: stats?.totalFavorites, icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10', href: '/admin/reports/anime/favorites' },
        { name: 'Manga Total', value: stats?.totalManga, icon: BookOpen, color: 'text-green-500', bg: 'bg-green-500/10', href: '/admin/reports/manga/favorites' },
    ]

    const completionRate = stats?.watchlistStats?.COMPLETED && (stats?.watchlistStats?.COMPLETED + (stats?.watchlistStats?.DROPPED || 0)) > 0
        ? Math.round((stats.watchlistStats.COMPLETED / (stats.watchlistStats.COMPLETED + (stats.watchlistStats.DROPPED || 0))) * 100)
        : 100

    const mangaCompletionRate = stats?.mangaStats?.COMPLETED && (stats?.mangaStats?.COMPLETED + (stats?.mangaStats?.DROPPED_MANGA || stats?.mangaStats?.DROPPED || 0)) > 0
        ? Math.round((stats.mangaStats.COMPLETED / (stats.mangaStats.COMPLETED + (stats.mangaStats.DROPPED_MANGA || stats.mangaStats.DROPPED || 0))) * 100)
        : 100

    return (
        <div className="space-y-8 pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">System <span className="text-primary font-serif italic">Intelligence</span></h1>
                    <p className="text-muted-foreground mt-1 font-medium italic opacity-80 text-sm sm:text-base">Insights and analytics for the Animy ecosystem.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/admin/messages" className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full gap-2 shadow-sm rounded-xl px-5 border-border/60 relative overflow-hidden group">
                            {!!stats?.unreadMessages && (
                                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-background rounded-full animate-pulse" />
                            )}
                            <Mail className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" /> Messages
                        </Button>
                    </Link>
                    <Link href="/admin/users" className="w-full sm:w-auto">
                        <Button className="w-full gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 rounded-xl px-5">
                            <UserPlus className="w-4 h-4" /> Users
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
                {mainStatCards.map((stat, index) => (
                    <motion.div
                        key={stat.name}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Link href={stat.href}>
                            <Card className={cn(
                                "border shadow-sm overflow-hidden group hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer relative bg-card/60 backdrop-blur-sm",
                                stat.highlight && "ring-1 ring-orange-500/30"
                            )}>
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                                        <div className={cn("p-2 sm:p-4 rounded-xl sm:rounded-2xl group-hover:scale-110 transition-transform duration-500 w-fit", stat.bg)}>
                                            <stat.icon className={cn("w-5 h-5 sm:w-7 sm:h-7", stat.color)} />
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <p className="text-[9px] sm:text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1 opacity-70">{stat.name}</p>
                                            <h3 className="text-xl sm:text-3xl font-black tabular-nums">{stat.value?.toLocaleString() || 0}</h3>
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Card>
                        </Link>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                {/* Left Column: Analytics */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Top Anime Analytics */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Most Favorited */}
                        <Card className="shadow-md bg-card/40 backdrop-blur-md overflow-hidden">
                            <CardHeader className="bg-muted/10 pb-4">
                                <CardTitle className="text-md flex items-center gap-2 font-bold uppercase tracking-tight">
                                    <Flame className="w-4 h-4 text-red-500" />
                                    Most Favorited
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                {stats?.topFavorites?.map((anime, idx) => (
                                    <div key={anime.id} className="flex items-center justify-between group/item">
                                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                            <span className="text-[10px] sm:text-xs font-black opacity-20 w-3 sm:w-4 group-hover/item:opacity-100 transition-opacity shrink-0">{idx + 1}</span>
                                            <div className="relative w-8 h-10 sm:w-10 sm:h-14 rounded overflow-hidden bg-accent shrink-0 shadow-sm transition-transform group-hover/item:scale-110">
                                                <Image src={anime.image || '/placeholder-anime.png'} alt={anime.title} fill className="object-cover" />
                                            </div>
                                            <span className="text-xs sm:text-sm font-bold truncate pr-2">{anime.title}</span>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <Badge variant="secondary" className="font-black text-[10px] bg-red-500/10 text-red-500 border-none">
                                                {anime.count} Fans
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                                {(!stats?.topFavorites || stats.topFavorites.length === 0) && (
                                    <p className="text-center text-xs text-muted-foreground py-10 italic">No data yet.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Top Manga Analytics */}
                        <Card className="shadow-md bg-card/40 backdrop-blur-md overflow-hidden">
                            <CardHeader className="bg-muted/10 pb-4">
                                <CardTitle className="text-md flex items-center gap-2 font-bold uppercase tracking-tight">
                                    <BookOpen className="w-4 h-4 text-green-500" />
                                    Top Manga Hits
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                {stats?.topMangaFavorites?.map((manga, idx) => (
                                    <div key={manga.id} className="flex items-center justify-between group/item">
                                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                            <span className="text-[10px] sm:text-xs font-black opacity-20 w-3 sm:w-4 group-hover/item:opacity-100 transition-opacity shrink-0">{idx + 1}</span>
                                            <div className="relative w-8 h-10 sm:w-10 sm:h-14 rounded overflow-hidden bg-accent shrink-0 shadow-sm transition-transform group-hover/item:scale-110">
                                                <Image src={manga.image || '/placeholder-manga.png'} alt={manga.title} fill className="object-cover" />
                                            </div>
                                            <span className="text-xs sm:text-sm font-bold truncate pr-2">{manga.title}</span>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <Badge variant="secondary" className="font-black text-[10px] bg-green-500/10 text-green-500 border-none">
                                                {manga.count} Fans
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                                {(!stats?.topMangaFavorites || stats.topMangaFavorites.length === 0) && (
                                    <p className="text-center text-xs text-muted-foreground py-10 italic">No manga data yet.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Top Users Leaderboard */}
                        <Card className="shadow-md bg-card/40 backdrop-blur-md overflow-hidden">
                            <CardHeader className="bg-muted/10 pb-4">
                                <CardTitle className="text-md flex items-center gap-2 font-bold uppercase tracking-tight">
                                    <Award className="w-4 h-4 text-yellow-500" />
                                    Top Contributors
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                {stats?.topUsers?.map((user, idx) => (
                                    <Link key={user.id} href={`/admin/users/${user.id}`} className="block group/item">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                                <span className="text-[10px] sm:text-xs font-black opacity-20 w-3 sm:w-4">{idx + 1}</span>
                                                <UserAvatar user={user} size="md" className="ring-1 ring-border group-hover:ring-primary/40 transition-all shadow-sm" />
                                                <div className="min-w-0">
                                                    <p className="text-xs sm:text-sm font-bold truncate">{user.username || 'Mysterious'}</p>
                                                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest leading-none">Lvl {user.level}</p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 ml-2">
                                                <div className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                    {user.xp} XP
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                {(!stats?.topUsers || stats.topUsers.length === 0) && (
                                    <p className="text-center text-xs text-muted-foreground py-10 italic">No rankings yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Registrations */}
                    <Card className="shadow-md bg-card/30 overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between bg-muted/20 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                                    <Users className="w-5 h-5" />
                                </div>
                                <CardTitle className="text-lg font-bold">New Registrations</CardTitle>
                            </div>
                            <Link href="/admin/users">
                                <Button variant="ghost" size="sm" className="text-xs font-black uppercase tracking-widest gap-2 opacity-60 hover:opacity-100">
                                    View All <ChevronRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 space-y-1">
                            {stats?.recentUsers?.map((user, idx) => (
                                <Link
                                    key={user.id}
                                    href={`/admin/users/${user.id}`}
                                    className="flex items-center justify-between p-2 sm:p-3 rounded-xl hover:bg-accent/40 transition-all border border-transparent hover:border-border/50 group"
                                >
                                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                                        <UserAvatar user={user} size="md" className="shadow-sm" />
                                        <div className="min-w-0">
                                            <p className="font-bold text-xs sm:text-sm truncate">{user.username || 'User'}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium truncate hidden sm:block">{user.email}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium sm:hidden">{new Date(user.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-4 ml-2">
                                        <Badge variant="outline" className="text-[8px] sm:text-[9px] font-black uppercase border-primary/20 text-primary/80 whitespace-nowrap">
                                            {user.role}
                                        </Badge>
                                        <span className="text-[10px] font-bold text-muted-foreground opacity-40 hidden sm:block whitespace-nowrap">{new Date(user.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Key Metrics & Health */}
                <div className="lg:col-span-4 space-y-8">

                    {/* Engagement Health */}
                    <Card className="border-none shadow-xl bg-gradient-to-br from-primary/10 via-background to-card border border-primary/10 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <TrendingUp className="w-16 h-16" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest opacity-60 mb-2">Success Rate</CardTitle>
                            <div className="flex items-end gap-3">
                                <h2 className="text-5xl font-black tabular-nums">{completionRate}%</h2>
                                <span className="text-xs font-bold text-green-500 pb-2 flex items-center">
                                    <Activity className="w-3 h-3 mr-1" /> Healthy
                                </span>
                            </div>
                            <CardDescription className="text-xs font-medium pt-2">Completion vs. Dropped ratio.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-0">
                            <div className="w-full bg-accent h-3 rounded-full overflow-hidden shadow-inner flex">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${completionRate}%` }}
                                    className="bg-primary h-full shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                                />
                                <div className="bg-red-500/20 h-full flex-1" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground">
                                        <CheckCircle2 className="w-3 h-3 text-primary" /> Completed
                                    </div>
                                    <p className="text-xl font-bold">{stats?.watchlistStats?.COMPLETED || 0}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground">
                                        <XCircle className="w-3 h-3 text-red-500" /> Dropped
                                    </div>
                                    <p className="text-xl font-bold">{stats?.watchlistStats?.DROPPED || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* MANGA Engagement Health */}
                    <Card className="border-none shadow-xl bg-gradient-to-br from-green-500/10 via-background to-card border border-green-500/10 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <BookOpen className="w-16 h-16" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest opacity-60 mb-2">Manga Read Rate</CardTitle>
                            <div className="flex items-end gap-3">
                                <h2 className="text-5xl font-black tabular-nums">{mangaCompletionRate}%</h2>
                                <span className="text-xs font-bold text-green-500 pb-2 flex items-center">
                                    <Activity className="w-3 h-3 mr-1" /> Healthy
                                </span>
                            </div>
                            <CardDescription className="text-xs font-medium pt-2">Completion vs. Dropped ratio.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-0">
                            <div className="w-full bg-accent h-3 rounded-full overflow-hidden shadow-inner flex">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${mangaCompletionRate}%` }}
                                    className="bg-green-500 h-full shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                                />
                                <div className="bg-red-500/20 h-full flex-1" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground">
                                        <CheckCircle2 className="w-3 h-3 text-green-500" /> Completed
                                    </div>
                                    <p className="text-xl font-bold">{stats?.mangaStats?.COMPLETED || 0}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground">
                                        <XCircle className="w-3 h-3 text-red-500" /> Dropped
                                    </div>
                                    <p className="text-xl font-bold">{stats?.mangaStats?.DROPPED || stats?.mangaStats?.DROPPED_MANGA || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Operational Reality */}
                    <Card className="shadow-md bg-background/40 backdrop-blur-sm rounded-3xl">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="text-[11px] font-black flex items-center gap-2 uppercase tracking-[0.2em] opacity-50">
                                <Database className="w-4 h-4" />
                                Database Health
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase opacity-70">
                                    <span>Sync Status</span>
                                    <span className="text-green-500">Operational</span>
                                </div>
                                <div className="flex gap-1 h-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                                        <motion.div
                                            key={i}
                                            initial={{ scaleY: 0.5 }}
                                            animate={{ scaleY: [0.5, 1, 0.5] }}
                                            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
                                            className="flex-1 bg-green-500/60 rounded-full"
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="pt-4 border-t border-border/10">
                                {['WATCHING', 'PLAN_TO_WATCH', 'ON_HOLD', 'DROPPED', 'COMPLETED'].map((status) => {
                                    const count = stats?.watchlistStats?.[status] || 0;
                                    const max = stats?.totalWatchlist || 1;
                                    const percent = (count / max) * 100;
                                    return (
                                        <Link key={status} href={`/admin/reports/anime/${status}`}>
                                            <div className="space-y-2 group/status cursor-pointer hover:opacity-80 transition-opacity mb-4">
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase opacity-70">
                                                    <span className="flex items-center gap-2">
                                                        <div className={cn("w-1.5 h-1.5 rounded-full",
                                                            status === 'WATCHING' ? "bg-green-500" :
                                                                status === 'PLAN_TO_WATCH' ? "bg-blue-500" :
                                                                    status === 'COMPLETED' ? "bg-primary" :
                                                                        status === 'DROPPED' ? "bg-red-500" : "bg-yellow-500"
                                                        )} />
                                                        {status.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="group-hover/status:text-primary transition-colors">{count}</span>
                                                </div>
                                                <div className="w-full bg-accent/40 h-1.5 rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }}
                                                        className={cn("h-full",
                                                            status === 'WATCHING' ? "bg-green-500" :
                                                                status === 'PLAN_TO_WATCH' ? "bg-blue-500" :
                                                                    status === 'COMPLETED' ? "bg-primary" :
                                                                        status === 'DROPPED' ? "bg-red-500" : "bg-yellow-500"
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                })}
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black opacity-40 uppercase">Platform Mode</span>
                                    <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-none font-black text-[9px] uppercase">Stable</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black opacity-40 uppercase">API Cache</span>
                                    <Badge className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-none font-black text-[9px] uppercase">Active</Badge>
                                </div>
                            </div>
                        </CardContent>
                        <div className="px-6 pb-6 pt-2">
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold italic justify-center opacity-60">
                                <Clock className="w-3 h-3" />
                                Updated just now
                            </div>
                        </div>
                    </Card>

                    {/* MANGA Database Health */}
                    <Card className="shadow-md bg-background/40 backdrop-blur-sm rounded-3xl">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="text-[11px] font-black flex items-center gap-2 uppercase tracking-[0.2em] opacity-50">
                                <Database className="w-4 h-4" />
                                Manga DB Health
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="pt-4 border-t border-border/10">
                                {['READING', 'PLAN_TO_READ', 'ON_HOLD', 'DROPPED', 'COMPLETED'].map((status) => {
                                    const count = stats?.mangaStats?.[status] || 0;
                                    const max = stats?.totalManga || 1;
                                    const percent = (count / max) * 100;
                                    return (
                                        <Link key={status} href={`/admin/reports/manga/${status}`}>
                                            <div className="space-y-2 group/status cursor-pointer hover:opacity-80 transition-opacity mb-4">
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase opacity-70">
                                                    <span className="flex items-center gap-2">
                                                        <div className={cn("w-1.5 h-1.5 rounded-full",
                                                            status === 'READING' ? "bg-green-500" :
                                                                status === 'PLAN_TO_READ' ? "bg-blue-500" :
                                                                    status === 'COMPLETED' ? "bg-primary" :
                                                                        status === 'DROPPED' ? "bg-red-500" : "bg-yellow-500"
                                                        )} />
                                                        {status.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="group-hover/status:text-primary transition-colors">{count}</span>
                                                </div>
                                                <div className="w-full bg-accent/40 h-1.5 rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }}
                                                        className={cn("h-full",
                                                            status === 'READING' ? "bg-green-500" :
                                                                status === 'PLAN_TO_READ' ? "bg-blue-500" :
                                                                    status === 'COMPLETED' ? "bg-primary" :
                                                                        status === 'DROPPED' ? "bg-red-500" : "bg-yellow-500"
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Config Links */}
                    <Card className="p-4 bg-primary border-none shadow-lg shadow-primary/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-20 rotate-12">
                            <ShieldCheck className="w-16 h-16" />
                        </div>
                        <h4 className="text-primary-foreground font-black text-xs uppercase tracking-widest mb-4 relative z-10">Admin Tools</h4>
                        <div className="grid gap-2 relative z-10">
                            <Button variant="secondary" size="sm" className="w-full justify-start gap-2 h-9 rounded-lg font-bold">
                                <Settings className="w-3.5 h-3.5" /> Site Global Settings
                            </Button>
                            <Button variant="secondary" size="sm" className="w-full justify-start gap-2 h-9 rounded-lg font-bold">
                                <Database className="w-3.5 h-3.5" /> Maintenance Mode
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
