'use client'

import { useState, useEffect } from 'react'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import { Search, MessageCircle, MoreVertical, Bell, Plus, Settings, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { cn, getAvatarUrl } from '@/lib/utils'
import Image from 'next/image'
import UserAvatar from '@/components/common/UserAvatar'
import { motion, AnimatePresence } from 'framer-motion'

interface Friend {
    id: string
    username: string
    avatar?: string
}

interface Conversation {
    id: string
    updatedAt: string
    friend: Friend
    unreadCount: number
    messages: {
        id?: string
        content: string
        senderId: string
        createdAt: string
        messageType: string
        status?: string
    }[]
}

interface ConversationSidebarProps {
    selectedFriendId: string | null
    onSelectFriend: (friendId: string) => void
    isMobile?: boolean
    onMobileSelect?: () => void
}

export default function ConversationSidebar({
    selectedFriendId,
    onSelectFriend,
    isMobile,
    onMobileSelect
}: ConversationSidebarProps) {
    const { user } = useAuth()
    const { socket, onlineUsers } = useSocket()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Initial fetch
    useEffect(() => {
        fetchData()
    }, [])

    // Socket events for real-time updates
    useEffect(() => {
        if (!socket) return

        // Update when receiving a message
        const handleNewMessage = (newMessage: any) => {
            setConversations(prev => {
                // Check if conversation exists (by friend ID)
                const existingIndex = prev.findIndex(c => c.friend.id === newMessage.senderId || c.friend.id === newMessage.receiverId) // Check both for sender/receiver updates

                if (existingIndex > -1) {
                    const updated = [...prev]
                    const c = updated[existingIndex]
                    // If I am the sender, unread count doesn't increase for me. 
                    // If I am receiver and selected, count 0. Else +1.
                    const isMyMessage = newMessage.senderId === (socket as any).userId; // crude check, or pass user from props
                    const isSelected = selectedFriendId === newMessage.senderId

                    const newUnreadCount = isMyMessage ? c.unreadCount : (isSelected ? 0 : c.unreadCount + 1);

                    updated[existingIndex] = {
                        ...c,
                        unreadCount: newUnreadCount,
                        messages: [newMessage],
                        updatedAt: new Date().toISOString()
                    }
                    return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                } else {
                    // re-fetch to safely add new conversation
                    fetchData()
                    return prev
                }
            })
        }

        socket.on('message:notification', handleNewMessage)
        socket.on('message:new', handleNewMessage) // Also listen to room events (for sender update)

        socket.on('conversation:read_receipt', ({ conversationId, readBy }: { conversationId: string, readBy: string }) => {
            // If I read it, clear my local unread count for that conversation
            if (readBy === user?.id) {
                setConversations(prev => prev.map(c =>
                    c.id === conversationId ? { ...c, unreadCount: 0 } : c
                ))
            } else {
                // If friend read my messages, update status of last message to READ
                setConversations(prev => prev.map(c =>
                    c.id === conversationId ? {
                        ...c,
                        messages: c.messages.map(m => ({ ...m, status: 'READ' }))
                    } : c
                ))
            }
        })

        socket.on('message:read', ({ conversationId }: { conversationId: string }) => {
            // Optional: Mark local as read if needed
        })

        return () => {
            socket.off('message:notification', handleNewMessage)
            socket.off('message:new', handleNewMessage)
            socket.off('message:read')
        }
    }, [socket, selectedFriendId])

    const [debugInfo, setDebugInfo] = useState<string>('')

    const fetchData = async () => {
        try {
            setError(null)

            // Fetch individually to catch specific errors
            let conversationsRes, friendsRes

            try {
                conversationsRes = await api.get('/chat/conversations')
            } catch (err: any) {
                console.error('Chat API failed', err)
                throw new Error(`Chat API: ${err.response?.status || err.message}`)
            }

            try {
                friendsRes = await api.get('/friends/list')
            } catch (err: any) {
                console.error('Friends API failed', err)
                throw new Error(`Friends API: ${err.response?.status || err.message}`)
            }

            // Debug: Capture first 100 chars of response to see structure
            setDebugInfo(JSON.stringify(friendsRes.data).slice(0, 150))

            // Unwrap the NestJS TransformInterceptor response: { success: true, data: ... }
            const activeConversations: Conversation[] = conversationsRes.data.data || []
            const allFriends: any[] = friendsRes.data.data?.friends || []

            // Map friends to Conversation structure
            const merged: Conversation[] = allFriends.map(friend => {
                const existingConv = activeConversations.find(c => c.friend.id === friend.id)
                if (existingConv) {
                    return existingConv
                }

                // Placeholder for friend without chat history
                return {
                    id: `new_${friend.id}`,
                    updatedAt: new Date(friend.createdAt || Date.now()).toISOString(),
                    friend: {
                        id: friend.id,
                        username: friend.username,
                        avatar: friend.avatar
                    },
                    unreadCount: 0,
                    messages: [] // No messages
                }
            })

            // Sort: Prioritize conversations with messages, then by latest message time
            merged.sort((a, b) => {
                const lastMsgA = a.messages[0]
                const lastMsgB = b.messages[0]

                const timeA = lastMsgA ? new Date(lastMsgA.createdAt).getTime() : new Date(a.updatedAt).getTime()
                const timeB = lastMsgB ? new Date(lastMsgB.createdAt).getTime() : new Date(b.updatedAt).getTime()

                return timeB - timeA
            })

            setConversations(merged)
        } catch (error: any) {
            console.error('Failed to fetch data:', error)
            setError(error.message || 'Fetch failed')
        } finally {
            setLoading(false)
        }
    }

    const handleSelect = (friendId: string, conversationId: string) => {
        onSelectFriend(friendId)

        // Reset unread count locally if it's a real conversation
        if (!conversationId.startsWith('new_')) {
            setConversations(prev => prev.map(c =>
                c.id === conversationId ? { ...c, unreadCount: 0 } : c
            ))
        }

        if (isMobile && onMobileSelect) {
            onMobileSelect()
        }
    }

    const filteredConversations = conversations.filter((c) =>
        c.friend.username.toLowerCase().includes(searchQuery.toLowerCase())
    )



    return (
        <div className="w-full md:w-85 h-full bg-background/40 backdrop-blur-2xl border-r border-white/5 flex flex-col shadow-2xl relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="p-6 border-b border-white/5 space-y-5 relative z-10 bg-background/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg shadow-purple-500/20">
                            <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
                            AniChat
                        </h2>
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="p-2 hover:bg-white/5 rounded-full transition-colors relative group">
                            <Bell className="w-4.5 h-4.5 text-muted-foreground group-hover:text-yellow-400" />
                            <div className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full border-2 border-background" />
                        </button>
                        <button className="p-2 hover:bg-white/5 rounded-full transition-colors group">
                            <Settings className="w-4.5 h-4.5 text-muted-foreground group-hover:text-white" />
                        </button>
                    </div>
                </div>

                <div className="relative group">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-purple-400 transition-all duration-300" />
                    <Input
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 bg-white/5 border-white/5 focus:bg-white/10 focus:border-purple-500/30 text-foreground placeholder:text-muted-foreground/50 transition-all rounded-2xl shadow-inner shadow-black/20"
                    />
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto scrollbar-none relative z-10 px-3 py-4">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-white/5 animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5">
                            <Sparkles className="w-10 h-10 text-purple-400/30" />
                        </div>
                        <h3 className="font-semibold text-foreground/80 mb-1">No chats yet</h3>
                        <p className="text-sm text-muted-foreground/60 max-w-[180px]">Find friends to start an inquiry or a new adventure!</p>
                        <button className="mt-6 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-sm font-medium hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-500/20">
                            Find Friends
                        </button>
                    </div>
                ) : (
                    <div className="space-y-1">
                        <AnimatePresence initial={false}>
                            {filteredConversations.map((conversation, index) => {
                                const isSelected = selectedFriendId === conversation.friend.id
                                const lastMessage = conversation.messages[0]
                                const isOnline = onlineUsers.has(conversation.friend.id)

                                return (
                                    <motion.div
                                        key={conversation.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        layout
                                        onClick={() => handleSelect(conversation.friend.id, conversation.id)}
                                        className={cn(
                                            "group p-3.5 rounded-2xl cursor-pointer transition-all duration-300 relative border border-transparent",
                                            isSelected
                                                ? "bg-white/10 border-white/10 shadow-xl shadow-black/10 scale-[1.02]"
                                                : "hover:bg-white/5 hover:border-white/5"
                                        )}
                                    >
                                        {isSelected && (
                                            <motion.div
                                                layoutId="active-pill"
                                                className="absolute left-2 top-3 bottom-3 w-1 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full"
                                            />
                                        )}

                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="relative shrink-0">
                                                <div className={cn(
                                                    "rounded-2xl transition-all duration-500 p-0.5",
                                                    isSelected ? "ring-2 ring-purple-500/50" : "group-hover:ring-2 group-hover:ring-white/10"
                                                )}>
                                                    <UserAvatar
                                                        user={conversation.friend}
                                                        size="lg"
                                                        className="rounded-xl shadow-md"
                                                    />
                                                </div>
                                                <AnimatePresence>
                                                    {isOnline && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            exit={{ scale: 0 }}
                                                            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-3 border-background rounded-full shadow-lg"
                                                        />
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h3 className={cn(
                                                        "font-bold truncate pr-2 transition-colors",
                                                        isSelected ? "text-white" : "text-white/80 group-hover:text-white"
                                                    )}>
                                                        {conversation.friend.username}
                                                    </h3>
                                                    {(lastMessage?.createdAt || conversation.updatedAt) && (
                                                        <span className="text-[10px] font-medium text-white/30 whitespace-nowrap">
                                                            {format(new Date(lastMessage?.createdAt || conversation.updatedAt), 'HH:mm')}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex justify-between items-center gap-2">
                                                    <p className={cn(
                                                        "text-xs truncate transition-all duration-300",
                                                        isSelected ? "text-white/60" : "text-white/40 group-hover:text-white/60",
                                                        conversation.unreadCount > 0 && "text-white/90 font-bold"
                                                    )}>
                                                        {lastMessage?.senderId === conversation.friend.id ? '' : 'You: '}
                                                        {lastMessage?.messageType === 'TEXT'
                                                            ? lastMessage.content
                                                            : lastMessage?.messageType ? `[${lastMessage.messageType}]` : 'Start a conversation...'}
                                                    </p>

                                                    {conversation.unreadCount > 0 && (
                                                        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-0 h-5 px-2 min-w-[20px] rounded-lg shadow-lg shadow-purple-500/20 text-[10px] font-bold">
                                                            {conversation.unreadCount}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    )
}
