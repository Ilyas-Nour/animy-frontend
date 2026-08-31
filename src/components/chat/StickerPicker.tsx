'use client'

import Image from 'next/image'

interface StickerPickerProps {
    onSelectSticker: (stickerUrl: string) => void
}

const STICKERS = [
    '/stickers/happy.png',
    '/stickers/love.png',
    '/stickers/sad.png',
    '/stickers/angry.png',
    '/stickers/surprised.png',
    '/stickers/cool.png',
    '/stickers/laugh.png',
    '/stickers/cry.png',
    '/stickers/thumbsup.png',
    '/stickers/wave.png',
]

export default function StickerPicker({ onSelectSticker }: StickerPickerProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64">
            <h4 className="text-sm font-semibold mb-2 text-gray-700">Anime Stickers</h4>
            <div className="grid grid-cols-5 gap-2">
                {STICKERS.map((sticker, index) => (
                    <button
                        key={index}
                        onClick={() => onSelectSticker(sticker)}
                        className="w-12 h-12 rounded hover:bg-gray-100 transition-colors flex items-center justify-center"
                    >
                        <Image
                            src={sticker}
                            alt={`Sticker ${index + 1}`}
                            width={40}
                            height={40}
                            className="object-contain"
                            unoptimized
                            onError={(e) => {
                                // Fallback to emoji if image not found
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.parentElement!.innerHTML = '😊'
                            }}
                        />
                    </button>
                ))}
            </div>
        </div>
    )
}
