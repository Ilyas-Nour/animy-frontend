'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Play, CheckCircle, Clock, BookOpen, Crown, Zap,
  TrendingUp, Sparkles, Heart, Users, Edit2, XCircle, PauseCircle, Calendar, Info
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { SocialLinks } from '@/components/profile/SocialLinks'
import { Loading } from '@/components/common/Loading'
import api from '@/lib/api'
import Image from 'next/image'
import Link from 'next/link'
import { getAvatarUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { XpBar } from '@/components/shared/XpBar'
import { XpInfoButton } from '@/components/shared/XpInfoButton'

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [badges, setBadges] = useState<any[]>([])

  // State for Friends and Schedule
  const [friends, setFriends] = useState<any[]>([])
  const [schedule, setSchedule] = useState<any[]>([])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth/login')
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // Resilient fetching - if one fails, others should still work
      try {
        const statsRes = await api.get('/users/stats').catch(e => {
          console.error('[Dashboard] Stats fetch failed:', e)
          return null
        })
        if (statsRes) setStats(statsRes.data.data)

        const badgesRes = await api.get('/users/badges').catch(e => {
          console.error('[Dashboard] Badges fetch failed:', e)
          return null
        })
        if (badgesRes) setBadges(badgesRes.data.data)

        const friendsRes = await api.get('/friends/list').catch(e => {
          console.error('[Dashboard] Friends fetch failed:', e)
          return null
        })
        if (friendsRes) setFriends(friendsRes.data.data?.friends || [])

        const scheduleRes = await api.get('/anime/schedule').catch(e => {
          console.error('[Dashboard] Schedule fetch failed:', e)
          return null
        })
        if (scheduleRes) setSchedule(scheduleRes.data.data?.data || [])

      } catch (globalError) {
        console.error('[Dashboard] Critical error during fetchData:', globalError)
      } finally {
        setLoading(false)
      }
    }
    if (isAuthenticated) fetchData()
  }, [isAuthenticated])

  if (isLoading || loading) return <Loading />

  // Helper for Initials
  const getInitials = (name: string) => name ? name.charAt(0).toUpperCase() : '?'

  return (
    <div className="min-h-screen bg-background pb-20">

      {/* --- 1. IDENTITY HEADER (Ultimate v2) --- */}
      <div className="relative w-full overflow-hidden bg-background dark:bg-[#050505] border-b border-border pb-24 pt-40 px-4 md:px-8">
        {/* Banner Background */}
        <div className="absolute inset-0 z-0">
          {user?.bannerUrl ? (
            <div className="relative w-full h-full">
              <Image
                src={getAvatarUrl(user.bannerUrl) || ''}
                alt="Profile Banner"
                fill
                className="object-cover opacity-90"
                crossOrigin="anonymous"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 dark:from-black dark:via-black/20 to-transparent" />
            </div>
          ) : (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
          )}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-8">

          {/* Avatar Section */}
          <div className="relative group">
            <div className="w-40 h-40 rounded-3xl border-4 border-background dark:border-[#1a1a1a] shadow-2xl relative z-10 bg-background dark:bg-black overflow-hidden flex items-center justify-center">
              <Avatar className="w-full h-full rounded-none">
                <AvatarImage src={getAvatarUrl(user?.avatar) || undefined} className="object-cover" crossOrigin="anonymous" />
                <AvatarFallback className="text-4xl font-black bg-muted text-foreground w-full h-full rounded-none flex items-center justify-center">
                  {getInitials(user?.firstName || user?.username || 'U')}
                </AvatarFallback>
              </Avatar>
            </div>
            {/* Level Tag floating on Avatar */}
            <div className="absolute -top-4 -right-4 bg-yellow-500 text-black font-black px-3 py-1 rounded-full text-xs uppercase tracking-widest z-20 shadow-lg shadow-yellow-500/20 rotate-6 transform group-hover:rotate-0 transition-transform">
              Level {user?.level || 1}
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h1 className="text-5xl md:text-6xl font-black text-white mix-blend-difference tracking-tighter mb-1">{user?.firstName}</h1>
              <p className="text-xl text-muted-foreground font-bold">@{user?.username}</p>
            </div>

            {/* Bio moved up to fill space left by XP bar */}
            <p className="text-muted-foreground font-medium max-w-xl italic text-lg leading-relaxed">&ldquo;{user?.bio || "No bio yet."}&rdquo;</p>

            {/* Social Links */}
            {user && <SocialLinks user={user} />}
          </div>

          {/* Actions Section */}
          <div className="flex flex-col gap-3">
            <Link href="/dashboard/profile">
              <Button variant="outline" className="h-12 px-8 border-border bg-secondary/50 hover:bg-secondary text-foreground gap-2 rounded-xl">
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto mt-12 px-4 relative z-20 space-y-12">

        {/* --- 2. PROGRESSION SECTION --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card/40 backdrop-blur-xl border border-white/5 overflow-hidden shadow-2xl shadow-blue-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight">
                <Zap className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                Level Progression
                <XpInfoButton />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="flex flex-col md:flex-row gap-8 md:items-center">
                {/* XP Bar */}
                <div className="flex-1">
                  <XpBar
                    level={user?.level || 1}
                    currentXp={user?.xp || 0}
                    requiredXp={user?.nextLevelXp || 1000}
                    rank={user?.rank || 'Initiate'}
                    size="lg"
                  />
                </div>

                {/* Rank Badge / Info */}
                <div className="shrink-0 flex items-center gap-4 bg-secondary/30 backdrop-blur-md p-4 rounded-3xl border border-white/5 group transition-all hover:bg-secondary/50">
                  <div className="h-14 w-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-3xl shadow-lg shadow-yellow-500/10 group-hover:scale-110 transition-transform">
                    <Crown className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Current Rank</p>
                    <p className="text-xl font-black text-foreground group-hover:text-primary transition-colors">{user?.rank || 'Initiate'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* --- 2. STAT SHARDS (Anime) --- */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-black text-foreground tracking-tight">Anime Progress</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Link href="/dashboard/watching" className="group">
              <div className="bg-card dark:bg-[#111] border border-border p-5 rounded-2xl hover:-translate-y-1 transition-transform duration-300 shadow-xl shadow-blue-500/5 flex items-center justify-between">
                <div>
                  <span className="block text-2xl font-black text-foreground group-hover:text-blue-400 transition-colors">{stats?.watching ?? 0}</span>
                  <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Watching</span>
                </div>
                <Play className="w-5 h-5 text-blue-500 opacity-50 group-hover:opacity-100" />
              </div>
            </Link>

            <Link href="/dashboard/completed" className="group">
              <div className="bg-card dark:bg-[#111] border border-border p-5 rounded-2xl hover:-translate-y-1 transition-transform duration-300 shadow-xl shadow-green-500/5 flex items-center justify-between">
                <div>
                  <span className="block text-2xl font-black text-foreground group-hover:text-green-400 transition-colors">{stats?.completed ?? 0}</span>
                  <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Completed</span>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500 opacity-50 group-hover:opacity-100" />
              </div>
            </Link>

            <Link href="/dashboard/plan-to-watch" className="group">
              <div className="bg-card dark:bg-[#111] border border-border p-5 rounded-2xl hover:-translate-y-1 transition-transform duration-300 shadow-xl shadow-yellow-500/5 flex items-center justify-between">
                <div>
                  <span className="block text-2xl font-black text-foreground group-hover:text-yellow-400 transition-colors">{stats?.planToWatch || 0}</span>
                  <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Planned</span>
                </div>
                <Clock className="w-5 h-5 text-yellow-500 opacity-50 group-hover:opacity-100" />
              </div>
            </Link>

            <Link href="/dashboard/on-hold" className="group">
              <div className="bg-card dark:bg-[#111] border border-border p-5 rounded-2xl hover:-translate-y-1 transition-transform duration-300 shadow-xl shadow-orange-500/5 flex items-center justify-between">
                <div>
                  <span className="block text-2xl font-black text-foreground group-hover:text-orange-400 transition-colors">{stats?.onHold || 0}</span>
                  <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">On Hold</span>
                </div>
                <PauseCircle className="w-5 h-5 text-orange-500 opacity-50 group-hover:opacity-100" />
              </div>
            </Link>

            <Link href="/dashboard/dropped" className="group">
              <div className="bg-card dark:bg-[#111] border border-border p-5 rounded-2xl hover:-translate-y-1 transition-transform duration-300 shadow-xl shadow-red-500/5 flex items-center justify-between">
                <div>
                  <span className="block text-2xl font-black text-foreground group-hover:text-red-400 transition-colors">{stats?.dropped || 0}</span>
                  <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Dropped</span>
                </div>
                <XCircle className="w-5 h-5 text-red-500 opacity-50 group-hover:opacity-100" />
              </div>
            </Link>
          </div>
        </div>

        {/* --- 2.5 STAT SHARDS (Manga) --- */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-black text-foreground tracking-tight">Manga Progress</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Link href="/dashboard/manga/reading" className="group">
              <div className="bg-card dark:bg-[#111] border border-border p-5 rounded-2xl hover:-translate-y-1 transition-transform duration-300 shadow-xl shadow-purple-500/5 flex items-center justify-between">
                <div>
                  <span className="block text-2xl font-black text-foreground group-hover:text-purple-400 transition-colors">{stats?.reading ?? 0}</span>
                  <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Reading</span>
                </div>
                <BookOpen className="w-5 h-5 text-purple-500 opacity-50 group-hover:opacity-100" />
              </div>
            </Link>

            <Link href="/dashboard/manga/completed" className="group">
              <div className="bg-card dark:bg-[#111] border border-border p-5 rounded-2xl hover:-translate-y-1 transition-transform duration-300 shadow-xl shadow-emerald-500/5 flex items-center justify-between">
                <div>
                  <span className="block text-2xl font-black text-foreground group-hover:text-emerald-400 transition-colors">{stats?.completedManga ?? 0}</span>
                  <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Completed</span>
                </div>
                <CheckCircle className="w-5 h-5 text-emerald-500 opacity-50 group-hover:opacity-100" />
              </div>
            </Link>

            <Link href="/dashboard/manga/plan-to-read" className="group">
              <div className="bg-card dark:bg-[#111] border border-border p-5 rounded-2xl hover:-translate-y-1 transition-transform duration-300 shadow-xl shadow-indigo-500/5 flex items-center justify-between">
                <div>
                  <span className="block text-2xl font-black text-foreground group-hover:text-indigo-400 transition-colors">{stats?.planToRead || 0}</span>
                  <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Planned</span>
                </div>
                <Clock className="w-5 h-5 text-indigo-500 opacity-50 group-hover:opacity-100" />
              </div>
            </Link>

            <Link href="/dashboard/manga/on-hold" className="group">
              <div className="bg-card dark:bg-[#111] border border-border p-5 rounded-2xl hover:-translate-y-1 transition-transform duration-300 shadow-xl shadow-orange-500/5 flex items-center justify-between">
                <div>
                  <span className="block text-2xl font-black text-foreground group-hover:text-orange-400 transition-colors">{stats?.onHoldManga || 0}</span>
                  <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">On Hold</span>
                </div>
                <PauseCircle className="w-5 h-5 text-orange-500 opacity-50 group-hover:opacity-100" />
              </div>
            </Link>

            <Link href="/dashboard/manga/dropped" className="group">
              <div className="bg-card dark:bg-[#111] border border-border p-5 rounded-2xl hover:-translate-y-1 transition-transform duration-300 shadow-xl shadow-rose-500/5 flex items-center justify-between">
                <div>
                  <span className="block text-2xl font-black text-foreground group-hover:text-rose-400 transition-colors">{stats?.droppedManga || 0}</span>
                  <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Dropped</span>
                </div>
                <XCircle className="w-5 h-5 text-rose-500 opacity-50 group-hover:opacity-100" />
              </div>
            </Link>
          </div>
        </div>

        {/* --- 3. MASONRY CONTENT GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Identity Spectrum (Relocated) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card dark:bg-[#0a0a0a] border border-border rounded-3xl p-6 relative overflow-hidden group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground">Identity Spectrum</h3>
                    <p className="text-[10px] text-muted-foreground font-black tracking-widest uppercase">Resonance</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 relative z-10">
                {user?.interests && user.interests.length > 0 ? (
                  user.interests.map((interest: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-pink-500/50 hover:bg-pink-500/10 transition-all"
                    >
                      #{interest}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground italic">No resonance detected...</span>
                )}
              </div>
            </div>

            <div className="relative z-10 mt-6">
              <Link href="/discovery">
                <Button variant="outline" className="w-full text-[10px] font-black uppercase tracking-widest border-border hover:bg-primary/10 hover:text-primary transition-all">
                  Refine Identity
                </Button>
              </Link>
            </div>

            {/* Decorative refraction */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-pink-500/10 rounded-full blur-[40px] group-hover:bg-pink-500/20 transition-colors duration-500" />
          </motion.div>

          {/* Left Box: FRIENDS LIST (Small) */}
          <div className="bg-card dark:bg-[#0a0a0a] border border-border rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Friends
              </h3>
              <Link href="/dashboard/friends" className="text-xs text-indigo-400 hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {friends.length > 0 ? friends.slice(0, 4).map((friend) => (
                <Link key={friend.id} href={`/users/${friend.username}`} className="flex items-center gap-3 p-2 hover:bg-secondary/50 rounded-2xl transition-all group">
                  <div className="w-10 h-10 rounded-full border border-border overflow-hidden relative bg-muted flex items-center justify-center group-hover:border-indigo-500/50 transition-colors">
                    {friend.avatar ? (
                      <Image
                        src={getAvatarUrl(friend.avatar) || ''}
                        alt={friend.username || 'User'}
                        fill
                        className="object-cover"
                        crossOrigin="anonymous"
                        unoptimized
                      />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">{getInitials(friend.firstName || friend.username)}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-bold block text-foreground group-hover:text-indigo-400 transition-colors">{friend.firstName || friend.username}</span>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Friend</span>
                  </div>
                </Link>
              )) : (
                <div className="py-8 text-center bg-card dark:bg-white/5 rounded-2xl border border-dashed border-border">
                  <p className="text-xs text-muted-foreground italic font-medium">No friends found.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Box: CUSTOM (Favorites Preview) */}
          <div className="bg-card dark:bg-[#0a0a0a] border border-border rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-pink-500/5 group-hover:bg-pink-500/10 transition-colors" />
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  Favorites
                </h3>
                <Link href="/dashboard/favorites">
                  <ArrowUpRightIcon />
                </Link>
              </div>
              <div className="text-center py-6">
                <span className="text-5xl font-black text-foreground block mb-2">{stats?.totalFavorites || 0}</span>
                <span className="text-xs uppercase font-bold text-pink-500 dark:text-pink-300">Items Liked</span>
              </div>
              <Link href="/dashboard/favorites">
                <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white rounded-xl">View Collection</Button>
              </Link>
            </div>
          </div>

          {/* Right Box: CUSTOM (Anime Calendar / News) */}
          <div className="bg-card dark:bg-[#0a0a0a] border border-border rounded-3xl p-6 relative overflow-hidden">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-cyan-500" />
              Upcoming
            </h3>
            <div className="space-y-4">
              {schedule.length > 0 ? schedule.slice(0, 3).map((anime) => {
                const airDate = anime.aired?.from ? new Date(anime.aired.from) : new Date();
                const day = airDate.getDate();
                const dayStr = airDate.toLocaleDateString('en-US', { weekday: 'short' });

                return (
                  <Link key={anime.mal_id} href={`/anime/${anime.mal_id}`} className="flex gap-4 items-center group/item p-2 hover:bg-accent rounded-2xl transition-colors">
                    <div className="w-12 h-12 bg-secondary/50 dark:bg-white/5 rounded-xl flex flex-col items-center justify-center border border-border group-hover/item:border-cyan-500/50 transition-colors">
                      <span className="text-[10px] uppercase text-muted-foreground font-bold">{dayStr}</span>
                      <span className="text-lg font-black text-foreground">{day < 10 ? `0${day}` : day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-sm font-bold text-foreground truncate group-hover/item:text-cyan-500 transition-colors">{anime.title}</span>
                      <span className="text-xs text-muted-foreground block flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Airing Now
                      </span>
                    </div>
                  </Link>
                )
              }) : (
                <div className="py-8 text-center bg-card dark:bg-white/5 rounded-2xl border border-dashed border-border">
                  <p className="text-xs text-muted-foreground italic font-medium">No schedule available.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* --- 4. TROPHY CASE (Full Width) --- */}
        <div className="bg-gradient-to-r from-card to-background dark:from-[#111] dark:to-black border border-border rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-3xl">
              🏆
            </div>
            <div>
              <h3 className="text-2xl font-black text-foreground">Trophy Case</h3>
              <p className="text-muted-foreground">Showcase your achievements to the community</p>
            </div>
          </div>

          <div className="flex gap-2">
            {badges.length > 0 ? badges.slice(0, 5).map((b, i) => (
              <div key={i} className="w-12 h-12 bg-secondary dark:bg-white/5 rounded-xl border border-border flex items-center justify-center" title={b.name}>
                <span>🏅</span>
              </div>
            )) : (
              <span className="text-sm text-muted-foreground italic">No trophies earned yet.</span>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}

function ArrowUpRightIcon() {
  return (
    <svg className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
    </svg>
  )
}
