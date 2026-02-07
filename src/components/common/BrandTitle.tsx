'use client'

import { cn } from '@/lib/utils'

interface BrandTitleProps {
    children: string
    className?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    icon?: React.ReactNode
}

export function BrandTitle({ children, className, size = 'lg', icon }: BrandTitleProps) {
    const firstLetter = children.charAt(0)
    const rest = children.slice(1)

    const sizeClasses = {
        sm: 'text-2xl',
        md: 'text-3xl',
        lg: 'text-4xl',
        xl: 'text-5xl'
    }

    return (
        <h1 className={cn(
            "font-black tracking-tight flex items-center gap-3",
            sizeClasses[size],
            className
        )}>
            {icon && <span className="text-primary">{icon}</span>}
            <span className="relative">
                <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    {firstLetter}
                </span>
                <span className="text-foreground">
                    {rest}
                </span>
            </span>
        </h1>
    )
}
