'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, Search, Book, User, Heart, MessageSquare, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/contexts/SocketContext'

export function MobileNav() {
    const pathname = usePathname()
    const { isAuthenticated } = useAuth()
    const { unreadCount } = useSocket()

    const navItems = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'News', href: '/news', icon: Flame },
        { name: 'Search', href: '/anime', icon: Search },
        { name: 'Chat', href: '/chat', icon: MessageSquare },
        { name: 'Profile', href: '/dashboard', icon: User },
    ]

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            <nav className="bg-background/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-2xl">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    // Badge logic: Only show for 'Chat' if authenticated and count > 0
                    const showBadge = item.name === 'Chat' && isAuthenticated && unreadCount > 0

                    return (
                        <Link key={item.name} href={item.href} className="flex-1 relative group">
                            <div className="flex flex-col items-center py-2 transition-all">
                                {isActive && (
                                    <motion.div
                                        layoutId="mobileNavActive"
                                        className="absolute -top-2 left-0 right-0 h-[2px] bg-primary mx-8 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                    />
                                )}

                                <motion.div
                                    animate={isActive ? { y: -2 } : { y: 0 }}
                                    className={cn(
                                        "relative flex flex-col items-center gap-1",
                                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                    )}
                                >
                                    <div className="relative">
                                        <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />

                                        {isActive && (
                                            <motion.div
                                                layoutId="mobileNavGlow"
                                                className="absolute -inset-4 bg-primary/20 blur-xl rounded-full -z-10"
                                            />
                                        )}

                                        {/* Unread Badge */}
                                        {showBadge && (
                                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] min-w-[14px] h-[14px] rounded-full flex items-center justify-center font-bold border border-background animate-pulse shadow-sm z-20 px-0.5">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-medium transition-colors",
                                        isActive ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground"
                                    )}>
                                        {item.name}
                                    </span>
                                </motion.div>
                            </div>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
