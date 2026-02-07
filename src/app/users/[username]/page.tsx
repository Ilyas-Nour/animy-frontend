'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
    UserPlus,
    UserCheck,
    UserX,
    MessageSquare,
    BarChart3,
    Heart,
    PlayCircle,
    CheckCircle,
    Clock,
    PauseCircle,
    XCircle,
    Lock,
    BookOpen,
    BookHeart,
    Share2,
    UserMinus,
    Users
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { Loading } from '@/components/common/Loading'
import { ShareModal } from '@/components/common/ShareModal'
import { getAvatarUrl } from '@/lib/utils'
import { toast } from 'sonner'
import { XpBar } from '@/components/shared/XpBar'
import { XpInfoButton } from '@/components/shared/XpInfoButton'
import { BadgeGrid } from '@/components/shared/BadgeGrid'

export default function UserProfilePage() {
    const params = useParams()
    const { user: currentUser, isAuthenticated } = useAuth()
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [actionLoading, setActionLoading] = useState(false)

    const username = params.username as string

    const fetchProfile = async () => {
        try {
            setLoading(true)
            const res = await api.get(`/users/${username}`)
            setProfile(res.data.data)
        } catch (err: any) {
            console.error(err)
            setError(err.response?.data?.message || 'Failed to load profile')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (username) fetchProfile()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username, isAuthenticated])

    const handleUnfriend = async () => {
        if (!confirm(`Are you sure you want to remove @${user.username} from your friends?`)) return

        try {
            setActionLoading(true)
            await api.post('/friends/remove', { friendId: user.id })
            toast.success('Friend removed')
            fetchProfile()
        } catch (err) {
            console.error(err)
            toast.error('Failed to remove friend')
        } finally {
            setActionLoading(false)
        }
    }

    const handleFriendAction = async (action: 'request' | 'accept' | 'reject') => {
        try {
            setActionLoading(true)
            if (action === 'request') {
                await api.post('/friends/request', { username })
                toast.success('Friend request sent!')
            } else if (action === 'accept') {
                // Request ID handling as discussed
            }
            fetchProfile()
        } catch (err) {
            console.error(err)
            toast.error('Action failed')
        } finally {
            setActionLoading(false)
        }
    }

    if (loading) return <Loading />
    if (error) return (
        <div className="container py-20 text-center">
            <h2 className="text-2xl font-bold text-red-500">Error</h2>
            <p className="text-muted-foreground">{error}</p>
            <Link href="/dashboard"><Button variant="link">Return to Dashboard</Button></Link>
        </div>
    )
    if (!profile) return null

    // Destructure profile data
    const { user, stats, favorites, favoriteManga, badges, isFriend, friendshipStatus } = profile
    const isSelf = friendshipStatus === 'SELF'

    // Render Friend Action Button
    const renderActionButton = () => {
        if (!isAuthenticated) return (
            <Link href={`/auth/login?redirect=/users/${username}`}>
                <Button>Login to Connect</Button>
            </Link>
        )
        if (isSelf) return (
            <Link href="/dashboard/profile">
                <Button variant="outline">Edit Profile</Button>
            </Link>
        )

        switch (friendshipStatus) {
            case 'ACCEPTED':
                return (
                    <Button variant="secondary" disabled className="gap-2">
                        <UserCheck className="h-4 w-4" /> Friend
                    </Button>
                )
            case 'PENDING':
                return (
                    <Button variant="outline" disabled className="gap-2">
                        <Clock className="h-4 w-4" /> Request Pending
                    </Button>
                )
            case 'REJECTED':
                return <Button variant="outline" disabled>Unavailable</Button>
            default:
                return (
                    <Button onClick={() => handleFriendAction('request')} disabled={actionLoading} className="gap-2">
                        <UserPlus className="h-4 w-4" /> Add Friend
                    </Button>
                )
        }
    }

    return (
        <div className="min-h-screen pb-24 md:pb-12 bg-background">
            {/* Hero Section / Cinematic Header */}
            <div className="relative h-[300px] md:h-[450px] w-full overflow-hidden">
                {/* Blurred Background Layer */}
                <div className="absolute inset-0 z-0">
                    {user.bannerUrl || user.avatar ? (
                        <Image
                            src={getAvatarUrl(user.bannerUrl || user.avatar)!}
                            alt="Banner"
                            fill
                            className="object-cover blur-3xl opacity-40 scale-110"
                            priority
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-30" />
                    )}
                </div>

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
                <div className="absolute inset-0 bg-black/20 z-10" />

                {/* Banner Content (Optional sharp image if banner exists) */}
                {user.bannerUrl && (
                    <div className="absolute inset-0 z-0 opacity-60">
                        <Image
                            src={getAvatarUrl(user.bannerUrl)!}
                            alt="Banner"
                            fill
                            className="object-cover"
                            sizes="100vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                    </div>
                )}

                {/* Centered Avatar and Info for Mobile */}
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-8 w-full px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative"
                    >
                        <div className="h-32 w-32 md:h-48 md:w-48 rounded-full border-4 border-background bg-secondary shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
                            {user.avatar ? (
                                <Image src={getAvatarUrl(user.avatar)!} alt={user.username} fill className="object-cover" sizes="(max-width: 768px) 128px, 192px" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl font-bold">
                                    {user.username[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        {/* Status Badge - Show if active today */}
                        {user.lastCheckIn && new Date(user.lastCheckIn).toDateString() === new Date().toDateString() && (
                            <div className="absolute bottom-2 right-2 h-6 w-6 rounded-full bg-green-500 border-4 border-background shadow-sm" title="Online Today" />
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-center mt-6 space-y-2"
                    >
                        <h1 className="text-3xl md:text-6xl font-black text-white drop-shadow-2xl">
                            {user.firstName} {user.lastName}
                        </h1>
                        <p className="text-lg md:text-xl text-white/80 font-medium drop-shadow-md">
                            @{user.username}
                        </p>

                    </motion.div>

                    {/* Desktop Only Actions in Header */}
                    <div className="hidden md:flex items-center gap-3 mt-6">
                        {renderActionButton()}

                        {isFriend && (
                            <>
                                <Link href={`/chat?friendId=${user.id}`}>
                                    <Button variant="outline" className="gap-2 bg-background/50 backdrop-blur-md border-white/10 h-11 px-6 rounded-2xl font-bold">
                                        <MessageSquare className="h-4 w-4" /> Message
                                    </Button>
                                </Link>

                                <ShareModal
                                    title={`${user.firstName} ${user.lastName}`}
                                    description={`Check out @${user.username} on Animy!`}
                                    image={getAvatarUrl(user.avatar) || undefined}
                                    type="PROFILE"
                                    id={user.id}
                                    path={`/users/${user.username}`}
                                    trigger={
                                        <Button variant="outline" className="gap-2 bg-background/50 backdrop-blur-md border-white/10 h-11 px-6 rounded-2xl font-bold">
                                            <Share2 className="h-4 w-4" /> Share
                                        </Button>
                                    }
                                />

                                <Button
                                    variant="destructive"
                                    className="gap-2 h-11 px-6 rounded-2xl font-bold"
                                    onClick={handleUnfriend}
                                    disabled={actionLoading}
                                >
                                    <UserMinus className="h-4 w-4" /> Unfriend
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="container relative z-30 space-y-12">
                {/* Bio Section - Glassmorphic Card */}
                {user.bio && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-3xl mx-auto -mt-4"
                    >
                        <div className="bg-card/40 backdrop-blur-xl border border-white/5 p-6 md:p-8 rounded-3xl text-center shadow-2xl">
                            <p className="text-muted-foreground md:text-foreground text-lg leading-relaxed">
                                {user.bio}
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Identity Spectrum */}
                {user.interests && user.interests.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.22 }}
                        className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 relative overflow-hidden group max-w-3xl mx-auto"
                    >
                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-foreground">Identity Spectrum</h3>
                                <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase">Kindred Spirits</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 relative z-10">
                            {user.interests.map((interest: string, i: number) => (
                                <span
                                    key={i}
                                    className="px-3 py-1.5 rounded-lg bg-secondary/50 border border-white/5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-colors cursor-default"
                                >
                                    #{interest}
                                </span>
                            ))}
                        </div>
                        {/* Decorative refraction */}
                        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-[50px] group-hover:bg-cyan-500/20 transition-colors duration-500" />
                    </motion.div>
                )}

                {/* Progression Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <Card className="bg-card/40 backdrop-blur-xl border border-white/5 overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <span className="text-2xl">⚡</span> Level Progression
                                <XpInfoButton />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-2">
                            <div className="flex flex-col md:flex-row gap-6 md:items-center">
                                {/* XP Bar */}
                                <div className="flex-1">
                                    <XpBar
                                        level={user.level || 1}
                                        currentXp={user.xp || 0}
                                        requiredXp={user.nextLevelXp || Math.floor(1000 * Math.pow(user.level || 1, 1.8))}
                                        rank={user.rank}
                                        size="lg"
                                    />
                                </div>

                                {/* Rank Badge / Info */}
                                <div className="shrink-0 flex items-center gap-4 bg-secondary/50 p-3 rounded-2xl border border-white/5">
                                    <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl">
                                        🏆
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase text-muted-foreground">Current Rank</p>
                                        <p className="text-lg font-black text-primary">{user.rank || 'Initiate'}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Content visibility check */}
                {isFriend || isSelf ? (
                    <div className="space-y-16">
                        {/* Stats Sections */}
                        {stats && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="space-y-12"
                            >
                                {/* Anime Stats */}
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                                            <PlayCircle className="h-6 w-6 text-primary" />
                                        </div>
                                        <h2 className="text-2xl font-black uppercase tracking-tight">Anime Journey</h2>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                                        {[
                                            { label: 'Total', value: stats.totalWatchlist, icon: BarChart3, color: 'text-primary', bg: 'bg-primary/5' },
                                            { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/5' },
                                            { label: 'Watching', value: stats.watching, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/5' },
                                            { label: 'Favorites', value: stats.totalFavorites, icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/5' },
                                        ].map((item, idx) => (
                                            <Card key={idx} className={`${item.bg} border-white/5 backdrop-blur-sm rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform`}>
                                                <CardHeader className="pb-1 p-4 md:p-6 flex flex-row items-center justify-between">
                                                    <CardTitle className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">{item.label}</CardTitle>
                                                    <item.icon className={`h-4 w-4 md:h-5 md:w-5 ${item.color} opacity-60`} />
                                                </CardHeader>
                                                <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
                                                    <div className="text-2xl md:text-3xl font-black">{item.value}</div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </section>

                                {/* Manga Stats */}
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                                            <BookOpen className="h-6 w-6 text-orange-500" />
                                        </div>
                                        <h2 className="text-2xl font-black uppercase tracking-tight">Manga Legend</h2>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                                        {[
                                            { label: 'Total', value: stats.totalMangaList || 0, icon: BarChart3, color: 'text-orange-500', bg: 'bg-orange-500/5' },
                                            { label: 'Completed', value: stats.completedManga || 0, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/5' },
                                            { label: 'Reading', value: stats.reading || 0, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/5' },
                                            { label: 'Favorites', value: stats.totalFavoriteManga || 0, icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/5' },
                                        ].map((item, idx) => (
                                            <Card key={idx} className={`${item.bg} border-white/5 backdrop-blur-sm rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform`}>
                                                <CardHeader className="pb-1 p-4 md:p-6 flex flex-row items-center justify-between">
                                                    <CardTitle className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">{item.label}</CardTitle>
                                                    <item.icon className={`h-4 w-4 md:h-5 md:w-5 ${item.color} opacity-60`} />
                                                </CardHeader>
                                                <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
                                                    <div className="text-2xl md:text-3xl font-black">{item.value}</div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {/* Badges Section */}
                        {badges && badges.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <BadgeGrid badges={badges} />
                            </motion.div>
                        )}

                        {/* Favorites Sections */}
                        <div className="space-y-16">
                            {favorites && favorites.length > 0 && (
                                <section className="space-y-6">
                                    <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
                                        <Heart className="h-6 w-6 text-pink-500" /> Favorite Anime
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                        {favorites.map((fav: any) => (
                                            <Link key={fav.animeId} href={`/anime/${fav.animeId}`}>
                                                <div className="group relative aspect-[2/3] rounded-2xl overflow-hidden bg-muted shadow-lg hover:shadow-primary/20 transition-all border border-white/5">
                                                    {fav.animeImage ? (
                                                        <Image src={fav.animeImage} alt={fav.animeTitle} fill className="object-cover transition-transform group-hover:scale-110 duration-500" sizes="(max-width: 768px) 50vw, 20vw" />
                                                    ) : (
                                                        <div className="flex items-center justify-center w-full h-full text-muted-foreground">No Image</div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                                        <p className="text-white font-bold text-sm line-clamp-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">{fav.animeTitle}</p>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {favoriteManga && favoriteManga.length > 0 && (
                                <section className="space-y-6">
                                    <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
                                        <BookHeart className="h-6 w-6 text-pink-500" /> Favorite Manga
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                        {favoriteManga.map((fav: any) => (
                                            <Link key={fav.mangaId} href={`/manga/${fav.mangaId}`}>
                                                <div className="group relative aspect-[2/3] rounded-2xl overflow-hidden bg-muted shadow-lg hover:shadow-primary/20 transition-all border border-white/5">
                                                    {fav.mangaImage ? (
                                                        <Image src={fav.mangaImage} alt={fav.mangaTitle} fill className="object-cover transition-transform group-hover:scale-110 duration-500" sizes="(max-width: 768px) 50vw, 20vw" />
                                                    ) : (
                                                        <div className="flex items-center justify-center w-full h-full text-muted-foreground">No Image</div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                                        <p className="text-white font-bold text-sm line-clamp-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">{fav.mangaTitle}</p>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Empty States */}
                        {(!stats || (stats.totalWatchlist === 0 && stats.totalMangaList === 0)) && (
                            <Card className="py-20 text-center bg-card/50 backdrop-blur-xl border-white/5 rounded-3xl">
                                <p className="text-xl text-muted-foreground">This user hasn&apos;t added any anime or manga yet.</p>
                            </Card>
                        )}
                    </div>
                ) : (
                    /* Private Profile View */
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20 text-center bg-card/30 backdrop-blur-xl border border-white/5 rounded-[3rem]"
                    >
                        <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                            <Lock className="h-10 w-10 text-primary" />
                        </div>
                        <h2 className="text-3xl font-black">This Profile is Secret</h2>
                        <p className="text-muted-foreground max-w-md mt-4 text-lg">
                            {isAuthenticated
                                ? "Become friends with this user to unlock their full anime journey and manga legends."
                                : "Login and connect with this user to see what they're watching!"}
                        </p>
                        {!isAuthenticated && (
                            <Link href="/auth/login" className="mt-8">
                                <Button size="lg" className="rounded-2xl px-8 h-12 font-bold">Sign In to Animy</Button>
                            </Link>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Sticky Mobile Actions */}
            <div className="md:hidden fixed bottom-24 left-6 right-6 z-50">
                <div className="bg-background/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-3 flex gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="flex-1">
                        {renderActionButton()}
                    </div>
                    {isFriend && (
                        <div className="flex-1 flex gap-2">
                            <Link href={`/chat?friendId=${user.id}`} className="flex-1">
                                <Button className="w-full h-11 rounded-2xl gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 font-bold">
                                    <MessageSquare className="h-4 w-4" />
                                </Button>
                            </Link>
                            <ShareModal
                                title={`${user.firstName} ${user.lastName}`}
                                description={`Check out @${user.username} on AnimeHub!`}
                                image={getAvatarUrl(user.avatar) || undefined}
                                type="PROFILE"
                                id={user.id}
                                path={`/users/${user.username}`}
                                trigger={
                                    <Button variant="outline" className="flex-1 h-11 rounded-2xl gap-2 border-white/10 font-bold">
                                        <Share2 className="h-4 w-4" />
                                    </Button>
                                }
                            />
                            <Button
                                variant="destructive"
                                className="flex-1 h-11 rounded-2xl gap-2 font-bold"
                                onClick={handleUnfriend}
                                disabled={actionLoading}
                            >
                                <UserMinus className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
