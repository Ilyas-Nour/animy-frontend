'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Search, Loader2, Send, Users, Flame, Activity } from 'lucide-react'
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
            <DialogContent className="sm:max-w-md bg-[#050505]/80 border border-white/10 shadow-[0_0_120px_-20px_rgba(99,102,241,0.4)] p-0 overflow-hidden rounded-[2.5rem] backdrop-blur-[40px]">
                {/* Global Ambient Glows */}
                <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-[30%] -left-[20%] w-[80%] h-[80%] bg-indigo-600 rounded-full blur-[120px] pointer-events-none" 
                />
                <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute -bottom-[30%] -right-[20%] w-[80%] h-[80%] bg-purple-600 rounded-full blur-[120px] pointer-events-none" 
                />
                
                {/* Cyber/Neural Noise Overlay */}
                <div 
                    className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none" 
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} 
                />

                <DialogHeader className="p-6 pb-2 relative z-10">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-black text-white flex items-center gap-4">
                            <div className="relative">
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-purple-500/0 blur-md"
                                />
                                <div className="relative p-3 rounded-xl bg-black/60 border border-indigo-500/30 backdrop-blur-md shadow-[inset_0_0_20px_rgba(99,102,241,0.2)]">
                                    <Users className="w-5 h-5 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                                </div>
                                <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-indigo-500 border-2 border-[#050505]"></span>
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="bg-gradient-to-br from-white via-indigo-100 to-indigo-500 bg-clip-text text-transparent tracking-tighter italic uppercase leading-none drop-shadow-[0_0_15px_rgba(99,102,241,0.4)] text-2xl">Sync Neural</span>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                                    <span className="text-emerald-400/90 tracking-[0.3em] text-[9px] font-black uppercase drop-shadow-sm">Handshake Active</span>
                                </div>
                            </div>
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6 relative z-10">
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/0 via-indigo-500/30 to-purple-500/0 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                        <div className="relative flex items-center">
                            <Search className="absolute left-4 w-4 h-4 text-indigo-400/50 group-focus-within:text-indigo-400 transition-colors z-20" />
                            <Input
                                placeholder="Identify Operative..."
                                className="w-full bg-black/40 border-white/5 pl-11 h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 font-medium text-white placeholder:text-zinc-600 relative z-10 text-sm transition-all shadow-inner"
                                value={search}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                            />
                            <div className="absolute right-4 w-5 h-5 flex items-center justify-center pointer-events-none z-20">
                                <motion.div 
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_5px_rgba(99,102,241,0.8)]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                        <AnimatePresence mode="popLayout">
                            {loading ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-20 space-y-6"
                                >
                                    <div className="relative w-20 h-20">
                                        <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
                                        <div className="absolute inset-2 rounded-full border-t-2 border-indigo-400 animate-spin" />
                                        <div className="absolute inset-4 rounded-full border-b-2 border-purple-500 animate-[spin_2s_reverse_infinite]" />
                                        <Loader2 className="w-full h-full text-indigo-500 p-6 absolute inset-0" />
                                    </div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400 animate-pulse drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">Syncing Cryptographic Keys...</p>
                                </motion.div>
                            ) : filteredFriends.length > 0 ? (
                                filteredFriends.map((friend, idx) => (
                                    <motion.button
                                        key={friend.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                                        onClick={() => handleShare(friend.id)}
                                        disabled={sharingId !== null}
                                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.03)' }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full flex items-center gap-4 p-3 rounded-2xl bg-white/[0.01] border border-white/5 transition-all group group-disabled:opacity-50 relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 border-2 border-indigo-500/0 group-hover:border-indigo-500/20 rounded-2xl transition-all duration-300 pointer-events-none" />
                                        
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent group-hover:from-indigo-500/50 group-hover:to-purple-500/20 transition-all duration-500 shadow-xl">
                                                <div className="w-full h-full rounded-[11px] bg-[#050505] flex items-center justify-center overflow-hidden relative">
                                                    {friend.avatar ? (
                                                        <Image 
                                                            src={getAvatarUrl(friend.avatar)} 
                                                            alt={friend.username} 
                                                            fill
                                                            sizes="48px"
                                                            className="object-cover opacity-70 grayscale group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-out" 
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-black text-indigo-500/40 group-hover:text-indigo-400 transition-colors">
                                                            {getInitials(friend.firstName || friend.username)}
                                                        </span>
                                                    )}
                                                    <div className="absolute inset-0 shadow-[inset_0_0_12px_rgba(0,0,0,0.6)] pointer-events-none" />
                                                </div>
                                            </div>
                                            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#050505]"></span>
                                            </span>
                                        </div>

                                        <div className="flex-1 text-left flex flex-col justify-center">
                                            <p className="text-[15px] font-black text-zinc-300 group-hover:text-white transition-colors tracking-tight drop-shadow-md">
                                                {friend.username}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Activity className="w-3 h-3 text-emerald-500/80 group-hover:text-emerald-400 transition-colors" />
                                                <p className="text-[9px] text-emerald-500/60 group-hover:text-emerald-400/90 font-bold uppercase tracking-widest transition-colors">Frequency Stable</p>
                                            </div>
                                        </div>

                                        <div className={cn(
                                            "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 relative overflow-hidden shadow-lg",
                                            sharingId === friend.id
                                                ? "bg-indigo-500 text-white shadow-[0_0_25px_rgba(99,102,241,0.6)] border border-indigo-400"
                                                : "bg-black/40 border border-white/5 text-zinc-500 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 group-hover:border-indigo-500/40"
                                        )}>
                                            {sharingId === friend.id ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                                            )}
                                        </div>

                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
                                    </motion.button>
                                ))
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-20 text-center bg-black/20 rounded-[2rem] border border-dashed border-white/10 relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
                                    <Activity className="w-8 h-8 text-zinc-700 mx-auto mb-4 opacity-50 relative z-10" />
                                    <p className="text-[12px] font-black uppercase tracking-[0.3em] text-zinc-500 italic drop-shadow-md relative z-10">
                                        Frequency list is empty<br/><span className="text-[9px] text-zinc-600 mt-2 block">No operatives detected</span>
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="bg-black/60 backdrop-blur-2xl p-5 border-t border-white/10 mt-auto flex items-center gap-4 relative z-10 overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent opacity-50" />
                    <div className="relative">
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-orange-500/30 rounded-xl blur-md"
                        />
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/10 flex items-center justify-center shrink-0 border border-orange-500/30 relative z-10 shadow-[inset_0_0_15px_rgba(249,115,22,0.2)]">
                            <Flame className="w-5 h-5 text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden relative pr-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                            <p className="text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 uppercase tracking-[0.2em] drop-shadow-sm">Live Link Active</p>
                        </div>
                        <p className="text-[13px] font-bold text-zinc-300 truncate tracking-wide group-hover:text-white transition-colors drop-shadow-md">&ldquo;{newsItem.title}&rdquo;</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
