'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreVertical, Check, CheckCheck, CornerDownRight, ExternalLink, Sparkles, Plus, Edit2, Trash2 } from 'lucide-react'
import { cn, getAvatarUrl } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import React from 'react'

const COMMON_REACTION_EMOJIS = [
    '❤️', '😂', '🔥', '👍', '😮', '😢', '💀', '💯', '🙏', '🎉', '😡', '🤔',
    '👀', '✨', '✅', '❌', '🙌', '💪', '🚀', '🌈'
]

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
    isEdited?: boolean
    isDeletedForAll?: boolean
    read?: boolean
    deletedBy?: string[]
    reactions?: {
        userId: string
        type: string
        user?: {
            username: string
        }
    }[]
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

interface MessageBubbleProps {
    message: Message
    isMyMessage: boolean
    friendInfo: any
    onEdit: (id: string, content: string) => void
    onDelete: (id: string, forEveryone: boolean) => void
    onReact: (id: string, type: string) => void
    onReply: (message: Message) => void
    currentUserId?: string
}

const MessageBubble = React.memo(({
    message,
    isMyMessage,
    friendInfo,
    onEdit,
    onDelete,
    onReact,
    onReply,
    currentUserId
}: MessageBubbleProps) => {
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
            className={cn("flex w-full mb-1", isMyMessage ? "justify-end" : "justify-start px-2")}
        >
            <div className={cn(
                "flex flex-col min-w-0 max-w-[75%] relative group/bubble",
                isMyMessage ? "items-end" : "items-start"
            )}>
                {/* Reply Context */}
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
                        "p-3 rounded-xl shadow-sm relative transition-all duration-300 border backdrop-blur-md overflow-hidden min-w-[85px]",
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

                                {/* Timestamp & Status */}
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

                    {/* Actions Menu Trigger */}
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
                                                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-muted flex items-center gap-3 text-sm font-medium transition-colors"
                                                    >
                                                        <CornerDownRight className="w-4 h-4 text-muted-foreground" />
                                                        Reply
                                                    </button>
                                                    {isMyMessage && (
                                                        <>
                                                            <button
                                                                onClick={() => { setIsEditing(true); setShowMenu(false); }}
                                                                className="w-full text-left px-3 py-2 rounded-xl hover:bg-muted flex items-center gap-3 text-sm font-medium transition-colors"
                                                            >
                                                                <Edit2 className="w-4 h-4 text-muted-foreground" />
                                                                Edit Message
                                                            </button>
                                                            <button
                                                                onClick={() => { onDelete(message.id, true); setShowMenu(false); }}
                                                                className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-500/10 text-red-500 flex items-center gap-3 text-sm font-medium transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Unsend for Everyone
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => { onDelete(message.id, false); setShowMenu(false); }}
                                                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-500/10 text-red-500 flex items-center gap-3 text-sm font-medium transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete for Me
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </div>

                {/* Reactions Display */}
                {reactions.length > 0 && (
                    <div className={cn(
                        "flex flex-wrap gap-1 mt-1 z-0 relative",
                        isMyMessage ? "justify-end" : "justify-start"
                    )}>
                        {reactions.map((reaction, i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="bg-background/80 backdrop-blur-md border border-border/50 rounded-full px-1.5 py-0.5 text-[10px] shadow-sm flex items-center gap-1 select-none"
                            >
                                <span>{reaction.type}</span>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Hidden Date (for screen readers / semantics) */}
                <span className="sr-only">Sent at {format(new Date(message.createdAt), 'p')}</span>
            </div>

            {/* Emoji Picker Modal */}
            <AnimatePresence>
                {showEmojiPicker && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setShowEmojiPicker(false)}
                    >
                        <div onClick={e => e.stopPropagation()} className="bg-background rounded-3xl overflow-hidden shadow-2xl">
                            <EmojiPicker
                                onEmojiClick={(emojiData) => {
                                    onReact(message.id, emojiData.emoji);
                                    setShowEmojiPicker(false);
                                    setShowMenu(false);
                                }}
                                theme={Theme.AUTO}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}, (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Returns true if props are equal (do NOT re-render)
    return (
        prevProps.message.id === nextProps.message.id &&
        prevProps.message.content === nextProps.message.content &&
        prevProps.message.status === nextProps.message.status &&
        prevProps.message.isEdited === nextProps.message.isEdited &&
        prevProps.message.isDeletedForAll === nextProps.message.isDeletedForAll &&
        prevProps.message.reactions?.length === nextProps.message.reactions?.length &&
        prevProps.isMyMessage === nextProps.isMyMessage &&
        prevProps.currentUserId === nextProps.currentUserId
        // We can likely skip checking functions since they should be stable via useCallback in parent
    )
})

MessageBubble.displayName = 'MessageBubble'

export default MessageBubble
