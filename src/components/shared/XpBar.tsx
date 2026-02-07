'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface XpBarProps {
    progress?: number // 0-100 (Optional if currentXp/requiredXp provided)
    currentXp?: number
    requiredXp?: number
    level: number
    rank?: string
    className?: string
    showText?: boolean
    size?: 'sm' | 'md' | 'lg'
}

export function XpBar({
    progress,
    currentXp,
    requiredXp,
    level,
    rank,
    className,
    showText = true,
    size = 'md'
}: XpBarProps) {
    const heightClass = {
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-4'
    }[size]

    // Calculate percentage if not provided
    const displayProgress = progress ?? (
        (currentXp !== undefined && requiredXp)
            ? Math.min(Math.round((currentXp / requiredXp) * 100), 100)
            : 0
    )

    const remainingXp = (requiredXp !== undefined && currentXp !== undefined)
        ? requiredXp - currentXp
        : null

    return (
        <div className={cn("space-y-3 w-full", className)}>
            {showText && (
                <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {rank || 'Initiate'}
                        </p>
                        <p className="text-xl font-black text-foreground">
                            Level {level}
                        </p>
                    </div>
                    <div className="text-right">
                        {currentXp !== undefined && requiredXp !== undefined ? (
                            <>
                                <p className="text-xs font-bold text-primary tabular-nums">
                                    {remainingXp?.toLocaleString()} XP Remaining
                                </p>
                                <p className="text-[10px] text-muted-foreground tabular-nums">
                                    {currentXp.toLocaleString()} / {requiredXp.toLocaleString()} XP
                                </p>
                            </>
                        ) : (
                            <p className="text-xs font-bold text-primary tabular-nums">
                                {displayProgress}% to next level
                            </p>
                        )}
                    </div>
                </div>
            )}

            <div className={cn(
                "relative w-full bg-foreground/[0.05] dark:bg-white/5 rounded-full overflow-hidden border border-foreground/[0.03] dark:border-white/5",
                heightClass
            )}>
                {/* Animated Background Pulse */}
                <motion.div
                    className="absolute inset-0 bg-primary/10"
                    animate={{
                        opacity: [0.1, 0.3, 0.1],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                {/* Progress Fill */}
                <motion.div
                    className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${displayProgress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                >
                    {/* Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] translate-x-[-100%]" />

                    {/* Tip Glow */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-full bg-white/40 blur-md rounded-full" />
                </motion.div>
            </div>
        </div>
    )
}


