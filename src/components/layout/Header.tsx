'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LogOut, User as UserIcon, Users, MessageCircle, Home, Tv, BookOpen, Film, Layers, Calendar, Mail, Sun, Moon, ShieldCheck, Flame, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { cn, getAvatarUrl } from '@/lib/utils'
import UserAvatar from '@/components/common/UserAvatar'
import { AnimatedLogo } from './AnimatedLogo'
import { GlobalSearch } from './GlobalSearch'
import { NotificationBell } from '@/components/Notifications/NotificationBell'
import { ThemeToggle } from '@/components/providers/ThemeToggle'
import { useTheme } from 'next-themes'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const { isAuthenticated, user, logout, isLoading: authLoading } = useAuth()
  const { unreadCount } = useSocket()

  useEffect(() => {
    console.log('[DEBUG] Header unreadCount:', unreadCount)
  }, [unreadCount])

  // Polling for friend requests
  const [requestCount, setRequestCount] = useState(0)

  useEffect(() => {
    if (!user) return

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
  }, [user])

  // Scroll effect for dynamic navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

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
  ]

  // Add Admin link if user is admin
  if (user?.role === 'ADMIN') {
    navItems.push({ name: 'Admin', href: '/admin', icon: ShieldCheck })
  }

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 border-b",
        scrolled 
          ? "bg-background/80 backdrop-blur-xl border-border/40 shadow-sm dark:shadow-none supports-[backdrop-filter]:bg-background/60"
          : "bg-background/40 backdrop-blur-sm border-transparent"
      )}
    >
      <div className={cn(
        "container flex items-center justify-between gap-4 transition-all duration-300",
        scrolled ? "h-16" : "h-20"
      )}>
        {/* Logo */}
        <Link href="/" className="shrink-0 flex items-center gap-2 group">
          <AnimatedLogo />
        </Link>

        {/* Desktop Navigation (Text) - Visible only on Large screens */}
        <nav className="hidden lg:flex items-center space-x-1 lg:space-x-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative px-3 py-2 text-sm font-semibold tracking-wide transition-colors duration-300 rounded-md group overflow-hidden',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {item.name}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute inset-0 bg-primary/10 rounded-md -z-0 border border-primary/20"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {!isActive && (
                  <span className="absolute inset-0 bg-accent scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 rounded-md -z-0 opacity-50" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Global Search - Takes up remaining space gracefully */}
        <div className="flex-1 max-w-md hidden md:block px-4">
          <GlobalSearch />
        </div>

        {/* Tablet Navigation (Icons Only) - Visible on Medium but Hidden on Large */}
        <nav className="hidden md:flex lg:hidden items-center justify-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'p-2.5 rounded-xl transition-all duration-300 relative group',
                  isActive ? 'text-primary bg-primary/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
                title={item.name}
              >
                <item.icon className="w-5 h-5" />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Auth Section + Actions */}
        <div className="hidden md:flex items-center space-x-2 shrink-0">
          
          {/* Dark Mode Toggle */}
          <ThemeToggle />

          {authLoading ? (
            <div className="h-10 w-32 bg-accent animate-pulse rounded-full opacity-20" />
          ) : user ? (
            <div className="flex items-center space-x-1">
              {/* Messages */}
              <Link
                href="/chat"
                className="relative p-2 rounded-full hover:bg-accent transition-colors duration-300 group"
                title="Messages"
              >
                <MessageCircle className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[14px] h-[14px] text-[8px] font-bold text-white bg-red-500 rounded-full shadow-[0_0_0_2px_hsl(var(--background))] px-0.5">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Friends */}
              <Link
                href="/dashboard/friends"
                className="relative p-2 rounded-full hover:bg-accent transition-colors duration-300 group"
                title="Friends"
              >
                <Users className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                {requestCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[14px] h-[14px] text-[8px] font-bold text-white bg-primary rounded-full shadow-[0_0_0_2px_hsl(var(--background))] px-0.5">
                    {requestCount > 99 ? '99+' : requestCount}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              <div className="relative p-1">
                <NotificationBell />
              </div>

              <div className="h-6 w-[1px] bg-border/60 mx-1" />

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="group flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-accent transition-all duration-300 border border-transparent hover:border-border/50 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                    <div className="relative">
                      {user?.avatar ? (
                        <Image
                          src={getAvatarUrl(user.avatar)!}
                          alt="Avatar"
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-background group-hover:ring-primary/30 transition-all duration-300"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-background group-hover:ring-primary/30 transition-all duration-300 text-primary">
                          <UserIcon className="h-4 w-4" />
                        </div>
                      )}
                      {/* Status dot / Unread indicator */}
                      {(requestCount > 0 || unreadCount > 0) && (
                        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-red-500 border-2 border-background rounded-full" />
                      )}
                    </div>
                    <span className="text-sm font-semibold max-w-[100px] truncate hidden xl:block text-foreground/90 group-hover:text-foreground">
                      {user?.firstName || 'User'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors hidden xl:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl border-border/40 shadow-xl shadow-black/5 dark:shadow-black/20 bg-background/95 backdrop-blur-xl">
                  <div className="flex items-center gap-3 p-3">
                    <UserAvatar user={user} className="h-10 w-10 rounded-lg ring-1 ring-border" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold truncate">{user.firstName} {user.lastName}</span>
                      <span className="text-xs text-muted-foreground truncate">{user.username}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-border/50" />
                  
                  <div className="p-1">
                    <Link href="/dashboard">
                      <DropdownMenuItem className="cursor-pointer rounded-md py-2.5 focus:bg-primary/10 focus:text-primary transition-colors">
                        <Layers className="mr-2 h-4 w-4" />
                        <span className="font-medium">Dashboard</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/profile/shrine">
                      <DropdownMenuItem className="cursor-pointer rounded-md py-2.5 focus:bg-orange-500/10 focus:text-orange-500 transition-colors">
                        <Flame className="mr-2 h-4 w-4" />
                        <span className="font-medium">Favorite Characters</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/dashboard/friends">
                      <DropdownMenuItem className="cursor-pointer rounded-md py-2.5 focus:bg-blue-500/10 focus:text-blue-500 transition-colors flex justify-between items-center">
                        <div className="flex items-center">
                          <Users className="mr-2 h-4 w-4" />
                          <span className="font-medium">Friends</span>
                        </div>
                        {requestCount > 0 && (
                          <span className="bg-red-500/10 text-red-500 text-xs font-bold px-2 py-0.5 rounded-full">
                            {requestCount} new
                          </span>
                        )}
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/chat">
                      <DropdownMenuItem className="cursor-pointer rounded-md py-2.5 focus:bg-purple-500/10 focus:text-purple-500 transition-colors flex justify-between items-center">
                        <div className="flex items-center">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          <span className="font-medium">Messages</span>
                        </div>
                        {unreadCount > 0 && (
                          <span className="bg-purple-500/10 text-purple-500 text-xs font-bold px-2 py-0.5 rounded-full">
                            {unreadCount} unread
                          </span>
                        )}
                      </DropdownMenuItem>
                    </Link>
                  </div>

                  <DropdownMenuSeparator className="bg-border/50" />
                  <div className="p-1">
                    <DropdownMenuItem 
                      onClick={logout}
                      className="cursor-pointer rounded-md py-2.5 text-red-500 focus:bg-red-500/10 focus:text-red-500 transition-colors"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span className="font-medium">Log out</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

            </div>
          ) : (
            <div className="flex items-center space-x-3 ml-2">
              <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="font-semibold hover:bg-accent hover:text-primary rounded-full px-5 transition-colors duration-300">
                  Log in
                </Button>
              </Link>
              <Link href="/auth/register" onClick={() => setIsMenuOpen(false)}>
                <Button className="font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 rounded-full px-6 transition-all duration-300 hover:-translate-y-0.5">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="lg:hidden flex items-center gap-2">
          {/* Mobile Global Search (assuming GlobalSearch component handles mobile view well, otherwise we'd add an icon) */}
          <div className="w-8">
             <GlobalSearch />
          </div>

          {user && (
            <div className="relative">
              <NotificationBell />
            </div>
          )}
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="p-2 -mr-2 rounded-full hover:bg-accent transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6 text-foreground" /> : <Menu className="h-6 w-6 text-foreground" />}
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
            className="lg:hidden border-t border-border/40 bg-background/95 backdrop-blur-2xl overflow-hidden shadow-2xl absolute w-full top-full"
          >
            <nav className="container py-6 space-y-8 max-h-[80vh] overflow-y-auto">
              {/* Nav Items Grid */}
              <div className="grid grid-cols-2 gap-3">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        'flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-300',
                        isActive
                          ? 'bg-primary/10 border-primary/20 text-primary shadow-sm'
                          : 'bg-secondary/30 border-transparent text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                      )}
                    >
                      <item.icon className={cn("w-6 h-6", isActive ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-xs font-bold uppercase tracking-wider">{item.name}</span>
                    </Link>
                  )
                })}
              </div>

              {/* Theme Section */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">Settings</h3>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="flex items-center justify-between w-full p-4 rounded-2xl bg-secondary/30 border border-transparent hover:bg-secondary/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                      theme === 'dark' ? "bg-blue-500/10" : "bg-orange-500/10"
                    )}>
                      {theme === 'dark' ? <Moon className="w-5 h-5 text-blue-400" /> : <Sun className="w-5 h-5 text-orange-500" />}
                    </div>
                    <span className="text-sm font-bold">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                  </div>
                  <div className="w-12 h-6 bg-muted rounded-full relative p-1 group-hover:bg-muted/80 transition-colors shadow-inner">
                    <motion.div
                      animate={{ x: theme === 'dark' ? 24 : 0 }}
                      className="w-4 h-4 bg-background rounded-full shadow-md"
                    />
                  </div>
                </button>
              </div>

              {/* Account Section */}
              <div className="space-y-3 pt-4 border-t border-border/40">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">Account</h3>
                {user ? (
                  <div className="space-y-3">
                    {/* User Profile Summary */}
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/10 hover:border-primary/20 transition-all"
                    >
                      <UserAvatar user={user} className="h-12 w-12 rounded-xl ring-2 ring-primary/20" />
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold truncate">{user?.firstName}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Level {user?.level || 1} • {user?.rank || 'Beginner'}</p>
                      </div>
                      <Layers className="w-5 h-5 text-primary opacity-50" />
                    </Link>

                    {/* Action Links Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <Link href="/dashboard/friends" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" className="w-full gap-2 justify-start h-12 rounded-xl border-transparent bg-secondary/40 hover:bg-secondary/60">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-bold">Friends</span>
                          {requestCount > 0 && <span className="ml-auto w-5 h-5 flex items-center justify-center bg-red-500/20 text-red-500 rounded-full text-[10px] font-bold">{requestCount}</span>}
                        </Button>
                      </Link>
                      <Link href="/chat" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" className="w-full gap-2 justify-start h-12 rounded-xl border-transparent bg-secondary/40 hover:bg-secondary/60">
                          <MessageCircle className="w-4 h-4 text-purple-500" />
                          <span className="text-xs font-bold">Inbox</span>
                          {unreadCount > 0 && <span className="ml-auto w-5 h-5 flex items-center justify-center bg-purple-500/20 text-purple-500 rounded-full text-[10px] font-bold">{unreadCount}</span>}
                        </Button>
                      </Link>
                      <Link href="/profile/shrine" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" className="w-full gap-2 justify-start h-12 rounded-xl border-transparent bg-secondary/40 hover:bg-secondary/60">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span className="text-xs font-bold">Favorite Characters</span>
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        onClick={logout}
                        className="w-full gap-2 justify-start h-12 rounded-xl border-transparent bg-red-500/5 hover:bg-red-500/10 text-red-500"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-xs font-bold">Logout</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <Link href="/auth/login" onClick={() => setIsMenuOpen(false)} className="w-full">
                      <Button variant="outline" className="w-full h-12 rounded-xl border-border bg-secondary/20 hover:bg-secondary/40 font-bold text-sm tracking-wide">
                        Log in
                      </Button>
                    </Link>
                    <Link href="/auth/register" onClick={() => setIsMenuOpen(false)} className="w-full">
                      <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 text-sm tracking-wide">
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