'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Smile, X, Sticker, Sparkles, Flame, Plus } from 'lucide-react'
import { useSocket } from '@/contexts/SocketContext'
import { cn } from '@/lib/utils'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import { motion, AnimatePresence } from 'framer-motion'

interface MessageInputProps {
    onSendMessage: (content: string, messageType?: 'TEXT' | 'STICKER' | 'ANIME_CARD', animeId?: number, parentId?: string) => void
    onTyping: (isTyping: boolean) => void
    replyingTo?: {
        id: string
        content: string
        sender: {
            username: string
        }
    } | null
    onCancelReply?: () => void
}

const stickers = [
    { id: 1, name: 'Happy', url: '/stickers/happy.png' },
    { id: 2, name: 'Love', url: '/stickers/love.png' },
    { id: 3, name: 'Thumbs Up', url: '/stickers/thumbsup.png' },
    { id: 4, name: 'Cry', url: '/stickers/cry.png' },
    { id: 5, name: 'Laugh', url: '/stickers/laugh.png' },
    { id: 6, name: 'Shocked', url: '/stickers/shocked.png' },
    { id: 7, name: 'Angry', url: '/stickers/angry.png' },
    { id: 8, name: 'Sleepy', url: '/stickers/sleepy.png' },
    { id: 9, name: 'Cool', url: '/stickers/cool.png' },
    { id: 10, name: 'Animy Logo', url: '/stickers/animy_logo.png' },
    { id: 11, name: 'Mascot', url: '/stickers/animy_mascot.png' },
    { id: 12, name: 'WOW', url: '/stickers/wow.png' },
    { id: 13, name: 'Rage', url: '/stickers/rage.png' },
]

export default function MessageInput({ onSendMessage, onTyping, replyingTo, onCancelReply }: MessageInputProps) {
    const [message, setMessage] = useState('')
    const [showStickerPicker, setShowStickerPicker] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const { playSent } = useSocket()
    const inputRef = useRef<HTMLInputElement>(null)
    const emojiPickerRef = useRef<HTMLDivElement>(null)
    const stickerPickerRef = useRef<HTMLDivElement>(null)

    // Handle click outside to close pickers
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                // Check if the click was on the toggle button (to avoid immediate reopen)
                const target = event.target as Element;
                if (!target.closest('button[title="Insert emoji"]')) {
                    setShowEmojiPicker(false);
                }
            }
            if (showStickerPicker && stickerPickerRef.current && !stickerPickerRef.current.contains(event.target as Node)) {
                const target = event.target as Element;
                if (!target.closest('button[title="Send sticker"]')) {
                    setShowStickerPicker(false);
                }
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showEmojiPicker, showStickerPicker]);

    const handleEmojiClick = (emojiData: any) => {
        setMessage(prev => prev + emojiData.emoji)
        // Kept open for multiple selection
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value)
        onTyping(true)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => onTyping(false), 1000)
    }

    const handleSendMessage = () => {
        if (message.trim()) {
            playSent()
            onSendMessage(message.trim(), 'TEXT', undefined, replyingTo?.id)
            setMessage('')
            onTyping(false)
            if (onCancelReply) onCancelReply()
            setShowEmojiPicker(false)
            setShowStickerPicker(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const handleSendSticker = (stickerUrl: string) => {
        playSent()
        onSendMessage(stickerUrl, 'STICKER', undefined, replyingTo?.id)
        setShowStickerPicker(false)
        if (onCancelReply) onCancelReply()
    }

    return (
        <div className="flex flex-col gap-3 relative">
            {/* Reply Preview (Futuristic Redesign) */}
            <AnimatePresence>
                {replyingTo && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: 10, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex items-center gap-4 px-4 py-3 bg-purple-500/10 backdrop-blur-3xl rounded-2xl border border-purple-500/20 mb-1 group relative mx-4">
                            <div className="w-1 h-full absolute left-0 top-0 bottom-0 bg-gradient-to-b from-purple-500 to-blue-500 rounded-l-2xl" />
                            <div className="flex-1 min-w-0 pl-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <Flame className="w-3 h-3 text-purple-400" />
                                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Replying to @{replyingTo.sender.username}</span>
                                </div>
                                <p className="text-sm truncate text-muted-foreground italic font-medium">&quot;{replyingTo.content}&quot;</p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onCancelReply}
                                className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-4 h-4" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sticker Picker (Premium Grid) */}
            <AnimatePresence>
                {showStickerPicker && (
                    <motion.div
                        ref={stickerPickerRef}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="absolute bottom-full left-0 mb-4 bg-popover/95 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] shadow-2xl overflow-hidden z-50 ring-1 ring-border/5 w-full sm:w-auto"
                    >
                        <div className="flex items-center justify-between p-5 border-b border-border/10 bg-muted/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-500">
                                    <Sticker className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Sticker Transmission</span>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowStickerPicker(false)}
                                className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </motion.button>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 p-6 max-h-[300px] overflow-y-auto scrollbar-none">
                            {stickers.map((sticker) => (
                                <motion.button
                                    key={sticker.id}
                                    whileHover={{ scale: 1.15, y: -5 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleSendSticker(sticker.url)}
                                    className="aspect-square p-3 rounded-3xl bg-muted/30 hover:bg-muted border border-border/10 hover:border-border/30 transition-all flex items-center justify-center group relative overflow-hidden"
                                    title={sticker.name}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <img
                                        src={sticker.url}
                                        alt={sticker.name}
                                        className="w-full h-full object-contain drop-shadow-xl z-10"
                                    />
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Emoji Picker (Centered/Professional) */}
            <AnimatePresence>
                {showEmojiPicker && (
                    <motion.div
                        ref={emojiPickerRef}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="absolute bottom-full left-0 mb-4 z-[101] bg-background p-4 rounded-[2.5rem] border border-border/40 shadow-2xl"
                    >
                        <EmojiPicker
                            onEmojiClick={(emojiData) => handleEmojiClick(emojiData)}
                            theme={Theme.AUTO} // Adapts to system preference
                            width={350}
                            height={450}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Input Bar (Floating Pill) */}
            <div className="mx-4 mb-4 p-1.5 bg-background dark:bg-[#18181b] rounded-full border border-border/40 dark:border-white/10 flex items-center gap-2 shadow-2xl dark:shadow-black/50 relative z-20">
                <div className="flex items-center gap-1 pl-1">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            setShowStickerPicker(!showStickerPicker)
                            setShowEmojiPicker(false)
                        }}
                        className={cn(
                            "p-2.5 rounded-full transition-all duration-300",
                            showStickerPicker
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                : "hover:bg-muted text-muted-foreground hover:text-blue-500 dark:hover:bg-white/10 dark:text-white/40 dark:hover:text-blue-400"
                        )}
                        title="Send sticker"
                    >
                        <Sticker className="w-5 h-5" />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            setShowEmojiPicker(!showEmojiPicker)
                            setShowStickerPicker(false)
                        }}
                        className={cn(
                            "p-2.5 rounded-full transition-all duration-300",
                            showEmojiPicker
                                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                                : "hover:bg-muted text-muted-foreground hover:text-purple-500 dark:hover:bg-white/10 dark:text-white/40 dark:hover:text-purple-400"
                        )}
                        title="Insert emoji"
                    >
                        <Smile className="w-5 h-5" />
                    </motion.button>
                </div>

                <div className="flex-1 relative min-w-0">
                    <input
                        ref={inputRef}
                        value={message}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Message..."
                        className="w-full bg-transparent border-none px-2 h-10 text-[15px] font-medium placeholder:text-muted-foreground/50 dark:placeholder:text-white/20 focus:outline-none focus:ring-0 text-foreground dark:text-white"
                    />
                </div>

                <motion.button
                    whileHover={message.trim() ? { scale: 1.05 } : {}}
                    whileTap={message.trim() ? { scale: 0.95 } : {}}
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className={cn(
                        "p-2.5 rounded-full transition-all duration-500 flex items-center justify-center group/send relative overflow-hidden mr-1",
                        message.trim()
                            ? "bg-[#7c3aed] text-white shadow-lg shadow-purple-500/20"
                            : "bg-muted text-muted-foreground dark:bg-white/5 dark:text-white/10"
                    )}
                    title="Send message"
                >
                    <Send className={cn(
                        "w-5 h-5 relative z-10 transition-transform duration-500",
                        message.trim() && "group-hover/send:translate-x-0.5 group-hover/send:-translate-y-0.5"
                    )} />
                </motion.button>
            </div>
        </div>
    )
}
