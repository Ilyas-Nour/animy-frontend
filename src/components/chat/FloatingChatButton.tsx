'use client'

import React from 'react'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { useSocket } from '@/contexts/SocketContext'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { usePathname } from 'next/navigation'

export function FloatingChatButton() {
    const { unreadCount } = useSocket()
    const { isAuthenticated } = useAuth()
    const pathname = usePathname()

    // Don't show if not logged in or if already on the chat page
    if (!isAuthenticated || pathname === '/chat') {
        return null
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0, y: 20 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="fixed bottom-6 right-6 z-40 md:hidden"
            >
                <Link href="/chat">
                    <div className="relative group">
                        {/* Glow Effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-200 animate-pulse"></div>

                        {/* Main Button */}
                        <div className="relative flex items-center justify-center w-14 h-14 bg-background border border-white/10 rounded-full shadow-2xl backdrop-blur-xl">
                            <MessageCircle className="w-7 h-7 text-foreground" />

                            {/* Unread Badge */}
                            {unreadCount > 0 && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white shadow-lg border-2 border-background"
                                >
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </motion.div>
                            )}
                        </div>
                    </div>
                </Link>
            </motion.div>
        </AnimatePresence>
    )
}
