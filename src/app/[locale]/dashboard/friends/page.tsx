'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
    UserPlus,
    Users,
    Check,
    X,
    Search,
    Send,
    Loader2,
    MessageCircle,
    UserMinus,
    ExternalLink,
    Share2,
    MoreVertical,
    Sparkles
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import api from '@/lib/api'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getAvatarUrl, cn } from '@/lib/utils'

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

export default function FriendsPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'add'>('friends')
    const [friends, setFriends] = useState<any[]>([])
    const [incomingRequests, setIncomingRequests] = useState<any[]>([])
    const [outgoingRequests, setOutgoingRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Search state
    const [searchUsername, setSearchUsername] = useState('')
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchFeedback, setSearchFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)
    const { onlineUsers, socket } = useSocket()

    // Share Dialog State
    const [shareTarget, setShareTarget] = useState<any>(null)
    const [isShareOpen, setIsShareOpen] = useState(false)
    const [shareMode, setShareMode] = useState<'MENU' | 'SELECT'>('MENU')

    const fetchData = async () => {
        try {
            setLoading(true)
            const res = await api.get('/friends/list')
            setFriends(res.data.data.friends)
            setIncomingRequests(res.data.data.incomingRequests)
            setOutgoingRequests(res.data.data.outgoingRequests)
        } catch (error) {
            console.error('Failed to fetch friends:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleSendRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchUsername.trim()) return

        try {
            setSearchLoading(true)
            setSearchFeedback(null)
            await api.post('/friends/request', { username: searchUsername })
            setSearchFeedback({ type: 'success', message: 'Friend request sent!' })
            setSearchUsername('')
            fetchData() // Refresh lists
        } catch (error: any) {
            // Check specific error messages
            const msg = error.response?.data?.message || 'Failed to send request'
            const isUserNotFoundError = msg.toLowerCase().includes('not found')

            setSearchFeedback({
                type: 'error',
                message: isUserNotFoundError
                    ? 'Invalid username, or there is no one with this username.'
                    : msg
            })
        } finally {
            setSearchLoading(false)
        }
    }

    const handleAccept = async (requestId: string) => {
        try {
            await api.post('/friends/accept', { requestId })
            toast.success('Friend request accepted!')
            fetchData()
        } catch (error) {
            toast.error('Failed to accept request')
        }
    }

    const handleReject = async (requestId: string) => {
        try {
            await api.post('/friends/reject', { requestId })
            fetchData()
        } catch (error) {
            toast.error('Failed to reject request')
        }
    }

    const handleRemoveFriend = async (friendId: string, username: string) => {
        if (!confirm(`Are you sure you want to remove ${username} as a friend?`)) {
            return
        }

        try {
            await api.post('/friends/remove', { friendId })
            toast.success(`Removed ${username} from friends`)
            fetchData()
        } catch (error) {
            toast.error('Failed to remove friend')
        }
    }

    const openShareDialog = (friend: any) => {
        setShareTarget(friend)
        setShareMode('MENU')
        setIsShareOpen(true)
    }

    const handleCopyLink = () => {
        if (!shareTarget) return
        const url = `${window.location.origin}/users/${shareTarget.username}`
        navigator.clipboard.writeText(url)
        toast.success('Profile link copied!')
        setIsShareOpen(false)
    }

    const handleSendToFriend = (targetFriendId: string) => {
        if (!shareTarget || !socket) return

        socket.emit('message:send', {
            to: targetFriendId,
            content: `Check out ${shareTarget.username}'s profile`,
            type: 'MEDIA_CARD',
            mediaId: shareTarget.username,
            mediaType: 'PROFILE',
            mediaTitle: shareTarget.username,
            mediaImage: getAvatarUrl(shareTarget.avatar)
        })

        toast.success('Sent to friend!')
        setIsShareOpen(false)
    }

    // Filter available friends to send to (exclude the person being shared)
    const availableFriendsToShareWith = friends.filter(f => f.id !== shareTarget?.id)

    const tabs = [
        { id: 'friends', label: 'Friends', icon: Users, count: friends.length },
        { id: 'requests', label: 'Requests', icon: UserPlus, count: incomingRequests.length, badge: incomingRequests.length > 0 },
        { id: 'add', label: 'Add Friend', icon: Sparkles, count: 0 }
    ]

    return (
        <div className="container py-8 space-y-8 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
                        Social Circle
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Connect with fellow anime enthusiasts.
                    </p>
                </div>

                {/* Animated Pill Tabs */}
                <div className="bg-muted/50 p-1.5 rounded-full flex gap-1 backdrop-blur-sm border border-border/50 w-full md:w-auto overflow-x-auto md:overflow-visible no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "relative px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-2 z-10 flex-1 md:flex-none whitespace-nowrap",
                                activeTab === tab.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-primary rounded-full -z-10 shadow-lg shadow-primary/25"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <tab.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span>{tab.label}</span>
                            {tab.badge && (
                                <span className={cn(
                                    "ml-1 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full text-[9px] md:text-[10px] font-bold",
                                    activeTab === tab.id ? "bg-white text-primary" : "bg-primary text-white"
                                )}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'friends' && (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        >
                            {loading ? (
                                <div className="col-span-full flex flex-col items-center justify-center py-24 space-y-4">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                    <p className="text-muted-foreground animate-pulse">Summoning friends...</p>
                                </div>
                            ) : friends.length === 0 ? (
                                <motion.div variants={itemVariants} className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 border-dashed border-2 border-border/50 rounded-xl">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center">
                                            <Users className="h-10 w-10 opacity-20" />
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold text-foreground">A bit query here...</p>
                                            <p className="text-sm mt-1">Use the &quot;Add Friend&quot; tab to invite someone!</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                friends.map((friend) => (
                                    <motion.div variants={itemVariants} key={friend.id} className="group relative">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-2xl opacity-0 group-hover:opacity-75 blur transition duration-500" />
                                        <div
                                            onClick={() => router.push(`/users/${friend.username}`)}
                                            className="relative h-full bg-card border border-border/50 rounded-xl p-3 md:p-6 flex flex-row md:flex-col items-center md:items-center text-left md:text-center hover:shadow-xl transition-all duration-300 gap-3 md:gap-0 cursor-pointer"
                                        >
                                            {/* Avatar with Status Ring */}
                                            <div className="relative md:mb-4 shrink-0">
                                                <div className="h-12 w-12 md:h-24 md:w-24 rounded-full p-[2px] md:p-[3px] bg-gradient-to-br from-primary/50 to-purple-500/50">
                                                    <div className="h-full w-full rounded-full overflow-hidden border-2 md:border-4 border-card relative bg-muted">
                                                        {friend.avatar ? (
                                                            <Image src={getAvatarUrl(friend.avatar)!} alt={friend.username} fill className="object-cover" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg md:text-2xl">
                                                                {(friend.firstName?.[0] || 'U').toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div
                                                    className={cn(
                                                        "absolute bottom-0 right-0 md:bottom-1 md:right-1 h-3 w-3 md:h-5 md:w-5 border-2 md:border-4 border-card rounded-full",
                                                        onlineUsers.has(friend.id) ? "bg-green-500" : "bg-gray-400"
                                                    )}
                                                    title={onlineUsers.has(friend.id) ? "Online" : "Offline"}
                                                />
                                            </div>

                                            <div className="flex-1 min-w-0 md:w-full md:mb-4">
                                                <h3 className="font-bold text-base md:text-lg truncate w-full">{friend.firstName} {friend.lastName}</h3>
                                                <p className="text-xs md:text-sm text-muted-foreground truncate">@{friend.username}</p>
                                            </div>

                                            {/* Mobile Actions (Icon Row) */}
                                            <div className="flex md:hidden gap-1 shrink-0">
                                                <Link href={`/chat?friendId=${friend.id}`} onClick={(e) => e.stopPropagation()}>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10 rounded-full">
                                                        <MessageCircle className="h-5 w-5" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        openShareDialog(friend)
                                                    }}
                                                >
                                                    <Share2 className="h-5 w-5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleRemoveFriend(friend.id, friend.username)
                                                    }}
                                                >
                                                    <UserMinus className="h-5 w-5" />
                                                </Button>
                                            </div>

                                            {/* Desktop Actions (Grid) */}
                                            <div className="hidden md:grid grid-cols-2 gap-2 w-full mt-auto">
                                                <Link href={`/chat?friendId=${friend.id}`} className="w-full" onClick={(e) => e.stopPropagation()}>
                                                    <Button className="w-full gap-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white border-0" variant="outline" size="sm">
                                                        <MessageCircle className="h-4 w-4" /> Message
                                                    </Button>
                                                </Link>

                                                <div className="flex gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="flex-1 rounded-lg hover:bg-accent"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openShareDialog(friend)
                                                        }}
                                                    >
                                                        <Share2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="flex-1 rounded-lg text-destructive hover:bg-destructive/10"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleRemoveFriend(friend.id, friend.username)
                                                        }}
                                                    >
                                                        <UserMinus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'requests' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Incoming Column */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-2 mb-6">
                                    <h3 className="text-xl font-bold">Incoming</h3>
                                    <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-0">{incomingRequests.length}</Badge>
                                </div>

                                {incomingRequests.length === 0 ? (
                                    <div className="p-8 border-2 border-dashed border-border/50 rounded-xl text-center text-muted-foreground">
                                        No pending requests
                                    </div>
                                ) : (
                                    incomingRequests.map((req) => (
                                        <Card key={req.requestId} className="overflow-hidden border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                                            <div className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-full overflow-hidden bg-muted">
                                                        {req.avatar ? (
                                                            <Image src={getAvatarUrl(req.avatar)!} alt={req.username} width={48} height={48} className="object-cover h-full w-full" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center font-bold text-lg bg-primary/10 text-primary">
                                                                {req.username[0]?.toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-base">@{req.username}</p>
                                                        <p className="text-xs text-muted-foreground">Wants to be your friend</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={() => handleAccept(req.requestId)} className="rounded-full bg-green-500 hover:bg-green-600 text-white border-0 shadow-lg shadow-green-500/20">
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => handleReject(req.requestId)} className="rounded-full hover:bg-red-50 text-red-500">
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </motion.div>

                            {/* Outgoing Column */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-2 mb-6">
                                    <h3 className="text-xl font-bold text-muted-foreground">Outgoing</h3>
                                    <Badge variant="outline">{outgoingRequests.length}</Badge>
                                </div>

                                {outgoingRequests.length === 0 ? (
                                    <div className="p-8 border-2 border-dashed border-border/50 rounded-xl text-center text-muted-foreground">
                                        No sent requests
                                    </div>
                                ) : (
                                    outgoingRequests.map((req) => (
                                        <Card key={req.requestId} className="opacity-75 hover:opacity-100 transition-opacity">
                                            <div className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full overflow-hidden bg-muted">
                                                        {req.avatar ? (
                                                            <Image src={getAvatarUrl(req.avatar)!} alt={req.username} width={40} height={40} className="object-cover h-full w-full" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center font-bold text-xs bg-muted text-muted-foreground">
                                                                {req.username[0]?.toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">@{req.username}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Pending</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </motion.div>
                        </div>
                    )}

                    {activeTab === 'add' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-2xl mx-auto py-12"
                        >
                            <div className="relative text-center space-y-4 mb-12">
                                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-4 ring-1 ring-primary/20">
                                    <Sparkles className="h-6 w-6" />
                                </div>
                                <h2 className="text-3xl font-bold">Discover People</h2>
                                <p className="text-muted-foreground max-w-md mx-auto">
                                    Search for your friends by username to start chatting and sharing your collection.
                                </p>
                            </div>

                            <Card className="border-2 border-primary/10 shadow-2xl shadow-primary/5 overflow-hidden">
                                <CardContent className="p-6 sm:p-10">
                                    <form onSubmit={handleSendRequest} className="relative max-w-lg mx-auto">
                                        <div className="relative group">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <Input
                                                placeholder="Enter a username..."
                                                className="pl-12 h-14 text-lg rounded-2xl border-2 border-muted bg-muted/30 focus:bg-background focus:border-primary/50 transition-all duration-300"
                                                value={searchUsername}
                                                onChange={(e) => setSearchUsername(e.target.value)}
                                            />
                                            <Button
                                                type="submit"
                                                disabled={searchLoading || !searchUsername.trim()}
                                                className="absolute right-2 top-2 bottom-2 rounded-xl px-6 font-bold"
                                            >
                                                {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                                            </Button>
                                        </div>
                                    </form>

                                    {searchFeedback && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                "mt-6 p-4 rounded-xl text-center font-medium",
                                                searchFeedback.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                            )}
                                        >
                                            {searchFeedback.message}
                                        </motion.div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Share Dialog */}
            <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{shareMode === 'MENU' ? 'Share Profile' : 'Send to Friend'}</DialogTitle>
                    </DialogHeader>

                    {shareMode === 'MENU' ? (
                        <div className="grid gap-4">
                            <Button variant="outline" className="h-16 justify-start px-6" onClick={() => setShareMode('SELECT')}>
                                <div className="bg-primary/10 p-2 rounded-full mr-4">
                                    <MessageCircle className="h-6 w-6 text-primary" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold">Send to Friend</p>
                                    <p className="text-xs text-muted-foreground">Share via Animy chat</p>
                                </div>
                            </Button>
                            <Button variant="outline" className="h-16 justify-start px-6" onClick={handleCopyLink}>
                                <div className="bg-secondary p-2 rounded-full mr-4">
                                    <Share2 className="h-6 w-6 text-foreground" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold">Copy Link</p>
                                    <p className="text-xs text-muted-foreground">Share via other apps</p>
                                </div>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {availableFriendsToShareWith.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    No other friends to share with.
                                </p>
                            ) : (
                                availableFriendsToShareWith.map(friend => (
                                    <div key={friend.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full overflow-hidden border border-border bg-muted">
                                                {friend.avatar ? (
                                                    <Image src={getAvatarUrl(friend.avatar)!} alt={friend.username} width={40} height={40} className="object-cover h-full w-full" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center font-bold text-xs bg-primary/10 text-primary">
                                                        {(friend.firstName?.[0] || 'U').toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{friend.firstName} {friend.lastName}</p>
                                                <p className="text-xs text-muted-foreground">@{friend.username}</p>
                                            </div>
                                        </div>
                                        <Button size="sm" onClick={() => handleSendToFriend(friend.id)}>
                                            Send
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
