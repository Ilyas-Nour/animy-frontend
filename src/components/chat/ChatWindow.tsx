'use client'

import { useState, useEffect, useRef } from 'react'
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
    }, [socket, friendId, user?.id])

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

    const handleEditMessage = (messageId: string, content: string) => {
        if (!socket || !content.trim()) return
        socket.emit('message:edit', { messageId, content })
    }

    const handleDeleteMessage = (messageId: string, forEveryone: boolean) => {
        if (!socket) return
        socket.emit('message:delete', { messageId, forEveryone })
    }

    const handleReactMessage = (messageId: string, type: string) => {
        if (!socket) return
        socket.emit('message:react', { messageId, type })
    }

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
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
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

function MessageBubble({
    message,
    isMyMessage,
    friendInfo,
    onEdit,
    onDelete,
    onReact,
    onReply,
    currentUserId
}: {
    message: Message,
    isMyMessage: boolean,
    friendInfo: any,
    onEdit: (id: string, content: string) => void,
    onDelete: (id: string, forEveryone: boolean) => void,
    onReact: (id: string, type: string) => void,
    onReply: (message: Message) => void,
    currentUserId?: string
}) {
    const [showMenu, setShowMenu] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [editContent, setEditContent] = useState(message.content)

    const handleEditSave = () => {
        if (editContent.trim() && editContent !== message.content) {
            onEdit(message.id, editContent)
        }
        setIsEditing(false)
    }

    const reactions = message.reactions || []
    const myReaction = reactions.find(r => r.userId === currentUserId)

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{ zIndex: showMenu ? 50 : "auto", position: "relative" }}
            className={cn("flex w-full mb-1", isMyMessage ? "justify-end" : "justify-start px-2")} // Added padding for left messages
        >

            <div className={cn(
                "flex flex-col min-w-0 max-w-[75%] relative group/bubble",
                isMyMessage ? "items-end" : "items-start"
            )}>
                {/* Reply Context (Redesigned) */}
                {message.parent && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "mb-[-12px] pb-3 pt-1.5 px-3 rounded-t-xl text-xs flex flex-col gap-0.5 relative z-0 layer-behind",
                            isMyMessage
                                ? "bg-purple-500/10 border-t border-x border-purple-500/20 mr-3 items-end"
                                : "bg-muted border-t border-x border-border/40 ml-3 items-start"
                        )}
                    >
                        <div className="flex items-center gap-1.5 opacity-70">
                            <CornerDownRight className={cn("w-3 h-3", isMyMessage ? "text-purple-500" : "text-muted-foreground")} />
                            <span className={cn("font-black uppercase tracking-widest text-[7px]", isMyMessage ? "text-purple-500" : "text-muted-foreground")}>In response to @{message.parent.sender.username}</span>
                        </div>
                        <p className={cn("line-clamp-1 italic text-xs", isMyMessage ? "text-purple-500/70" : "text-muted-foreground")}>{message.parent.content}</p>
                    </motion.div>
                )}

                {/* Bubble Container */}
                <div className="flex items-center gap-1 group/bubble relative z-10">
                    {/* Bubble Content */}
                    <div className={cn(
                        "p-3 rounded-xl shadow-sm relative transition-all duration-300 border backdrop-blur-md overflow-hidden",
                        ['STICKER', 'ANIME_CARD', 'MEDIA_CARD'].includes(message.messageType)
                            ? "bg-transparent border-transparent shadow-none p-0 !rounded-none"
                            : isMyMessage
                                ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white border-transparent"
                                : "bg-white dark:bg-white/5 border-border/40 dark:border-white/5 text-foreground dark:text-gray-100 shadow-sm",
                        message.isDeletedForAll && "italic opacity-60 bg-muted/50",
                        isMyMessage ? "order-2 rounded-tr-none" : "order-1 rounded-tl-none"
                    )}>
                        {/* Bubble Background Shine */}
                        {isMyMessage && !['STICKER', 'ANIME_CARD', 'MEDIA_CARD'].includes(message.messageType) && (
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
                        )}

                        {isEditing ? (
                            <div className="flex flex-col gap-2 min-w-[200px]">
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="bg-background/50 border border-border/50 rounded-lg p-2 text-sm text-foreground focus:outline-none focus:ring-2 ring-purple-500/50 transition-all font-medium leading-relaxed"
                                    rows={2}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-1.5">
                                    <button onClick={() => setIsEditing(false)} className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest hover:text-foreground transition-colors text-muted-foreground">Cancel</button>
                                    <button onClick={handleEditSave} className="px-3 py-0.5 text-[9px] font-black uppercase tracking-widest bg-foreground text-background rounded-md hover:bg-purple-500 hover:text-white transition-all">Update</button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {message.messageType === 'STICKER' ? (
                                    <motion.img
                                        whileHover={{ scale: 1.1 }}
                                        src={message.content}
                                        alt="Sticker"
                                        className="w-32 h-32 object-contain drop-shadow-2xl"
                                    />
                                ) : message.messageType === 'TEXT' ? (
                                    <p className="break-words [overflow-wrap:anywhere] leading-relaxed text-sm font-medium tracking-tight select-text whitespace-pre-wrap pb-4">{message.content}</p>
                                ) : message.messageType === 'MEDIA_CARD' && (
                                    <motion.div
                                        whileHover={{ y: -5 }}
                                        className="block w-64 bg-background/40 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden border border-white/10 shadow-3xl group/card transition-all"
                                    >
                                        {message.mediaImage && (
                                            <div className="relative aspect-[16/10] w-full overflow-hidden">
                                                <Image
                                                    src={message.mediaImage}
                                                    alt="Media"
                                                    fill
                                                    className="object-cover transition-transform duration-700 group-hover/card:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                                                <div className="absolute top-4 left-4 flex gap-2">
                                                    <div className="px-2.5 py-1 rounded-full bg-purple-500/20 backdrop-blur-md border border-purple-500/30 flex items-center gap-1.5 ring-1 ring-purple-500/20">
                                                        <Sparkles className="w-3 h-3 text-purple-400" />
                                                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Featured</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="p-5 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black text-purple-400 uppercase tracking-[0.25em]">{message.mediaType}</span>
                                                <div className="h-px flex-1 bg-white/5" />
                                            </div>
                                            <p className="text-sm font-black leading-tight text-white line-clamp-2 uppercase tracking-tight italic">
                                                {message.mediaTitle}
                                            </p>
                                            <Link
                                                href={message.mediaType === 'NEWS' ? `/news` : (message.mediaType === 'PROFILE' ? `/users/${message.mediaTitle}` : `/${message.mediaType?.toLowerCase()}/${message.mediaId}`)}
                                                className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 active:scale-[0.98]"
                                            >
                                                Open Database
                                                <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Timestamp & Status (Inside Bubble) */}
                                {message.messageType !== 'STICKER' && (
                                    <div className={cn(
                                        "absolute bottom-1 right-2 flex items-center gap-1 text-[10px] select-none",
                                        isMyMessage ? "text-white/70" : "text-muted-foreground/60 dark:text-white/50"
                                    )}>
                                        <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {isMyMessage && (
                                            <span className={cn(
                                                "flex items-center",
                                                message.read ? "text-blue-200" : "text-white/70"
                                            )}>
                                                {message.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>


                    {/* Actions Menu Trigger (Redesigned) */}
                    {!message.isDeletedForAll && (
                        <div className={cn(
                            "opacity-0 group-hover/bubble:opacity-100 transition-all duration-300 flex items-center gap-1",
                            isMyMessage ? "order-1" : "order-2"
                        )}>
                            <div className="relative">
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-2 bg-muted/50 hover:bg-muted rounded-2xl text-muted-foreground hover:text-foreground transition-all border border-border/40"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </motion.button>
                                <AnimatePresence>
                                    {showMenu && (
                                        <>
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="fixed inset-0 z-40"
                                                onClick={() => setShowMenu(false)}
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                className="absolute bottom-full mb-3 right-0 w-64 bg-popover/95 backdrop-blur-3xl border border-border/50 rounded-3xl shadow-2xl z-50 overflow-hidden p-2"
                                            >
                                                {/* Quick Reactions */}
                                                <div className="px-3 py-3 border-b border-border/10 mb-2 bg-muted/30 rounded-2xl">
                                                    <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-3 px-1">Express Sentiment</p>
                                                    <div className="grid grid-cols-5 gap-1.5">
                                                        {COMMON_REACTION_EMOJIS.slice(0, 9).map(emoji => (
                                                            <motion.button
                                                                key={emoji}
                                                                whileHover={{ scale: 1.3, rotate: [0, -10, 10, 0] }}
                                                                whileTap={{ scale: 0.8 }}
                                                                onClick={() => { onReact(message.id, emoji); setShowMenu(false); }}
                                                                className={cn(
                                                                    "text-xl p-1.5 rounded-xl hover:bg-muted transition-colors",
                                                                    myReaction?.type === emoji && "bg-purple-500/20 ring-1 ring-purple-500/50"
                                                                )}
                                                            >
                                                                {emoji}
                                                            </motion.button>
                                                        ))}
                                                        <button
                                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                            className="text-lg p-1.5 rounded-xl hover:bg-purple-500 bg-muted/50 text-foreground transition-all flex items-center justify-center"
                                                        >
                                                            <Plus className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <button
                                                        onClick={() => { onReply(message); setShowMenu(false); }}
                                                        className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted/50 rounded-xl flex items-center gap-3 transition-colors group/item"
                                                    >
                                                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 group-hover/item:bg-orange-500 group-hover/item:text-white transition-all">
                                                            <CornerDownRight className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-bold text-muted-foreground group-hover/item:text-foreground">Reply</span>
                                                    </button>
                                                    {isMyMessage && (
                                                        <>
                                                            <button
                                                                onClick={() => { setIsEditing(true); setShowMenu(false); }}
                                                                className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted/50 rounded-xl flex items-center gap-3 transition-colors group/item"
                                                            >
                                                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover/item:bg-blue-500 group-hover/item:text-white transition-all">
                                                                    <Edit2 className="w-4 h-4" />
                                                                </div>
                                                                <span className="font-bold text-muted-foreground group-hover/item:text-foreground">Edit Transmission</span>
                                                            </button>
                                                            <button
                                                                onClick={() => { onDelete(message.id, true); setShowMenu(false); }}
                                                                className="w-full px-4 py-2.5 text-sm text-left hover:bg-rose-500/10 rounded-xl flex items-center gap-3 transition-colors group/item"
                                                            >
                                                                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 group-hover/item:bg-rose-500 group-hover/item:text-white transition-all">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </div>
                                                                <span className="font-bold text-rose-500">Delete Permanently</span>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </div>

                {/* Emojis Display (Redesigned) */}
                {reactions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                            "flex flex-wrap gap-1.5 mt-1 relative z-20",
                            isMyMessage ? "justify-end" : "justify-start"
                        )}
                    >
                        {Array.from(new Set(reactions.map(r => r.type))).map(type => (
                            <motion.button
                                key={type}
                                whileHover={{ scale: 1.1, y: -2 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onReact(message.id, type)}
                                className={cn(
                                    "px-2 py-1 rounded-full text-xs backdrop-blur-md border flex items-center gap-1.5 transition-all shadow-lg",
                                    reactions.some(r => r.userId === currentUserId && r.type === type)
                                        ? "bg-purple-500/20 border-purple-500/50 text-white font-black"
                                        : "bg-white/5 border-white/10 text-white/50"
                                )}
                            >
                                <span className="text-sm leading-none drop-shadow-md">{type}</span>
                                <span className="text-[10px] opacity-80">{reactions.filter(r => r.type === type).length}</span>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Emoji Picker Modal */}
            <AnimatePresence>
                {showEmojiPicker && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowEmojiPicker(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative z-[101] bg-[#1a1a1a] p-4 rounded-[2.5rem] border border-white/10 shadow-3xl"
                        >
                            <EmojiPicker
                                onEmojiClick={(emojiData) => {
                                    onReact(message.id, emojiData.emoji)
                                    setShowEmojiPicker(false)
                                    setShowMenu(false)
                                }}
                                theme={Theme.DARK}
                                width={350}
                                height={450}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
