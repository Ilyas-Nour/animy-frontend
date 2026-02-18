'use client'

import { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Send, Smile, X } from 'lucide-react'
import { useSocket } from '@/contexts/SocketContext'
import { cn } from '@/lib/utils'
import EmojiPicker, { Theme } from 'emoji-picker-react'

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

    const handleEmojiClick = (emojiData: any) => {
        setMessage(prev => prev + emojiData.emoji)
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
        <div className="flex flex-col gap-2 p-4 border-t border-border bg-card/80 backdrop-blur-xl">
            {/* Reply Preview */}
            {replyingTo && (
                <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-xl border-l-4 border-primary animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Replying to {replyingTo.sender.username}</p>
                        <p className="text-sm truncate opacity-70 italic">{replyingTo.content}</p>
                    </div>
                    <button
                        onClick={onCancelReply}
                        className="p-1 hover:bg-background rounded-full transition-colors"
                    >
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>
            )}

            {/* Sticker Picker */}
            {showStickerPicker && (
                <div className="mb-1 bg-background border border-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 origin-bottom-left">
                    <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
                        <div className="flex items-center gap-2">
                            <Smile className="w-5 h-5 text-primary" />
                            <span className="text-sm font-bold text-foreground">Stickers</span>
                        </div>
                        <button
                            onClick={() => setShowStickerPicker(false)}
                            className="p-1 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-3 max-h-[250px] overflow-y-auto custom-scrollbar">
                        {stickers.map((sticker) => (
                            <button
                                key={sticker.id}
                                onClick={() => handleSendSticker(sticker.url)}
                                className="aspect-square p-2 rounded-xl hover:bg-primary/10 transition-all duration-200 active:scale-90 hover:scale-110 flex items-center justify-center group"
                                title={sticker.name}
                            >
                                <img
                                    src={sticker.url}
                                    alt={sticker.name}
                                    className="w-full h-full object-contain drop-shadow-sm group-hover:drop-shadow-md transition-all group-hover:scale-110"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Emoji Picker */}
            {showEmojiPicker && (
                <div className="absolute bottom-full mb-4 left-0 z-50 animate-in slide-in-from-bottom-2 duration-200">
                    <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        theme={Theme.DARK}
                        lazyLoadEmojis={true}
                        searchPlaceHolder="Search emojis..."
                        width={350}
                        height={400}
                    />
                </div>
            )}

            {/* Input Bar */}
            <div className="flex items-center gap-1 sm:gap-2 bg-background/50 p-1.5 rounded-2xl border border-border group focus-within:border-primary/50 transition-all shadow-inner">
                <button
                    onClick={() => {
                        setShowStickerPicker(!showStickerPicker)
                        setShowEmojiPicker(false)
                    }}
                    className={cn(
                        "p-2 rounded-xl transition-all duration-200",
                        showStickerPicker ? "bg-primary text-white scale-110 shadow-lg" : "hover:bg-primary/10 text-muted-foreground hover:text-primary"
                    )}
                    title="Send sticker"
                >
                    <Smile className="w-5 h-5" />
                </button>

                <button
                    onClick={() => {
                        setShowEmojiPicker(!showEmojiPicker)
                        setShowStickerPicker(false)
                    }}
                    className={cn(
                        "p-2 rounded-xl transition-all duration-200",
                        showEmojiPicker ? "bg-orange-500 text-white scale-110 shadow-lg" : "hover:bg-orange-500/10 text-muted-foreground hover:text-orange-500"
                    )}
                    title="Insert emoji"
                >
                    <span className="text-xl leading-none">😊</span>
                </button>

                <Input
                    ref={inputRef}
                    value={message}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-10 text-sm sm:text-base font-medium placeholder:text-muted-foreground/50"
                />

                <button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="p-2.5 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-blue-600 text-white shadow-md hover:shadow-primary/25 disabled:opacity-30 disabled:grayscale disabled:scale-95 transition-all duration-300 hover:scale-105 active:scale-90"
                    title="Send message"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    )
}
