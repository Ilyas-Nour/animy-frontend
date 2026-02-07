'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    Users,
    LayoutDashboard,
    Settings,
    ShieldCheck,
    ChevronRight,
    Menu,
    X,
    LogOut,
    Home,
    Mail,
    Heart,
    Activity,
    Flame,
    CheckCircle2,
    Tv,
    BookOpen,
    Film,
    Layers,
    Calendar
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { getAvatarUrl, cn } from '@/lib/utils'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

const navigation = [
    {
        title: 'Core',
        items: [
            { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
            { name: 'Users', href: '/admin/users', icon: Users },
            { name: 'Messages', href: '/admin/messages', icon: Mail },
        ]
    },
    {
        title: 'Anime Insights',
        items: [
            { name: 'Favorites', href: '/admin/reports/anime/favorites', icon: Heart },
            { name: 'Watching', href: '/admin/reports/anime/WATCHING', icon: Activity },
            { name: 'Completed', href: '/admin/reports/anime/COMPLETED', icon: ShieldCheck },
        ]
    },
    {
        title: 'Manga Insights',
        items: [
            { name: 'Top Rated', href: '/admin/reports/manga/favorites', icon: Flame },
        ]
    },
    {
        title: 'Site Explorer',
        items: [
            { name: 'Anime', href: '/anime', icon: Tv },
            { name: 'Manga', href: '/manga', icon: BookOpen },
            { name: 'Movies', href: '/movies', icon: Film },
            { name: 'Series', href: '/series', icon: Layers },
            { name: 'Seasons', href: '/seasons', icon: Calendar },
        ]
    },
    {
        title: 'System',
        items: [
            { name: 'Settings', href: '/admin/settings', icon: Settings },
            { name: 'Home', href: '/', icon: Home },
        ]
    }
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isLoading, logout } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Load sidebar state from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('adminSidebarOpen')
        if (saved !== null) {
            setIsSidebarOpen(saved === 'true')
        }
    }, [])

    // Save sidebar state to localStorage
    const toggleSidebar = () => {
        const newState = !isSidebarOpen
        setIsSidebarOpen(newState)
        localStorage.setItem('adminSidebarOpen', String(newState))
    }

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
            router.push('/')
        }
    }, [isAuthenticated, user, isLoading, router])

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [pathname])

    if (isLoading || !isAuthenticated || user?.role !== 'ADMIN') {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                </div>
            </div>
        )
    }

    const SidebarContent = () => (
        <div className="flex h-full flex-col bg-card text-muted-foreground">
            {/* Header - Condensed if Sidebar is below header */}
            <div className={cn(
                "flex h-16 items-center border-b border-border transition-all duration-300",
                isSidebarOpen || isMobileMenuOpen ? "px-6 gap-3" : "px-0 justify-center"
            )}>
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                    <ShieldCheck className="w-5 h-5 text-primary-foreground" />
                </div>
                {(isSidebarOpen || isMobileMenuOpen) && (
                    <div className="flex flex-col overflow-hidden">
                        <span className="font-black text-lg tracking-tight text-foreground leading-none">Admin<span className="text-primary italic">Panel</span></span>
                    </div>
                )}
            </div>

            {/* Nav Sections */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 custom-scrollbar">
                {navigation.map((section) => (
                    <div key={section.title} className="space-y-2">
                        {(isSidebarOpen || isMobileMenuOpen) && (
                            <h4 className="px-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">{section.title}</h4>
                        )}
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-xl transition-all group relative duration-300",
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                : "hover:bg-accent hover:text-foreground",
                                            !isSidebarOpen && !isMobileMenuOpen && "px-0 justify-center"
                                        )}
                                    >
                                        <item.icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                                        {(isSidebarOpen || isMobileMenuOpen) && (
                                            <span className="text-xs font-bold truncate">{item.name}</span>
                                        )}
                                        {isActive && (isSidebarOpen || isMobileMenuOpen) && (
                                            <motion.div layoutId="active" className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                                        )}
                                        {isActive && !isSidebarOpen && !isMobileMenuOpen && (
                                            <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                                        )}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer / Profile */}
            <div className="p-4 border-t border-border space-y-2 pb-10">
                <div className={cn("flex gap-2", !isSidebarOpen && !isMobileMenuOpen && "flex-col items-center")}>
                    <Button
                        variant="ghost"
                        className={cn(
                            "flex-1 h-10 rounded-xl gap-3 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors",
                            !isSidebarOpen && !isMobileMenuOpen && "px-0 justify-center flex-none w-10 mx-auto"
                        )}
                        onClick={() => logout()}
                    >
                        <LogOut className="w-4 h-4" />
                        {(isSidebarOpen || isMobileMenuOpen) && <span className="font-bold text-xs">Sign Out</span>}
                    </Button>
                    {isMobileMenuOpen ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl bg-accent text-muted-foreground hover:text-foreground"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-10 w-10 rounded-xl bg-accent text-muted-foreground hover:text-foreground lg:flex hidden shrink-0",
                                !isSidebarOpen && "mx-auto"
                            )}
                            onClick={toggleSidebar}
                        >
                            <ChevronRight className={cn("w-4 h-4 transition-transform duration-500", !isSidebarOpen && "rotate-180")} />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Desktop Sidebar (Adjusted top to top-16 to sit below header) */}
            <aside
                className={cn(
                    "fixed left-0 top-16 z-30 h-[calc(100vh-64px)] transition-all duration-500 ease-in-out border-r border-border lg:block hidden",
                    isSidebarOpen ? "w-64" : "w-20"
                )}
            >
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar (Drawer) */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed left-0 top-0 z-[60] h-screen w-72 lg:hidden shadow-2xl"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Top Bar (Only if mobile sidebar is toggled - but header is already global) */}
                {/* Actually, the global header handles mobile menu. 
                    However, if we want an admin-specific mobile menu button, we can add it or just use the global one.
                    Let's add a sub-header for admin actions on mobile.
                */}
                <div className="h-12 border-b border-border flex items-center justify-between px-6 lg:hidden sticky top-16 z-20 bg-background/80 backdrop-blur-md">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Admin Console</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg bg-accent"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu className="w-4 h-4 text-foreground" />
                    </Button>
                </div>

                <main className={cn(
                    "flex-1 transition-all duration-500",
                    isSidebarOpen ? "lg:pl-64" : "lg:pl-20"
                )}>
                    <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            {children}
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    )
}
