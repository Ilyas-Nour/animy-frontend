'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import { useChatSounds } from '@/hooks/useChatSounds'

interface SocketContextType {
    socket: Socket | null
    isConnected: boolean
    onlineUsers: Set<string>
    unreadCount: number
    refreshUnreadCount: () => void
    // Sound & Active Chat State
    activeFriendId: string | null
    setActiveFriendId: (id: string | null) => void
    isMuted: boolean
    toggleMute: () => void
    playNotif: () => void
    playSent: () => void
    globalVolume: number
    setVolume: (val: number) => void
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    onlineUsers: new Set(),
    unreadCount: 0,
    refreshUnreadCount: () => { },
    activeFriendId: null,
    setActiveFriendId: () => { },
    isMuted: false,
    toggleMute: () => { },
    playNotif: () => { },
    playSent: () => { },
    globalVolume: 1.0,
    setVolume: () => { },
})

export const useSocket = () => useContext(SocketContext)

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const { user, token } = useAuth()
    const [socket, setSocket] = useState<Socket | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
    const [unreadCount, setUnreadCount] = useState(0)

    // Track which chat is currently open to suppress sounds
    const [activeFriendId, setActiveFriendIdState] = useState<string | null>(null)
    const activeFriendIdRef = React.useRef<string | null>(null)

    const setActiveFriendId = (id: string | null) => {
        setActiveFriendIdState(id)
        activeFriendIdRef.current = id
    }

    // Centralize Chat Sounds
    const { isMuted, toggleMute, playNotif, playSent, globalVolume, setVolume } = useChatSounds()



    const refreshUnreadCount = React.useCallback(async () => {
        if (!token) return
        try {
            const res = await api.get('/chat/unread-count')
            const count = res.data?.count ?? res.data?.data?.count ?? 0;
            setUnreadCount(count)
        } catch (error) {
            console.error('Failed to fetch unread count', error)
        }
    }, [token])

    useEffect(() => {
        if (!token || !user) {
            if (socket) {
                socket.disconnect()
                setSocket(null)
                setIsConnected(false)
                setUnreadCount(0)
            }
            return
        }

        const wsUrl = process.env.NEXT_PUBLIC_API_URL
            ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '')
            : 'http://localhost:3001';

        const newSocket = io(wsUrl, {
            path: '/socket.io',
            auth: {
                token,
            },
            autoConnect: true,
            transports: ['websocket', 'polling'],
        })

        newSocket.on('connect', () => {
            setIsConnected(true)
            refreshUnreadCount()
        })

        newSocket.on('disconnect', () => {
            setIsConnected(false)
        })

        newSocket.on('user:online', ({ userId }: { userId: string }) => {
            setOnlineUsers((prev) => new Set(prev).add(userId))
        })

        newSocket.on('connected:users', ({ users }: { users: string[] }) => {
            setOnlineUsers(new Set(users));
        })

        newSocket.on('user:offline', ({ userId }: { userId: string }) => {
            setOnlineUsers((prev) => {
                const next = new Set(prev)
                next.delete(userId)
                return next
            })
        })

        // Global message listener for sounds (message:notification is sent to user room)
        newSocket.on('message:notification', (message: any) => {
            console.log('Socket: message:notification received', message)

            // Only play sound if NOT from current user
            if (message.senderId !== user.id) {
                // Check against REF to avoid stale closure or dependency requirement
                if (message.senderId !== activeFriendIdRef.current) {
                    console.log('Socket: Triggering notification sound', { sender: message.senderId, active: activeFriendIdRef.current })
                    playNotif()
                }
                refreshUnreadCount()
            }
        })

        setSocket(newSocket)

        return () => {
            newSocket.disconnect()
        }
    }, [token, user, playNotif, refreshUnreadCount]) // Removed activeFriendId dependency to prevent socket reconnections, added refreshUnreadCount

    // Polling fallback
    useEffect(() => {
        if (!token || !user) return
        const interval = setInterval(() => {
            refreshUnreadCount()
        }, 5000)
        return () => clearInterval(interval)
    }, [token, user, refreshUnreadCount])

    return (
        <SocketContext.Provider value={{
            socket,
            isConnected,
            onlineUsers,
            unreadCount,
            refreshUnreadCount,
            activeFriendId,
            setActiveFriendId,
            isMuted,
            toggleMute,
            playNotif,
            playSent,
            globalVolume,
            setVolume
        }}>
            {children}
        </SocketContext.Provider>
    )
}
