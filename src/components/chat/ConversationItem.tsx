'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import UserAvatar from '@/components/common/UserAvatar'
import { format } from 'date-fns'

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

interface ConversationItemProps {
    conversation: Conversation
    isSelected: boolean
    isOnline: boolean
    currentUserId?: string
    onSelect: (friendId: string, conversationId: string) => void
    index: number
}

const ConversationItem = React.memo(({
    conversation,
    isSelected,
    isOnline,
    currentUserId,
    onSelect,
    index
}: ConversationItemProps) => {
    const lastMessage = conversation.messages[0]

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            layout
            onClick={() => onSelect(conversation.friend.id, conversation.id)}
            className={cn(
                "group p-3.5 rounded-2xl cursor-pointer transition-all duration-300 relative border border-transparent",
                isSelected
                    ? "bg-muted/60 border-border/40 shadow-xl shadow-black/5 scale-[1.02]"
                    : "hover:bg-muted/40 hover:border-border/40"
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
                        isOnline ? "ring-2 ring-green-500/50" : "group-hover:ring-2 group-hover:ring-border/40"
                    )}>
                        <UserAvatar user={conversation.friend} className="w-12 h-12 text-base rounded-xl shadow-md" />
                    </div>
                    {isOnline && (
                        <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-20"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 border-2 border-background"></span>
                        </span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                        <h3 className={cn(
                            "font-bold truncate pr-2 transition-colors",
                            isSelected ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"
                        )}>
                            {conversation.friend.username}
                        </h3>
                        {lastMessage && (
                            <span className={cn(
                                "text-[10px] font-medium whitespace-nowrap",
                                isSelected ? "text-muted-foreground" : "text-muted-foreground/70"
                            )}>
                                {format(new Date(lastMessage.createdAt), 'HH:mm')}
                            </span>
                        )}
                    </div>
                    <div className="flex justify-between items-center gap-2">
                        {lastMessage ? (
                            <p className={cn(
                                "text-xs truncate transition-all duration-300",
                                isSelected ? "text-muted-foreground" : "text-muted-foreground/70 group-hover:text-muted-foreground"
                            )}>
                                {lastMessage.senderId === currentUserId && <span className="opacity-70 mr-1">You:</span>}
                                {lastMessage.content}
                            </p>
                        ) : (
                            <span className="text-xs italic text-muted-foreground/50 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                New Chat
                            </span>
                        )}
                        {conversation.unreadCount > 0 && (
                            <Badge className="h-5 min-w-[1.25rem] px-1.5 flex items-center justify-center bg-purple-500 text-white border-0 shadow-lg shadow-purple-500/30 text-[10px] font-bold">
                                {conversation.unreadCount}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}, (prevProps, nextProps) => {
    // Custom comparison for React.memo
    // We only re-render if:
    // 1. Selection state changes
    // 2. Online status changes
    // 3. Unread count changes
    // 4. Last message changes (content or time)
    // 5. Friend details overlap (rare, but possible if username changes)

    const prevMsg = prevProps.conversation.messages[0]
    const nextMsg = nextProps.conversation.messages[0]

    return (
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.isOnline === nextProps.isOnline &&
        prevProps.conversation.unreadCount === nextProps.conversation.unreadCount &&
        prevMsg?.id === nextMsg?.id &&
        prevMsg?.content === nextMsg?.content &&
        prevMsg?.createdAt === nextMsg?.createdAt &&
        prevProps.conversation.friend.username === nextProps.conversation.friend.username &&
        prevProps.conversation.friend.avatar === nextProps.conversation.friend.avatar
    )
})

ConversationItem.displayName = 'ConversationItem'

export default ConversationItem
