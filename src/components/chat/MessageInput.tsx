'use client'

import { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Send, Smile } from 'lucide-react'
import { useSocket } from '@/contexts/SocketContext'

interface MessageInputProps {
    onSendMessage: (content: string, messageType?: 'TEXT' | 'STICKER' | 'ANIME_CARD', animeId?: number) => void
    onTyping: (isTyping: boolean) => void
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

export default function MessageInput({ onSendMessage, onTyping }: MessageInputProps) {
    const [message, setMessage] = useState('')
    const [showStickerPicker, setShowStickerPicker] = useState(false)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const { playSent } = useSocket()

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value)

        // Emit typing event
        onTyping(true)

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }

        // Stop typing after 1 second of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            onTyping(false)
        }, 1000)
    }

    const handleSendMessage = () => {
        if (message.trim()) {
            playSent()
            onSendMessage(message.trim())
            setMessage('')
            onTyping(false)
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
        onSendMessage(stickerUrl, 'STICKER')
        setShowStickerPicker(false)
    }

    return (
        <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
            {/* Sticker Picker */}
            {showStickerPicker && (
                <div className="mb-3 bg-background border border-border rounded-lg shadow-lg">
                    <div className="flex items-center justify-between p-3 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Smile className="w-5 h-5 text-primary" />
                            <span className="text-sm font-medium text-foreground">Choose a sticker</span>
                        </div>
                        <button
                            onClick={() => setShowStickerPicker(false)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                    {/* Scrollable container with vertical grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-3 max-h-[250px] overflow-y-auto custom-scrollbar">
                        {stickers.map((sticker) => (
                            <button
                                key={sticker.id}
                                onClick={() => handleSendSticker(sticker.url)}
                                className="aspect-square p-2 rounded-xl bg-transparent hover:bg-muted/10 transition-all duration-200 active:scale-95 hover:scale-110 flex items-center justify-center relative group"
                                title={sticker.name}
                            >
                                <img
                                    src={sticker.url}
                                    alt={sticker.name}
                                    className="w-full h-full object-contain drop-shadow-sm group-hover:drop-shadow-md transition-all group-hover:scale-110"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement!.innerText = '❌';
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setShowStickerPicker(!showStickerPicker)}
                    className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200"
                    title="Send sticker"
                >
                    <Smile className="w-5 h-5" />
                </button>

                <Input
                    value={message}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 bg-background border-border focus:border-primary transition-colors"
                />

                <button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="p-2 rounded-lg bg-gradient-to-r from-primary to-purple-500 text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                    title="Send message"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    )
}
