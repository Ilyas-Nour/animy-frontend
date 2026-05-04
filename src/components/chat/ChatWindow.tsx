'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import MessageInput from './MessageInput'
import { Loader2, ArrowLeft, Check, CheckCheck, MoreVertical, User, X, Volume2, VolumeX, Settings, Edit2, Trash2, CornerDownRight, ExternalLink, Smile, Sparkles, Plus } from 'lucide-react'
import { ChatSettingsModal } from './ChatSettingsModal'
import { cn, getAvatarUrl } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import UserAvatar from '@/components/common/UserAvatar'
import { format } from 'date-fns'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import { motion, AnimatePresence } from 'framer-motion'
import MessageBubble from './MessageBubble'

const COMMON_REACTION_EMOJIS = [
    '❤️', '😂', '🔥', '👍', '😮', '😢', '💀', '💯', '🙏', '🎉', '😡', '🤔',
    '👀', '✨', '✅', '❌', '🙌', '💪', '🚀', '🌈'
]

enum MessageStatus {
    SENT = 'SENT',
    DELIVERED = 'DELIVERED',
    READ = 'READ'
}

interface Reaction {
    userId: string
    type: string
    user?: {
        username: string
    }
}

interface Message {
    id: string
    senderId: string
    content: string
    messageType: 'TEXT' | 'STICKER' | 'ANIME_CARD' | 'MEDIA_CARD'
    animeId?: number
    mediaId?: string
    mediaType?: 'ANIME' | 'MANGA' | 'CHARACTER' | 'PROFILE' | 'NEWS'
    mediaTitle?: string
    mediaImage?: string

    status?: 'SENT' | 'DELIVERED' | 'READ'
    createdAt: string

    // Advanced fields
    isEdited?: boolean
    isDeletedForAll?: boolean
    read?: boolean
    deletedBy?: string[]
    reactions?: Reaction[]

    // Reply functionality
    parentId?: string
    parent?: {
        id: string
        content: string
        sender: {
            username: string
        }
    }

    sender: {
        id: string
        username: string
        avatar?: string
    }
}

interface ChatWindowProps {
    friendId: string
    onBack?: () => void
}

export default function ChatWindow({ friendId, onBack }: ChatWindowProps) {
    const { user } = useAuth()
    const router = useRouter()
    const [messages, setMessages] = useState<Message[]>([])
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [friendInfo, setFriendInfo] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [typingUser, setTypingUser] = useState<string | null>(null)
    const [imageError, setImageError] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [replyingTo, setReplyingTo] = useState<Message | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const conversationIdRef = useRef<string | null>(null)
    const {
        socket,
        onlineUsers,
        refreshUnreadCount,
        setActiveFriendId,
        isMuted,
        toggleMute,
        globalVolume,
        setVolume,
        playSent
    } = useSocket()

    // Manage activeFriendId for sound suppression
    useEffect(() => {
        setActiveFriendId(friendId)
        return () => setActiveFriendId(null)
    }, [friendId, setActiveFriendId])

    // Sync ref with state
    useEffect(() => {
        conversationIdRef.current = conversationId
    }, [conversationId])

    // Reset image error when friend changes
    useEffect(() => {
        setImageError(false)
    }, [friendId])

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Join conversation when friendId changes
    useEffect(() => {
        if (!socket || !friendId) {
            return
        }

        // Fetch friend info immediately to show header while connecting
        const fetchFriendInfo = async () => {
            try {
                const res = await api.get(`/users/id/${friendId}`)
                if (res.data) {
                    setFriendInfo({
                        id: res.data.id,
                        username: res.data.username,
                        avatar: res.data.avatar
                    })
                }
            } catch (err) {
                console.log('Failed to fetch friend info for header', err)
            }
        }
        fetchFriendInfo()

        setLoading(true)
        setMessages([])
        setConversationId(null)

        // Join conversation
        socket.emit('conversation:join', { friendId })

        const handleConversationJoined = (data: any) => {
            setConversationId(data.conversationId)
            setMessages(data.messages)
            setFriendInfo(data.friend)
            setLoading(false)

            // Mark conversation as read (clears unread count)
            if (data.conversationId) {
                socket.emit('conversation:read', { conversationId: data.conversationId })
            }
        }

        const handleNewMessage = (message: Message) => {
            setMessages((prev) => [...prev, message])

            // If message is from friend, mark as read immediately
            if (message.senderId === friendId && conversationIdRef.current) {
                socket?.emit('message:read', { messageId: message.id, conversationId: conversationIdRef.current })
                // Refresh unread count to keep badge in sync
                refreshUnreadCount()
            }
        }

        const handleStatusUpdate = ({ messageId, status }: { messageId: string, status: MessageStatus }) => {
            setMessages(prev => prev.map(msg =>
                msg.id === messageId ? { ...msg, status } : msg
            ))
        }

        const handleConventionReadReceipt = ({ conversationId: cId, readBy }: { conversationId: string, readBy: string }) => {
            // If I read it, refresh my unread count
            if (readBy === user?.id) {
                refreshUnreadCount()
            }
            if (cId === conversationIdRef.current) {
                setMessages(prev => prev.map(msg =>
                    msg.senderId !== readBy ? { ...msg, status: MessageStatus.READ } : msg
                ))
            }
        }

        const handleTypingActive = ({ userId }: { userId: string }) => {
            if (userId !== user?.id) {
                setTypingUser(userId)
            }
        }

        const handleTypingInactive = () => {
            setTypingUser(null)
        }

        const handleMessageUpdated = (updated: Message) => {
            setMessages(prev => prev.map(msg => msg.id === updated.id ? { ...msg, ...updated } : msg))
        }

        const handleMessageDeletedAll = ({ messageId }: { messageId: string }) => {
            setMessages(prev => prev.map(msg =>
                msg.id === messageId ? { ...msg, content: "This message was deleted", isDeletedForAll: true } : msg
            ))
        }

        const handleMessageDeletedMe = ({ messageId }: { messageId: string }) => {
            setMessages(prev => prev.filter(msg => msg.id !== messageId))
        }

        const handleReactionsUpdated = ({ messageId, reactions }: { messageId: string, reactions: Reaction[] }) => {
            setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, reactions } : msg))
        }

        const handleConversationCleared = () => {
            setMessages([])
        }

        socket.on('conversation:joined', handleConversationJoined)
        socket.on('message:receive', handleNewMessage)
        socket.on('message:status_update', handleStatusUpdate)
        socket.on('conversation:read_receipt', handleConventionReadReceipt)
        socket.on('typing:active', handleTypingActive)
        socket.on('typing:inactive', handleTypingInactive)
        socket.on('message:updated', handleMessageUpdated)
        socket.on('message:deleted_all', handleMessageDeletedAll)
        socket.on('message:deleted_me', handleMessageDeletedMe)
        socket.on('message:reactions_updated', handleReactionsUpdated)
        socket.on('conversation:cleared', handleConversationCleared)

        return () => {
            socket.off('conversation:joined', handleConversationJoined)
            socket.off('message:receive', handleNewMessage)
            socket.off('message:status_update', handleStatusUpdate)
            socket.off('conversation:read_receipt', handleConventionReadReceipt)
            socket.off('typing:active', handleTypingActive)
            socket.off('typing:inactive', handleTypingInactive)
            socket.off('message:updated', handleMessageUpdated)
            socket.off('message:deleted_all', handleMessageDeletedAll)
            socket.off('message:deleted_me', handleMessageDeletedMe)
            socket.off('message:reactions_updated', handleReactionsUpdated)
            socket.off('conversation:cleared', handleConversationCleared)
        }
    }, [socket, friendId, user?.id, refreshUnreadCount])

    const handleSendMessage = (content: string, messageType: 'TEXT' | 'STICKER' | 'ANIME_CARD' | 'MEDIA_CARD' = 'TEXT', animeId?: number, parentId?: string) => {
        if (!socket || !friendId) return

        socket.emit('message:send', {
            to: friendId,
            content,
            type: messageType,
            animeId,
            parentId
        })
    }

    const handleTyping = (isTyping: boolean) => {
        if (!socket || !friendId || !conversationId) return

        socket.emit(isTyping ? 'typing:start' : 'typing:stop', {
            conversationId
        })
    }

    const handleEditMessage = useCallback((messageId: string, content: string) => {
        if (!socket || !content.trim()) return
        socket.emit('message:edit', { messageId, content })
    }, [socket])

    const handleDeleteMessage = useCallback((messageId: string, forEveryone: boolean) => {
        if (!socket) return
        socket.emit('message:delete', { messageId, forEveryone })
    }, [socket])

    const handleReactMessage = useCallback((messageId: string, type: string) => {
        if (!socket) return
        socket.emit('message:react', { messageId, type })
    }, [socket])

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background/50 backdrop-blur-sm h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    const getStatusIcon = (status?: MessageStatus) => {
        switch (status) {
            case MessageStatus.READ:
                return <CheckCheck className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            case MessageStatus.DELIVERED:
                return <CheckCheck className="w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
            case MessageStatus.SENT:
            default:
                return <Check className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
        }
    }

    return (
        <div className="flex flex-col h-full bg-background relative overflow-hidden font-sans">
            {/* Animy DNA: Ambient Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none opacity-50 dark:opacity-20" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none opacity-50 dark:opacity-20" />
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.02] pointer-events-none mix-blend-overlay" />

            {/* Header (Glassmorphic) */}
            <div className="flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-border/40 z-20 shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onBack}
                            className="p-2 hover:bg-white/5 rounded-2xl md:hidden transition-colors border border-transparent hover:border-white/10"
                        >
                            <ArrowLeft className="w-5 h-5 text-foreground/80" />
                        </motion.button>
                    )}

                    <div className="relative group">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative"
                        >
                            {friendInfo?.avatar && !imageError ? (
                                <Image
                                    src={getAvatarUrl(friendInfo.avatar)!}
                                    alt={friendInfo?.username}
                                    fill
                                    className="object-cover"
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg font-black bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                                    {friendInfo?.username?.[0]?.toUpperCase() || '?'}
                                </div>
                            )}
                        </motion.div>
                        <AnimatePresence>
                            {onlineUsers.has(friendId) && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-3 border-[#0a0a0a] rounded-full shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="min-w-0">
                        <h3 className="font-black text-foreground flex items-center gap-2 truncate text-base tracking-tight">
                            <span className="truncate">{friendInfo?.username || 'Chat'}</span>
                        </h3>
                        <div className="flex items-center gap-2">
                            {typingUser ? (
                                <div className="flex items-center gap-1">
                                    <div className="flex gap-0.5">
                                        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-purple-500 rounded-full" />
                                        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-purple-500 rounded-full" />
                                        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-purple-500 rounded-full" />
                                    </div>
                                    <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">Typing</span>
                                </div>
                            ) : (
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                    <div className={cn(
                                        "w-1.5 h-1.5 rounded-full shadow-sm",
                                        onlineUsers.has(friendId) ? "bg-green-500" : "bg-white/20"
                                    )} />
                                    {onlineUsers.has(friendId) ? 'Active Now' : 'Offline'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleMute}
                        className="p-2.5 hover:bg-white/5 rounded-2xl text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-white/5"
                        title={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5" />}
                    </motion.button>

                    <div className="relative">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2.5 hover:bg-white/5 rounded-2xl text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-white/5"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </motion.button>

                        <AnimatePresence>
                            {isMenuOpen && (
                                <>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsMenuOpen(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-14 w-52 bg-[#1a1a1a]/95 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-2xl z-50 overflow-hidden p-1.5"
                                    >
                                        <button
                                            onClick={() => {
                                                router.push(`/users/${friendInfo?.username}`)
                                                setIsMenuOpen(false)
                                            }}
                                            className="w-full text-left px-3 py-2.5 text-sm text-foreground/80 hover:bg-white/5 hover:text-white rounded-xl flex items-center gap-3 transition-colors group"
                                        >
                                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                <User className="w-4 h-4" />
                                            </div>
                                            Visit Profile
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsSettingsOpen(true)
                                                setIsMenuOpen(false)
                                            }}
                                            className="w-full text-left px-3 py-2.5 text-sm text-foreground/80 hover:bg-white/5 hover:text-white rounded-xl flex items-center gap-3 transition-colors group"
                                        >
                                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                                <Settings className="w-4 h-4" />
                                            </div>
                                            Chat Settings
                                        </button>
                                        <div className="my-1 h-px bg-white/5 mx-2" />
                                        <button
                                            onClick={() => {
                                                if (onBack) onBack()
                                                setIsMenuOpen(false)
                                            }}
                                            className="w-full text-left px-3 py-2.5 text-sm text-rose-500 hover:bg-rose-500/10 rounded-xl flex items-center gap-3 transition-colors group"
                                        >
                                            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                                                <X className="w-4 h-4" />
                                            </div>
                                            Close Chat
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 overscroll-contain touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-6 opacity-30 select-none">
                        <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-purple-500/20 to-blue-500/20 flex items-center justify-center backdrop-blur-3xl animate-pulse">
                            <Sparkles className="w-10 h-10 text-white/50" />
                        </div>
                        <p className="text-sm font-medium tracking-widest uppercase text-white/40">Start the conversation</p>
                    </div>
                ) : (
                    messages.map((message, index) => {
                        const isMyMessage = message.senderId === user?.id
                        const isSticker = message.messageType === 'STICKER'

                        // Date Separator Logic
                        const showDateSeparator = index === 0 ||
                            new Date(messages[index - 1].createdAt).toDateString() !== new Date(message.createdAt).toDateString()

                        return (
                            <div key={message.id} className="w-full flex flex-col">
                                {showDateSeparator && (
                                    <div className="flex justify-center my-4 sticky top-2 z-10">
                                        <div className="bg-background/80 backdrop-blur-md px-3 py-1 rounded-full border border-border/40 shadow-sm">
                                            <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                                                {format(new Date(message.createdAt), 'MMMM d, yyyy')}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <MessageBubble
                                    message={message}
                                    isMyMessage={isMyMessage}
                                    friendInfo={friendInfo}
                                    onEdit={handleEditMessage}
                                    onDelete={handleDeleteMessage}
                                    onReact={handleReactMessage}
                                    onReply={setReplyingTo}
                                    currentUserId={user?.id}
                                />
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Futuristic Message Input */}
            <div className="z-20 bg-background/40 backdrop-blur-3xl border-t border-white/5 px-4 py-4 sm:px-6">
                <div>
                    <MessageInput
                        onSendMessage={handleSendMessage}
                        onTyping={handleTyping}
                        replyingTo={replyingTo}
                        onCancelReply={() => setReplyingTo(null)}
                    />
                </div>
            </div>

            <ChatSettingsModal
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                isMuted={isMuted}
                toggleMute={toggleMute}
                volume={globalVolume}
                onVolumeChange={setVolume}
                onTestSound={playSent}
                onClearChat={() => {
                    if (socket && conversationId) {
                        socket.emit('conversation:clear', { conversationId })
                    }
                }}
            />
        </div >
    )
}

const getStatusIcon = (status?: MessageStatus) => {
    switch (status) {
        case MessageStatus.READ:
            return <CheckCheck className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        case MessageStatus.DELIVERED:
            return <CheckCheck className="w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
        case MessageStatus.SENT:
        default:
            return <Check className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
    }
}

