'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { cn, getAvatarUrl } from '@/lib/utils'

interface UserAvatarProps {
    user: {
        username?: string | null
        firstName?: string | null
        lastName?: string | null
        avatar?: string | null
    }
    className?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const UserAvatar = ({ user, className, size = 'md' }: UserAvatarProps) => {
    const [imageError, setImageError] = useState(false)
    const avatarUrl = getAvatarUrl(user.avatar || undefined)
    const displayName = user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || '?'
    const initial = displayName.charAt(0).toUpperCase()

    const sizeClasses = {
        'xs': 'w-6 h-6 text-[10px]',
        'sm': 'w-8 h-8 text-xs',
        'md': 'w-10 h-10 text-sm',
        'lg': 'w-12 h-12 text-base',
        'xl': 'w-16 h-16 text-xl',
        '2xl': 'w-24 h-24 text-3xl',
    }

    // Generate a semi-stable background color based on the name hash
    const backgroundColor = React.useMemo(() => {
        if (!displayName) return 'bg-primary'
        const hash = displayName.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0)
        const colors = [
            'bg-blue-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-indigo-500',
            'bg-cyan-500',
            'bg-teal-500',
            'bg-emerald-500',
            'bg-orange-500',
            'bg-rose-500',
            'bg-amber-500'
        ]
        return colors[hash % colors.length]
    }, [displayName])

    // Show fallback if no avatar URL or if image failed to load
    if (!avatarUrl || imageError) {
        return (
            <div className={cn(
                "flex items-center justify-center rounded-full font-black text-white shrink-0 shadow-inner border border-white/10 select-none uppercase tracking-tighter",
                sizeClasses[size],
                backgroundColor,
                className
            )}>
                {initial}
            </div>
        )
    }


    // Use standard img tag for reliable loading of external URLs without Next.js config issues
    return (
        <div className={cn("relative shrink-0 overflow-hidden rounded-full bg-muted", sizeClasses[size], className)}>
            {!imageError && avatarUrl ? (
                <Image
                    src={avatarUrl}
                    alt={user?.firstName || "User"}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={() => setImageError(true)}
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10 font-bold text-primary">
                    {initial}
                </div>
            )}
        </div>
    )
}


export default UserAvatar
