'use client'

import { useState, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { clsx } from 'clsx'
import { Sparkles, MessageCircle, UserPlus, Zap, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { getAvatarUrl, getInitials } from '@/lib/utils'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

interface DiscoveryFeedProps {
    selectedInterests: string[]
}

export function DiscoveryFeed({ selectedInterests }: DiscoveryFeedProps) {
    const { user } = useAuth()
    const [matches, setMatches] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [relationshipIds, setRelationshipIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        const fetchData = async () => {
            console.log('[DiscoveryFeed] Fetching data...')
            try {
                // Fetch suggestions and friends in parallel
                const [suggestionsRes, friendsRes] = await Promise.all([
                    api.get('/users/discovery/suggestions'),
                    user ? api.get('/friends/list') : Promise.resolve({ data: {} })
                ])

                const users = suggestionsRes.data?.data || suggestionsRes.data || []
                setMatches(users)

                if (user && friendsRes.data?.data) {
                    const { friends: accepted, incomingRequests, outgoingRequests } = friendsRes.data.data
                    const ids = new Set<string>()
                    accepted?.forEach((f: any) => ids.add(f.id))
                    incomingRequests?.forEach((r: any) => ids.add(r.id))
                    outgoingRequests?.forEach((r: any) => ids.add(r.id))
                    setRelationshipIds(ids)
                }
            } catch (error: any) {
                console.error("[DiscoveryFeed] API Error:", error.response?.status, error.message)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [user])

    if (isLoading) {
        return (
            <div className="w-full flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        )
    }

    if (!Array.isArray(matches) || matches.length === 0) {
        return (
            <div className="text-center py-20 space-y-4">
                <p className="text-white/40 italic">No spirits found in this spectrum yet...</p>
            </div>
        )
    }

    return (
        <div className="w-full max-w-lg mx-auto space-y-8">
            <div className="text-center space-y-2">
                <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-black text-white"
                >
                    Suggested Spirits
                </motion.h3>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-white/40 text-sm font-medium"
                >
                    Based on your refraction pattern.
                </motion.p>
            </div>

            <div className="space-y-6 perspective-[2000px]">
                {matches.map((match, index) => (
                    <TiltCard
                        key={match.id}
                        match={match}
                        selectedInterests={selectedInterests}
                        index={index}
                        isAlreadyConnected={relationshipIds.has(match.id)}
                    />
                ))}
            </div>

            <div className="h-24 flex items-center justify-center text-white/20 text-xs font-mono uppercase tracking-widest">
                End of Transmission
            </div>
        </div>
    )
}

function TiltCard({
    match,
    selectedInterests,
    index,
    isAlreadyConnected
}: {
    match: any,
    selectedInterests: string[],
    index: number,
    isAlreadyConnected: boolean
}) {
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 })
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 })

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["15deg", "-15deg"])
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-15deg", "15deg"])

    const [connectStatus, setConnectStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

    function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect()
        x.set((clientX - left) / width - 0.5)
        y.set((clientY - top) / height - 0.5)
    }

    function onMouseLeave() {
        x.set(0)
        y.set(0)
    }

    const handleConnect = async () => {
        if (connectStatus !== 'idle') return

        try {
            setConnectStatus('loading')
            await api.post('/friends/request', { username: match.username })
            setConnectStatus('sent')
            toast.success(`Request sent to ${match.firstName || match.username}!`)
        } catch (error: any) {
            console.error('[Discovery] Connect failed:', error)
            setConnectStatus('error')
            const msg = error.response?.data?.message || 'Failed to send request'
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg))
            setTimeout(() => setConnectStatus('idle'), 3000)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative group bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 hover:shadow-[0_0_50px_rgba(139,92,246,0.15)] transition-shadow duration-500 overflow-hidden"
        >
            {/* Dynamic Light Leak */}
            <div
                className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{ transform: "translateZ(0px)" }}
            />

            <div className="relative z-10 flex gap-6" style={{ transform: "translateZ(20px)" }}>
                {/* Avatar with Ring */}
                <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-full p-[2px] bg-gradient-to-br from-cyan-400 to-violet-500">
                        <div className="w-full h-full rounded-full bg-black overflow-hidden relative flex items-center justify-center">
                            {match.avatar ? (
                                <Image
                                    src={getAvatarUrl(match.avatar) || ''}
                                    alt={match.username || 'User'}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                    crossOrigin="anonymous"
                                />
                            ) : (
                                <span className="text-xl font-bold text-white">{getInitials(match.firstName || match.username)}</span>
                            )}
                        </div>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur border border-white/10 px-2 py-0.5 rounded-full text-[10px] font-bold text-white whitespace-nowrap flex items-center gap-1 shadow-lg">
                        <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        {match.matchScore}%
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                    <div>
                        <h4 className="text-xl font-black text-white tracking-tight">{match.firstName || match.username}</h4>
                        <p className="text-sm text-white/50 font-medium leading-snug line-clamp-2">
                            {match.bio || "Refracting through the digital void..."}
                        </p>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                        {match.interests?.map((tag: string) => {
                            const isShared = match.sharedInterests?.includes(tag) || selectedInterests.includes(tag)
                            return (
                                <span
                                    key={tag}
                                    className={clsx(
                                        "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border transition-all duration-300",
                                        isShared
                                            ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                                            : "bg-white/5 border-white/5 text-white/30"
                                    )}
                                >
                                    #{tag}
                                </span>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="relative z-10 mt-6 pt-6 border-t border-white/5 flex items-center justify-end" style={{ transform: "translateZ(10px)" }}>
                <div className="flex gap-2">
                    {!isAlreadyConnected && (
                        <button
                            onClick={handleConnect}
                            disabled={connectStatus !== 'idle'}
                            className={clsx(
                                "h-10 px-6 rounded-full font-bold text-sm transition-all duration-300 flex items-center gap-2 shadow-xl",
                                connectStatus === 'idle' && "bg-white text-black hover:scale-105 shadow-white/20",
                                connectStatus === 'loading' && "bg-white/50 text-black/50 cursor-wait",
                                connectStatus === 'sent' && "bg-emerald-500 text-white cursor-default shadow-emerald-500/20",
                                connectStatus === 'error' && "bg-rose-500 text-white shadow-rose-500/20"
                            )}
                        >
                            {connectStatus === 'loading' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : connectStatus === 'sent' ? (
                                <Sparkles className="w-4 h-4" />
                            ) : (
                                <UserPlus className="w-4 h-4" />
                            )}
                            {connectStatus === 'idle' && 'Connect'}
                            {connectStatus === 'loading' && 'Resonating...'}
                            {connectStatus === 'sent' && 'Sent!'}
                            {connectStatus === 'error' && 'Failed'}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
