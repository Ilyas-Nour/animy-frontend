'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2, Send, Users, Flame } from 'lucide-react'
import api from '@/lib/api'
import { getAvatarUrl, getInitials, cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useSocket } from '@/contexts/SocketContext'

interface Friend {
    id: string
    username: string
    firstName?: string
    avatar?: string
}

interface ShareNewsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    newsItem: {
        id: string
        title: string
        url: string
        image_url?: string
    }
}

export function ShareNewsModal({ open, onOpenChange, newsItem }: ShareNewsModalProps) {
    const [friends, setFriends] = useState<Friend[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const { socket } = useSocket()
    const [sharingId, setSharingId] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            fetchFriends()
        }
    }, [open])

    const fetchFriends = async () => {
        try {
            setLoading(true)
            const res = await api.get('/friends/list')
            setFriends(res.data.data?.friends || [])
        } catch (error) {
            console.error('Failed to fetch friends', error)
            toast.error('Could not load transmission frequencies (friends)')
        } finally {
            setLoading(false)
        }
    }

    const handleShare = async (friendId: string) => {
        if (!socket) {
            toast.error('Neural link disconnected (Socket error)')
            return
        }

        setSharingId(friendId)
        try {
            socket.emit('message:send', {
                to: friendId,
                type: 'MEDIA_CARD',
                mediaId: newsItem.id,
                mediaType: 'NEWS',
                mediaTitle: newsItem.title,
                mediaImage: newsItem.image_url,
                content: 'Intercepted a new transmission...'
            })

            toast.success(`Broadcasting to ${friends.find(f => f.id === friendId)?.username}...`, {
                icon: <Send className="w-4 h-4 text-indigo-500" />
            })
            setTimeout(() => onOpenChange(false), 800)
        } catch (error) {
            toast.error('Signal interference. Share failed.')
        } finally {
            setSharingId(null)
        }
    }

    const filteredFriends = friends.filter(f =>
        f.username.toLowerCase().includes(search.toLowerCase()) ||
        f.firstName?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-[#020202]/90 border-white/10 shadow-[0_0_80px_-20px_rgba(99,102,241,0.3)] p-0 overflow-hidden rounded-[2.5rem] backdrop-blur-[32px]">
                {/* Global Ambient Glow */}
                <div className="absolute -top-[30%] -left-[20%] w-[80%] h-[80%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute -bottom-[30%] -right-[20%] w-[80%] h-[80%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

                <DialogHeader className="p-5 pb-0 relative z-10">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-black text-white flex items-center gap-3">
                            <div className="relative">
                                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                    <Users className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-indigo-500 rounded-full blur-[2px] animate-pulse" />
                            </div>
                            <div className="flex flex-col">
                                <span className="tracking-tight italic uppercase leading-none">Sync Neural</span>
                                <span className="text-indigo-400 tracking-[0.2em] text-[7px] font-black uppercase mt-0.5 opacity-60">Handshake Active</span>
                            </div>
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="p-5 space-y-5 relative z-10">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-indigo-500/10 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-300 transition-colors z-20" />
                        <Input
                            placeholder="Identify Operative..."
                            className="bg-white/[0.02] border-white/5 pl-10 h-10 rounded-xl focus-visible:ring-indigo-500/30 font-bold text-white placeholder:text-zinc-700 relative z-10 text-xs border-t-white/5"
                            value={search}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                        <AnimatePresence mode="popLayout">
                            {loading ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-20 space-y-6"
                                >
                                    <div className="relative w-16 h-16">
                                        <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
                                        <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin" />
                                        <Loader2 className="w-full h-full text-indigo-500 p-4" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400/60 animate-pulse">Syncing Cryptographic Keys...</p>
                                </motion.div>
                            ) : filteredFriends.length > 0 ? (
                                filteredFriends.map((friend, idx) => (
                                    <motion.button
                                        key={friend.id}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.03 }}
                                        onClick={() => handleShare(friend.id)}
                                        disabled={sharingId !== null}
                                        className="w-full flex items-center gap-3.5 p-2.5 rounded-xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.04] hover:border-indigo-500/30 transition-all group group-disabled:opacity-50 relative overflow-hidden"
                                    >
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 p-px shadow-inner transition-transform group-hover:scale-105">
                                                <div className="w-full h-full rounded-[0.45rem] bg-zinc-900 flex items-center justify-center overflow-hidden">
                                                    {friend.avatar ? (
                                                        <img src={getAvatarUrl(friend.avatar)} alt={friend.username} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-opacity" />
                                                    ) : (
                                                        <span className="text-xs font-black text-indigo-500/30 group-hover:text-indigo-400 transition-colors">
                                                            {getInitials(friend.firstName || friend.username)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#020202] rounded-full" />
                                        </div>

                                        <div className="flex-1 text-left">
                                            <p className="text-[13px] font-bold text-zinc-200 group-hover:text-indigo-300 transition-colors uppercase tracking-tight">
                                                {friend.username}
                                            </p>
                                            <p className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">Frequency Stable</p>
                                        </div>

                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-300",
                                            sharingId === friend.id
                                                ? "bg-indigo-500 border-indigo-400 text-white"
                                                : "bg-white/[0.02] border-white/5 text-zinc-600 group-hover:text-white group-hover:border-indigo-500/40"
                                        )}>
                                            {sharingId === friend.id ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Send className="w-3.5 h-3.5" />
                                            )}
                                        </div>

                                        {/* Scanline Effect */}
                                        <div className="absolute inset-0 bg-indigo-500/[0.02] translate-y-full group-hover:translate-y-[-100%] transition-transform duration-[1500ms] pointer-events-none" />
                                    </motion.button>
                                ))
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-20 text-center bg-white/[0.01] rounded-[2.5rem] border border-dashed border-white/5"
                                >
                                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-600 italic">
                                        Frequency list is empty. No operatives detected.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="bg-[#050505] p-4 border-t border-white/5 mt-auto flex items-center gap-4 relative z-10">
                    <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
                        <Flame className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-[7px] font-black text-orange-500 uppercase tracking-widest mb-0.5">Live Link</p>
                        <p className="text-[10px] font-bold text-zinc-400 truncate italic">&ldquo;{newsItem.title}&rdquo;</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
