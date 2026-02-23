'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LogOut, User as UserIcon, Users, MessageCircle, Home, Tv, BookOpen, Film, Layers, Calendar, Mail, Sun, Moon, ShieldCheck, Flame } from 'lucide-react'
import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { cn, getAvatarUrl } from '@/lib/utils'
import UserAvatar from '@/components/common/UserAvatar'
import { AnimatedLogo } from './AnimatedLogo'
import { NotificationBell } from '@/components/Notifications/NotificationBell'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { isAuthenticated, user, logout, isLoading: authLoading } = useAuth()
  const { unreadCount } = useSocket()

  useEffect(() => {
    console.log('[DEBUG] Header unreadCount:', unreadCount)
  }, [unreadCount])

  // Polling for friend requests
  const [requestCount, setRequestCount] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchRequests = async () => {
      try {
        const res = await import('@/lib/api').then(m => m.default.get('/friends/list'))
        const incoming = res.data.data?.incomingRequests || []
        setRequestCount(incoming.length)
      } catch (error) {
        console.error('Failed to fetch requests', error)
      }
    }

    fetchRequests()
    // Poll every 30 seconds
    const interval = setInterval(fetchRequests, 30000)
    return () => clearInterval(interval)
  }, [isAuthenticated]) // Re-run when auth changes

  // Load dark mode from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark)
    setDark(shouldBeDark)

    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  // Toggle dark mode and save to localStorage
  const toggleDarkMode = () => {
    const newDarkMode = !dark
    setDark(newDarkMode)

    if (newDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // Prevent flash of wrong theme
  if (!mounted) {
    return null
  }

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'News', href: '/news', icon: Flame },
    { name: 'Anime', href: '/anime', icon: Tv },
    { name: 'Manga', href: '/manga', icon: BookOpen },
    { name: 'Movies', href: '/movies', icon: Film },
    { name: 'Series', href: '/series', icon: Layers },
    { name: 'Seasons', href: '/seasons', icon: Calendar },
    { name: 'Contact', href: '/contact', icon: Mail },
  ]

  // Add Admin link if user is admin
  if (user?.role === 'ADMIN') {
    navItems.push({ name: 'Admin', href: '/admin', icon: ShieldCheck })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <AnimatedLogo />
        </Link>

        {/* Desktop Navigation (Text) - Visible only on Large screens */}
        <nav className="hidden lg:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === item.href ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Tablet Navigation (Icons Only) - Visible on Medium but Hidden on Large */}
        <nav className="hidden md:flex lg:hidden items-center justify-center gap-1 sm:gap-2 flex-1 px-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'p-2 rounded-md transition-all hover:bg-accent hover:text-primary relative group',
                pathname === item.href ? 'text-primary bg-accent/50' : 'text-muted-foreground'
              )}
              title={item.name}
            >
              <item.icon className="w-5 h-5" />
              {/* Tooltip-ish label on hover */}
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] bg-background border px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {item.name}
              </span>
            </Link>
          ))}
        </nav>

        {/* Auth Section + Dark Mode */}
        {/* Auth Section + Dark Mode */}
        <div className="hidden md:flex items-center space-x-2 lg:space-x-3 shrink-0">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="group relative p-2.5 rounded-full hover:bg-accent/50 transition-all duration-300"
            aria-label="Toggle dark mode"
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              <Sun className={`w-5 h-5 text-orange-500 absolute transition-all duration-500 ${dark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
              <Moon className={`w-5 h-5 text-blue-500 absolute transition-all duration-500 ${dark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
            </div>
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] bg-background border px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">Theme</span>
          </button>

          {authLoading ? (
            <div className="h-10 w-24 bg-accent animate-pulse rounded-full opacity-20" />
          ) : isAuthenticated ? (
            <div className="flex items-center space-x-2 lg:space-x-3">
              <Link href="/dashboard/friends" className="relative group">
                <div className="p-2.5 rounded-full hover:bg-accent/50 transition-all duration-300 relative">
                  <Users className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  {requestCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold animate-pulse shadow-sm">
                      {requestCount}
                    </span>
                  )}
                </div>
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] bg-background border px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">Friends</span>
              </Link>

              <NotificationBell />

              <Link href="/chat" className="relative group">
                <div className="p-2.5 rounded-full hover:bg-accent/50 transition-all duration-300 relative">
                  <MessageCircle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold animate-pulse shadow-sm z-10">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] bg-background border px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">Chat</span>
              </Link>

              <Link href="/profile/shrine" className="relative group">
                <div className="p-2.5 rounded-full hover:bg-accent/50 transition-all duration-300">
                  <span className="text-xl grayscale group-hover:grayscale-0 transition-all">⛩️</span>
                </div>
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] bg-background border px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">Shrine</span>
              </Link>

              <div className="h-6 w-px bg-border/50 mx-2" />

              <Link href="/dashboard" className="group">
                <div className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-accent/50 transition-all border border-transparent hover:border-border/50">
                  {user?.avatar ? (
                    <Image
                      src={getAvatarUrl(user.avatar)!}
                      alt="Avatar"
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-background group-hover:ring-primary/20 transition-all"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center ring-2 ring-background">
                      <UserIcon className="h-4 w-4" />
                    </div>
                  )}
                  {/* <span className="text-sm font-medium mr-1 hidden xl:block text-muted-foreground group-hover:text-foreground transition-colors">{user?.firstName}</span> */}
                </div>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="w-8 h-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="font-medium hover:text-primary">
                  Login
                </Button>
              </Link>
              <Link href="/auth/register" onClick={() => setIsMenuOpen(false)}>
                <Button className="font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-full px-6">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle & Actions */}
        <div className="lg:hidden flex items-center gap-1">
          {/* Mobile Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="group relative p-2 rounded-full hover:bg-accent/50 transition-all duration-300"
            aria-label="Toggle dark mode"
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              <Sun className={`w-5 h-5 text-orange-500 absolute transition-all duration-500 ${dark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
              <Moon className={`w-5 h-5 text-blue-500 absolute transition-all duration-500 ${dark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
            </div>
          </button>

          {isAuthenticated && (
            <>
              <Link href="/profile/shrine" className="relative group">
                <div className="p-2.5 rounded-full hover:bg-accent/50 transition-all duration-300">
                  <span className="text-xl grayscale group-hover:grayscale-0 transition-all">⛩️</span>
                </div>
              </Link>

              <Link href="/dashboard/friends" className="relative group">
                <div className="p-2.5 rounded-full hover:bg-accent/50 transition-all duration-300 relative">
                  <Users className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  {requestCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold animate-pulse shadow-sm">
                      {requestCount}
                    </span>
                  )}
                </div>
              </Link>

              <NotificationBell />
            </>
          )}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t bg-background/80 backdrop-blur-2xl overflow-hidden"
          >
            <nav className="container py-8 space-y-10">
              {/* Nav Items Grid */}
              <div className="grid grid-cols-2 gap-3">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300',
                        isActive
                          ? 'bg-primary/10 border-primary/20 text-primary'
                          : 'bg-secondary/30 border-white/5 text-muted-foreground hover:bg-secondary/50 hover:border-white/10 hover:text-foreground'
                      )}
                    >
                      <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-sm font-black uppercase tracking-tight">{item.name}</span>
                    </Link>
                  )
                })}
              </div>

              {/* Theme & Settings Section */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">Settings & Theme</h3>
                <button
                  onClick={toggleDarkMode}
                  className="flex items-center justify-between w-full p-4 rounded-2xl bg-secondary/30 border border-white/5 hover:bg-secondary/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      {dark ? <Moon className="w-4 h-4 text-blue-500" /> : <Sun className="w-4 h-4 text-orange-500" />}
                    </div>
                    <span className="text-sm font-bold">{dark ? 'Dark Mode' : 'Light Mode'}</span>
                  </div>
                  <div className="w-10 h-6 bg-muted rounded-full relative p-1 group-hover:bg-muted/80 transition-colors">
                    <motion.div
                      animate={{ x: dark ? 16 : 0 }}
                      className="w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </div>
                </button>
              </div>

              {/* Account Section */}
              <div className="space-y-4 pt-6 border-t border-white/5">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">Account</h3>
                {isAuthenticated ? (
                  <div className="space-y-3">
                    {/* User Profile Summary */}
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all"
                    >
                      <UserAvatar user={user!} className="h-12 w-12 rounded-xl ring-2 ring-primary/20" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black truncate">{user?.firstName}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Level {user?.level || 1} • {user?.rank || 'Initiate'}</p>
                      </div>
                      <Layers className="w-4 h-4 text-primary" />
                    </Link>

                    {/* Action Links Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <Link href="/dashboard/friends" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" className="w-full gap-2 justify-start h-12 rounded-xl border-white/5 bg-secondary/20 hover:bg-secondary/40">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-bold">Friends</span>
                          {requestCount > 0 && <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                        </Button>
                      </Link>
                      <Link href="/chat" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" className="w-full gap-2 justify-start h-12 rounded-xl border-white/5 bg-secondary/20 hover:bg-secondary/40">
                          <MessageCircle className="w-4 h-4 text-purple-500" />
                          <span className="text-xs font-bold">Inbox</span>
                          {unreadCount > 0 && <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                        </Button>
                      </Link>
                      <Link href="/profile/shrine" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" className="w-full gap-2 justify-start h-12 rounded-xl border-white/5 bg-secondary/20 hover:bg-secondary/40">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span className="text-xs font-bold">Shrine</span>
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        onClick={logout}
                        className="w-full gap-2 justify-start h-12 rounded-xl border-white/5 bg-red-500/5 hover:bg-red-500/10 text-red-500"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-xs font-bold">Logout</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <Link href="/auth/login" onClick={() => setIsMenuOpen(false)} className="w-full">
                      <Button variant="outline" className="w-full h-12 rounded-xl border-white/5 bg-secondary/20 hover:bg-secondary/40 font-bold">
                        Login
                      </Button>
                    </Link>
                    <Link href="/auth/register" onClick={() => setIsMenuOpen(false)} className="w-full">
                      <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20">
                        Join Now
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}