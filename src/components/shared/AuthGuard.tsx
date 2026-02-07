'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { AuthGateModal } from './AuthGateModal'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AuthGuardProps {
    children: React.ReactNode
    fallback?: React.ReactNode
    title?: string
    description?: string
    className?: string
}

export function AuthGuard({
    children,
    fallback,
    title,
    description,
    className
}: AuthGuardProps) {
    const { isAuthenticated } = useAuth()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleClick = (e: React.MouseEvent) => {
        if (!isAuthenticated) {
            e.preventDefault()
            e.stopPropagation()
            setIsModalOpen(true)
        }
    }

    // Prevent hydration mismatch by only rendering client-specific auth UI after mount
    if (!mounted) {
        return (
            <div className={cn("opacity-0", className)}>
                {fallback || children}
            </div>
        )
    }

    // "Glass-Disabled" shimmer effect for guest buttons
    if (!isAuthenticated && fallback) {
        return (
            <div className={cn("relative group cursor-pointer", className)} onClick={handleClick}>
                <div className="pointer-events-none opacity-60 grayscale-[0.5] blur-[0.5px]">
                    {fallback}
                </div>
                <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-foreground/[0.02] dark:bg-white/5 backdrop-blur-[2px] rounded-inherit flex items-center justify-center pointer-events-none"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 dark:via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                </motion.div>
                <AuthGateModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={title}
                    description={description}
                />
            </div>
        )
    }

    return (
        <>
            <div className={cn(className)} onClick={handleClick}>
                {children}
            </div>
            {!isAuthenticated && (
                <AuthGateModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={title}
                    description={description}
                />
            )}
        </>
    )
}
