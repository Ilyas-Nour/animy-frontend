'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import MessageInput from './MessageInput'
import { Loader2, ArrowLeft, Check, CheckCheck, MoreVertical, User, X, Volume2, VolumeX, Settings, Edit2, Trash2, Flame, ExternalLink } from 'lucide-react'
import { ChatSettingsModal } from './ChatSettingsModal'
import { cn, getAvatarUrl } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'

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

    status?: MessageStatus
    createdAt: string

    // Advanced fields
    isEdited?: boolean
    isDeletedForAll?: boolean
    deletedBy?: string[]
    reactions?: Reaction[]

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
                // Try to find friend in the list first (faster) via generic friend endpoint if available, 
                // or just rely on what we have. 
                // We use the new ID-based endpoint
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

    const handleSendMessage = (content: string, messageType: 'TEXT' | 'STICKER' | 'ANIME_CARD' = 'TEXT', animeId?: number) => {
        if (!socket || !friendId) return

        socket.emit('message:send', {
            to: friendId,
            content,
            type: messageType,
            animeId
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
                return <CheckCheck className="w-3.5 h-3.5 text-white" strokeWidth={2.5} /> // White double check (was blue)
            case MessageStatus.DELIVERED:
                return <CheckCheck className="w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} /> // Light gray double check
            case MessageStatus.SENT:
            default:
                return <Check className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} /> // Single gray check
        }
    }

    return (
        <div className="flex flex-col h-full bg-background relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-grid-white/[0.02] dark:bg-grid-white/[0.02] bg-grid-black/[0.02] -z-[1]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="p-4 border-b border-border/50 bg-background/80 backdrop-blur-xl flex items-center justify-between z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="mr-1 p-2 hover:bg-accent rounded-full md:hidden transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                        </button>
                    )}

                    <div className="relative">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-border shadow-lg ring-2 ring-purple-500/20">
                            {friendInfo?.avatar && !imageError ? (
                                <Image
                                    src={getAvatarUrl(friendInfo.avatar)!}
                                    alt={friendInfo?.username}
                                    fill
                                    className="object-cover rounded-full"
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-full">
                                    {friendInfo?.username?.[0]?.toUpperCase() || '?'}
                                </div>
                            )}
                        </div>
                        {/* Status Indicator */}
                        {/* Status Indicator */}
                        <div className={cn(
                            "absolute bottom-0 right-0 w-3 h-3 border-2 border-background rounded-full",
                            onlineUsers.has(friendId)
                                ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                                : "bg-gray-500"
                        )}></div>
                    </div>

                    <div className="min-w-0 flex-1 ml-2">
                        <h3 className="font-bold text-foreground flex items-center gap-2 truncate text-sm sm:text-base">
                            <span className="truncate">{friendInfo?.username || 'Chat'}</span>
                        </h3>
                        {typingUser ? (
                            <span className="text-xs text-purple-500 animate-pulse font-medium">Typing...</span>
                        ) : (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <span className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    onlineUsers.has(friendId)
                                        ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                                        : "bg-gray-500"
                                )}></span>
                                {onlineUsers.has(friendId) ? 'Online' : 'Offline'}
                            </span>
                        )}
                    </div>
                </div>


                <div className="flex items-center gap-1">
                    <button
                        onClick={toggleMute}
                        className="p-2.5 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground transition-all hover:scale-105 active:scale-95"
                        title={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2.5 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground transition-all hover:scale-105 active:scale-95"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>

                        {isMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsMenuOpen(false)}
                                />
                                <div className="absolute right-0 top-12 w-48 bg-popover border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                        onClick={() => {
                                            router.push(`/users/${friendInfo?.username}`)
                                            setIsMenuOpen(false)
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors"
                                    >
                                        <User className="w-4 h-4" />
                                        Visit Profile
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsSettingsOpen(true)
                                            setIsMenuOpen(false)
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors"
                                    >
                                        <Settings className="w-4 h-4 text-purple-500" />
                                        Chat Settings
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (onBack) onBack()
                                            setIsMenuOpen(false)
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                        Close Chat
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 flex flex-col scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground opacity-50 space-y-4">
                        <div className="p-6 bg-secondary/50 rounded-full ring-1 ring-border">
                            <span className="text-4xl">👋</span>
                        </div>
                        <p className="text-sm font-medium">No messages yet. Say hello!</p>
                    </div>
                )}

                {messages.map((message, i) => {
                    const isMyMessage = message.senderId === user?.id
                    const showAvatar = !isMyMessage && (i === 0 || messages[i - 1].senderId !== message.senderId);

                    return (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            isMyMessage={isMyMessage}
                            showAvatar={showAvatar}
                            friendInfo={friendInfo}
                            onEdit={handleEditMessage}
                            onDelete={handleDeleteMessage}
                            onReact={handleReactMessage}
                            currentUserId={user?.id}
                        />
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-background/80 backdrop-blur-xl border-t border-border z-10">
                <MessageInput
                    onSendMessage={handleSendMessage}
                    onTyping={handleTyping}
                />
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
    showAvatar,
    friendInfo,
    onEdit,
    onDelete,
    onReact,
    currentUserId
}: {
    message: Message,
    isMyMessage: boolean,
    showAvatar: boolean,
    friendInfo: any,
    onEdit: (id: string, content: string) => void,
    onDelete: (id: string, forEveryone: boolean) => void,
    onReact: (id: string, type: string) => void,
    currentUserId?: string
}) {
    const [showMenu, setShowMenu] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
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
        <div className={cn(
            "flex items-end gap-2 group relative mb-1",
            isMyMessage ? "ml-auto flex-row-reverse" : "mr-auto"
        )}>
            {!isMyMessage && (
                <div className={cn("w-6 h-6 rounded-full overflow-hidden shrink-0 opacity-0", showAvatar && "opacity-100 mb-0.5")}>
                    {friendInfo?.avatar ? (
                        <Image src={getAvatarUrl(friendInfo.avatar)!} alt="Avatar" width={24} height={24} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center text-[10px] text-muted-foreground">
                            {friendInfo?.username?.[0]?.toUpperCase()}
                        </div>
                    )}
                </div>
            )}

            <div className={cn("flex flex-col relative", isMyMessage ? "items-end" : "items-start")}>
                {/* Bubble Container */}
                <div className="flex items-center gap-2 group/bubble">
                    {/* Hover Actions Menu Trigger */}
                    {!message.isDeletedForAll && (
                        <div className={cn(
                            "opacity-0 group-hover/bubble:opacity-100 transition-opacity flex items-center gap-1",
                            isMyMessage ? "order-1" : "order-2"
                        )}>
                            <div className="relative">
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-1.5 hover:bg-accent rounded-full text-muted-foreground"
                                >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                </button>
                                {showMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                                        <div className="absolute bottom-full mb-1 right-0 w-32 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden py-1">
                                            <button
                                                onClick={() => { onReact(message.id, 'HEART'); setShowMenu(false); }}
                                                className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent flex items-center gap-2"
                                            >
                                                ❤️ {myReaction?.type === 'HEART' ? 'Remove' : 'Heart'}
                                            </button>
                                            {isMyMessage && (
                                                <>
                                                    <button
                                                        onClick={() => { setIsEditing(true); setShowMenu(false); }}
                                                        className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent flex items-center gap-2"
                                                    >
                                                        <Edit2 className="w-3 h-3" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => { onDelete(message.id, true); setShowMenu(false); }}
                                                        className="w-full px-3 py-1.5 text-xs text-left hover:bg-rose-500/10 text-red-500 flex items-center gap-2"
                                                    >
                                                        <Trash2 className="w-3 h-3" /> Delete All
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => { onDelete(message.id, false); setShowMenu(false); }}
                                                className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent flex items-center gap-2"
                                            >
                                                <X className="w-3 h-3" /> Delete Me
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actual Bubble */}
                    <div className={cn(
                        "p-3 rounded-2xl shadow-sm relative transition-all duration-200 border",
                        ['STICKER', 'ANIME_CARD', 'MEDIA_CARD'].includes(message.messageType)
                            ? "bg-transparent border-transparent shadow-none p-0"
                            : isMyMessage
                                ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-tr-sm border-white/10"
                                : "bg-card text-card-foreground rounded-tl-sm border-border/50",
                        message.isDeletedForAll && "italic opacity-50 bg-secondary/30",
                        isMyMessage ? "order-2" : "order-1"
                    )}>
                        {isEditing ? (
                            <div className="flex flex-col gap-2 min-w-[200px]">
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="bg-black/20 border border-white/20 rounded p-2 text-sm text-white focus:outline-none"
                                    rows={2}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setIsEditing(false)} className="text-[10px] hover:underline">Cancel</button>
                                    <button onClick={handleEditSave} className="text-[10px] font-bold bg-white text-black px-2 py-0.5 rounded">Save</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {message.messageType === 'STICKER' ? (
                                    <img src={message.content} alt="Sticker" className="w-32 h-32 object-contain" />
                                ) : message.messageType === 'TEXT' ? (
                                    <p className="break-words leading-relaxed text-[15px]">{message.content}</p>
                                ) : message.messageType === 'MEDIA_CARD' && (
                                    <div className="block w-64 bg-card/40 backdrop-blur-md rounded-[2rem] overflow-hidden border border-border/50 shadow-xl group/card transition-all hover:border-indigo-500/30">
                                        {message.mediaImage && (
                                            <div className="relative aspect-[16/10] w-full overflow-hidden">
                                                <Image
                                                    src={message.mediaImage}
                                                    alt="Media"
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover/card:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                                <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30 flex items-center gap-1.5">
                                                    <Flame className="w-3 h-3 text-indigo-400 animate-pulse" />
                                                    <span className="text-[8px] font-black text-indigo-300 uppercase tracking-widest">Signal</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="p-4 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">{message.mediaType}</span>
                                                <div className="h-px flex-1 bg-border/30" />
                                            </div>
                                            <p className="text-xs font-black leading-tight text-foreground line-clamp-2 uppercase tracking-tight italic scale-y-110">
                                                {message.mediaTitle}
                                            </p>
                                            <Link
                                                href={message.mediaType === 'NEWS' ? `/news` : (message.mediaType === 'PROFILE' ? `/users/${message.mediaTitle}` : `/${message.mediaType?.toLowerCase()}/${message.mediaId}`)}
                                                className="mt-2 flex items-center justify-center gap-2 w-full py-2 bg-secondary/50 hover:bg-indigo-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-border group-hover/card:border-indigo-500/50"
                                            >
                                                View Transmission
                                                <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                <div className={cn(
                                    "text-[9px] mt-1 flex items-center justify-end gap-1 opacity-70",
                                    isMyMessage ? "text-white/80" : "text-muted-foreground"
                                )}>
                                    {message.isEdited && !message.isDeletedForAll && <span className="mr-1 italic">(edited)</span>}
                                    {message.createdAt && format(new Date(message.createdAt), 'HH:mm')}
                                    {isMyMessage && !message.isDeletedForAll && <span>{getStatusIcon(message.status)}</span>}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Reactions Display */}
                {reactions.length > 0 && (
                    <div className={cn(
                        "flex flex-wrap gap-1 mt-1",
                        isMyMessage ? "justify-end" : "justify-start"
                    )}>
                        {Array.from(new Set(reactions.map(r => r.type))).map(type => (
                            <button
                                key={type}
                                onClick={() => onReact(message.id, type)}
                                className={cn(
                                    "px-1.5 py-0.5 rounded-full text-[10px] border flex items-center gap-1 transition-colors",
                                    reactions.some(r => r.userId === currentUserId && r.type === type)
                                        ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                                        : "bg-secondary/50 border-border text-muted-foreground"
                                )}
                            >
                                {type === 'HEART' ? '❤️' : type}
                                <span>{reactions.filter(r => r.type === type).length}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
