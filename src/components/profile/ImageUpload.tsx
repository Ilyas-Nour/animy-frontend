'use client'

import { useRef, ChangeEvent } from 'react'
import { Camera } from 'lucide-react'
import { motion } from 'framer-motion'
import { getAvatarUrl } from '@/lib/utils'

interface ImageUploadProps {
    currentImage?: string
    onImageSelect: (file: File, previewUrl: string) => void
    onError: (error: string) => void
    variant: 'avatar' | 'banner'
    label: string
}

const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export function ImageUpload({
    currentImage,
    onImageSelect,
    onError,
    variant,
    label
}: ImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            onError('Please select a valid image file (JPG, PNG, or WebP)')
            return
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            onError('Image size must be less than 4MB')
            return
        }

        // Create preview URL
        const reader = new FileReader()
        reader.onloadend = () => {
            onImageSelect(file, reader.result as string)
        }
        reader.readAsDataURL(file)

        // Reset input so same file can be selected again
        e.target.value = ''
    }

    const getDefaultImage = () => {
        if (variant === 'avatar') {
            return 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff&size=200'
        }
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }

    const containerClasses = variant === 'avatar'
        ? 'relative w-32 h-32 rounded-full overflow-hidden cursor-pointer group'
        : 'relative w-full h-48 md:h-64 rounded-t-lg overflow-hidden cursor-pointer group'

    const imageClasses = variant === 'avatar'
        ? 'w-full h-full object-cover'
        : 'w-full h-full object-cover'

    return (
        <div className={containerClasses} onClick={handleClick}>
            {/* Image or gradient background */}
            {variant === 'banner' && !currentImage ? (
                <div
                    className="w-full h-full"
                    style={{ background: getDefaultImage() }}
                />
            ) : (
                <img
                    src={getAvatarUrl(currentImage) || getDefaultImage()}
                    alt={label}
                    className={imageClasses}
                />
            )}

            {/* Hover overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 transition-opacity"
            >
                <Camera className="h-8 w-8 text-white" />
                <span className="text-white text-sm font-medium">{label}</span>
            </motion.div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                onChange={handleFileChange}
                className="hidden"
                aria-label={label}
            />
        </div>
    )
}
