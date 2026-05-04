'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check } from 'lucide-react'
import api from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { getAvatarUrl, getInitials, cn } from '@/lib/utils'
import { useSocket } from '@/contexts/SocketContext'

interface Notification {
    id: string
    type: 'REPLY' | 'REACTION' | 'MENTION' | 'SYSTEM'
    message: string
    read: boolean
    createdAt: string
    link?: string
    sender?: {
        id: string
        username: string
        avatar?: string
        firstName?: string
    }
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const { socket, playNotif } = useSocket()

    const fetchAllocations = useCallback(async () => {
        try {
            const [countRes, listRes] = await Promise.all([
                api.get('/notifications/unread-count'),
                api.get('/notifications')
            ])
            // Unwrap data from interceptor: res.data.data
            setUnreadCount(countRes.data?.data || 0)
            const notifs = listRes.data?.data || []
            setNotifications(Array.isArray(notifs) ? notifs : [])
        } catch (error) {
            console.error("Failed to fetch notifications")
            setNotifications([])
        }
    }, [])

    useEffect(() => {
        fetchAllocations()

        if (!socket) return

        const handleNewNotification = (notification: Notification) => {
            console.log('[NotificationBell] Received real-time signal:', notification)
            setNotifications(prev => [notification, ...prev].slice(0, 20))
            setUnreadCount(prev => prev + 1)
            playNotif()
        }

        socket.on('notification:receive', handleNewNotification)

        return () => {
            socket.off('notification:receive', handleNewNotification)
        }
    }, [socket, fetchAllocations, playNotif])

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`)
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (err) { console.error(err) }
    }

    const markAllRead = async () => {
        try {
            await api.post('/notifications/mark-all-read')
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            setUnreadCount(0)
        } catch (err) { console.error(err) }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-accent"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-background" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute right-0 mt-3 w-80 md:w-96 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden z-50 origin-top-right"
                    >
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h3 className="text-sm font-bold text-foreground">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1 font-black uppercase tracking-widest"
                                >
                                    <Check className="w-3 h-3" /> Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto scrollbar-none">
                            {!Array.isArray(notifications) || notifications.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-xs italic">
                                    No new signals...
                                </div>
                            ) : (
                                notifications.map(notification => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onRead={() => markAsRead(notification.id)}
                                        onClose={() => setIsOpen(false)}
                                    />
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function NotificationItem({ notification, onRead, onClose }: { notification: Notification, onRead: () => void, onClose: () => void }) {
    return (
        <Link
            href={notification.link || '#'}
            onClick={() => {
                onRead()
                onClose()
            }}
            className={cn(
                "block p-4 border-b border-border/50 hover:bg-accent transition-all duration-300",
                !notification.read && "bg-indigo-500/[0.03] dark:bg-indigo-500/[0.05]"
            )}
        >
            <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent overflow-hidden shrink-0 border border-border/50 shadow-sm">
                    {notification.sender?.avatar ? (
                        <img
                            src={getAvatarUrl(notification.sender.avatar)}
                            alt={notification.sender.username}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-black text-foreground">
                            {notification.sender?.username ? getInitials(notification.sender.username) : "S"}
                        </div>
                    )}
                </div>
                <div className="flex-1 space-y-1">
                    <p className="text-sm text-foreground/80 leading-snug font-medium">
                        <span className="font-black text-foreground">{notification.sender?.firstName || notification.sender?.username || "System"}</span>
                        {' '}{notification.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                </div>
                {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0 animate-pulse" />
                )}
            </div>
        </Link>
    )
}
