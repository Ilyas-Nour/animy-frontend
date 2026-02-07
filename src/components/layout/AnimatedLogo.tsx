'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AnimatedLogoProps {
    className?: string
    innerClassName?: string
}

export function AnimatedLogo({ className, innerClassName }: AnimatedLogoProps) {
    return (
        <motion.div
            className={cn("flex items-center gap-2 cursor-pointer group", className)}
            whileHover="hover"
            initial="initial"
        >
            <div className="relative">
                {/* Animated Chibi Head peeking from A */}
                <motion.div
                    className="absolute -top-4 left-1 z-0 w-8 h-8 pointer-events-none"
                    variants={{
                        initial: { y: 12, opacity: 0 },
                        hover: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } }
                    }}
                >
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                        {/* Simple Chibi Face */}
                        <circle cx="50" cy="60" r="35" fill="#FFE0BD" />
                        <path d="M25 40 Q50 10 75 40" fill="#3B82F6" /> {/* Hair/Hat */}

                        {/* Cat Ears */}
                        <path d="M20 30 L35 15 L45 35 Z" fill="#3B82F6" />
                        <path d="M80 30 L65 15 L55 35 Z" fill="#3B82F6" />

                        {/* Eyes */}
                        <motion.circle
                            cx="35" cy="60" r="4" fill="#1F2937"
                            variants={{
                                initial: { scaleY: 1 },
                                hover: { scaleY: [1, 0.1, 1], transition: { duration: 0.2, repeat: Infinity, repeatDelay: 1.5 } }
                            }}
                        />
                        <circle cx="65" cy="60" r="4" fill="#1F2937" />

                        {/* Blush */}
                        <circle cx="30" cy="70" r="3" fill="#FB7185" opacity="0.6" />
                        <circle cx="70" cy="70" r="3" fill="#FB7185" opacity="0.6" />

                        {/* Mouth */}
                        <path d="M45 75 Q50 80 55 75" stroke="#1F2937" strokeWidth="2" fill="none" />
                    </svg>
                </motion.div>

                {/* Logo Text */}
                <span className={cn(
                    "relative z-10 text-2xl font-black tracking-tight font-rounded",
                    innerClassName
                )}>
                    <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        A
                    </span>
                    <span className="text-foreground">nimy</span>
                </span>
            </div>
        </motion.div>
    )
}
