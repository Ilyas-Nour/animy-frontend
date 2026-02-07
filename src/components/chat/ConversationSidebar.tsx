'use client'

import { useState, useEffect } from 'react'
import { useSocket } from '@/contexts/SocketContext'
import api from '@/lib/api'
import { Search, MessageCircle, MoreVertical, Bell, Phone, Bug } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { cn, getAvatarUrl } from '@/lib/utils'
import Image from 'next/image'

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
        <div className="w-full md:w-80 h-full bg-background/95 backdrop-blur-xl border-r border-border flex flex-col">

            <div className="p-4 border-b border-border space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="relative z-10 text-2xl font-black tracking-tight">
                        <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            A
                        </span>
                        <span className="text-foreground">niChat</span>
                    </h2>
                    <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
                </div>
                <div className="relative group">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground group-focus-within:text-purple-400 transition-colors" />
                    <Input
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-secondary/50 border-input focus:bg-background focus:border-purple-500/50 text-foreground placeholder:text-muted-foreground transition-all rounded-xl"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {loading ? (
                    <div className="p-4 flex flex-col gap-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground opacity-60">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No conversations found</p>
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {filteredConversations.map(conversation => {
                            const isSelected = selectedFriendId === conversation.friend.id
                            const lastMessage = conversation.messages[0]

                            return (
                                <div
                                    key={conversation.id}
                                    onClick={() => handleSelect(conversation.friend.id, conversation.id)}
                                    className={cn(
                                        "p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent group relative overflow-hidden",
                                        isSelected
                                            ? "bg-accent border-border shadow-sm"
                                            : "hover:bg-accent/50 hover:border-border/50"
                                    )}
                                >
                                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 rounded-l-xl" />}

                                    <div className="flex items-start gap-3 relative z-10">
                                        <div className="relative shrink-0">
                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-muted ring-2 ring-transparent group-hover:ring-border transition-all">
                                                {conversation.friend.avatar ? (
                                                    <Image
                                                        src={getAvatarUrl(conversation.friend.avatar)!}
                                                        alt={conversation.friend.username}
                                                        fill
                                                        className="object-cover rounded-full"
                                                        sizes="48px"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center font-bold bg-gradient-to-br from-purple-900 to-indigo-900 text-purple-200 rounded-full">
                                                        {conversation.friend.username?.[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            {onlineUsers.has(conversation.friend.id) && (
                                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <h3 className={cn(
                                                    "font-semibold truncate pr-2 transition-colors",
                                                    isSelected ? "text-foreground" : "text-foreground group-hover:text-primary"
                                                )}>
                                                    {conversation.friend.username}
                                                </h3>
                                                {(lastMessage?.createdAt || conversation.updatedAt) && (
                                                    <span className={cn(
                                                        "text-[10px] whitespace-nowrap",
                                                        isSelected ? "text-muted-foreground" : "text-muted-foreground"
                                                    )}>
                                                        {format(new Date(lastMessage?.createdAt || conversation.updatedAt), 'HH:mm')}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-center gap-2">
                                                <p className={cn(
                                                    "text-sm truncate max-w-[140px]",
                                                    isSelected ? "text-muted-foreground" : "text-muted-foreground group-hover:text-foreground",
                                                    conversation.unreadCount > 0 && "font-semibold text-foreground"
                                                )}>
                                                    {lastMessage?.senderId === conversation.friend.id ? '' : 'You: '}
                                                    {lastMessage?.messageType === 'TEXT'
                                                        ? lastMessage.content
                                                        : lastMessage?.messageType ? `[${lastMessage.messageType}]` : 'Start a conversation'}
                                                </p>

                                                {conversation.unreadCount > 0 && (
                                                    <Badge className="bg-purple-500 hover:bg-purple-600 text-white border-0 h-5 min-w-[20px] px-1.5 flex items-center justify-center animate-in zoom-in spin-in-3">
                                                        {conversation.unreadCount}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
