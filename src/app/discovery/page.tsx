'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { InterestGrid } from '@/components/discovery/InterestGrid'
import { DiscoveryFeed } from '@/components/discovery/DiscoveryFeed'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export default function DiscoveryPage() {
    const { user, refreshProfile, isLoading: authLoading } = useAuth()
    const router = useRouter()
    const [hasSelectedInterests, setHasSelectedInterests] = useState(false)
    const [selectedInterests, setSelectedInterests] = useState<string[]>([])
    const [isSaving, setIsSaving] = useState(false)

    // Resilient initialization
    useEffect(() => {
        if (!authLoading) {
            const hasToken = !!localStorage.getItem('token')

            if (user) {
                // We have a verified user from server
                if (user.interests && user.interests.length > 0) {
                    console.log('[Discovery] Hydrating interests from user profile')
                    setSelectedInterests(user.interests)
                    setHasSelectedInterests(true)
                }
            } else if (!hasToken) {
                // Definitive No User AND No Token
                console.log('[Discovery] No session found. Redirecting to login.')
                router.push('/auth/login')
            } else {
                // We have a token but profile fetch might have failed or is in a weird state
                console.warn('[Discovery] Token exists but user profile missing. Staying put.')
            }
        }
    }, [user, authLoading, router])

    const handleContinue = async () => {
        if (selectedInterests.length > 0) {
            setIsSaving(true)
            try {
                // Determine missing interests (optimization: only update if changed? Backend handles replace)
                await api.patch('/users/profile', { interests: selectedInterests })
                await refreshProfile() // Update global user state
                setHasSelectedInterests(true)
            } catch (error) {
                console.error("Failed to save interests", error)
            } finally {
                setIsSaving(false)
            }
        }
    }

    if (authLoading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white/20">Initialsing Prism...</div>

    return (
        <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden selection:bg-cyan-500/30">
            {/* Prism Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[150px]" />
                <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-white/[0.02] rounded-full blur-[100px] animate-pulse" />
            </div>

            <div className="relative z-10 container max-w-7xl mx-auto px-4 py-8 min-h-screen flex flex-col">
                {/* Header */}
                <header className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-white/50">
                                Find Your Kindred Spirits
                            </h1>
                            <p className="text-xs font-bold text-white/30 tracking-widest uppercase">Social Discovery</p>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                        {!hasSelectedInterests ? (
                            <motion.div
                                key="setup"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                                className="w-full max-w-4xl"
                            >
                                <div className="text-center mb-12 space-y-4">
                                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                                        Define Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">Spectrum</span>
                                    </h2>
                                    <p className="text-white/40 text-lg max-w-xl mx-auto font-medium">
                                        Select topics that resonate with you to refract light towards like-minded souls.
                                    </p>
                                </div>

                                <InterestGrid
                                    selected={selectedInterests}
                                    toggleInterest={(id) => {
                                        setSelectedInterests(prev =>
                                            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                                        )
                                    }}
                                />

                                <div className="mt-12 text-center">
                                    <button
                                        onClick={handleContinue}
                                        disabled={selectedInterests.length === 0 || isSaving}
                                        className={`
                                    group relative px-8 py-4 rounded-2xl font-black tracking-widest uppercase transition-all duration-500
                                    ${selectedInterests.length > 0 && !isSaving
                                                ? 'bg-white text-black hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)] cursor-pointer'
                                                : 'bg-white/5 text-white/20 cursor-not-allowed'}
                                `}
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            {isSaving ? 'Refracting...' : 'Refract Connections'} <Sparkles className="w-4 h-4" />
                                        </span>
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="feed"
                                initial={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                className="w-full h-full"
                            >
                                <DiscoveryFeed selectedInterests={selectedInterests} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
