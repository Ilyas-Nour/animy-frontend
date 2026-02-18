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
                        <div className="flex items-center gap-4 px-4 py-3 bg-purple-500/10 backdrop-blur-3xl rounded-2xl border border-purple-500/20 mb-1 group relative">
                            <div className="w-1 h-full absolute left-0 top-0 bottom-0 bg-gradient-to-b from-purple-500 to-blue-500 rounded-l-2xl" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <Flame className="w-3 h-3 text-purple-400" />
                                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Replying to @{replyingTo.sender.username}</span>
                                </div>
                                <p className="text-sm truncate text-white/60 italic font-medium">&quot;{replyingTo.content}&quot;</p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onCancelReply}
                                className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-white"
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
                        className="absolute bottom-full left-0 mb-4 bg-[#1a1a1a]/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-3xl overflow-hidden z-50 ring-1 ring-white/5 w-full sm:w-auto"
                    >
                        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-500">
                                    <Sticker className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-black text-white uppercase tracking-widest">Sticker Transmission</span>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowStickerPicker(false)}
                                className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors"
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
                                    className="aspect-square p-3 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center justify-center group relative overflow-hidden"
                                    title={sticker.name}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <img
                                        src={sticker.url}
                                        alt={sticker.name}
                                        className="w-full h-full object-contain drop-shadow-2xl z-10"
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
                        className="absolute bottom-full left-0 mb-4 z-[101] bg-[#1a1a1a] p-4 rounded-[2.5rem] border border-white/10 shadow-3xl"
                    >
                        <EmojiPicker
                            onEmojiClick={(emojiData) => handleEmojiClick(emojiData)}
                            theme={Theme.DARK}
                            width={350}
                            height={450}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Input Bar (Futuristic glassmorphism) */}
            <div className="flex items-center gap-3 p-2 bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/10 group focus-within:border-purple-500/50 transition-all shadow-2xl relative">
                <div className="flex items-center gap-1.5 pl-2">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            setShowStickerPicker(!showStickerPicker)
                            setShowEmojiPicker(false)
                        }}
                        className={cn(
                            "p-3 rounded-2xl transition-all duration-300",
                            showStickerPicker
                                ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                                : "hover:bg-white/10 text-white/40 hover:text-blue-400"
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
                            "p-3 rounded-2xl transition-all duration-300",
                            showEmojiPicker
                                ? "bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]"
                                : "hover:bg-white/10 text-white/40 hover:text-purple-400"
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
                        placeholder="Transmit a message..."
                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 h-14 text-[15px] font-medium placeholder:text-white/20 focus:outline-none focus:ring-2 ring-purple-500/30 transition-all text-white"
                    />
                    {message.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2"
                        >
                            <span className="text-[10px] font-black text-white/10 uppercase tracking-widest select-none">{message.length}</span>
                        </motion.div>
                    )}
                </div>

                <motion.button
                    whileHover={message.trim() ? { scale: 1.05 } : {}}
                    whileTap={message.trim() ? { scale: 0.95 } : {}}
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className={cn(
                        "p-4 rounded-2xl transition-all duration-500 flex items-center justify-center group/send relative overflow-hidden",
                        message.trim()
                            ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-xl shadow-purple-500/20"
                            : "bg-white/5 text-white/10 grayscale opacity-50"
                    )}
                    title="Send message"
                >
                    {message.trim() && (
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/send:translate-y-0 transition-transform duration-500" />
                    )}
                    <Send className={cn(
                        "w-5 h-5 relative z-10 transition-transform duration-500",
                        message.trim() && "group-hover/send:translate-x-1 group-hover/send:-translate-y-1"
                    )} />
                </motion.button>
            </div>
        </div>
    )
}
