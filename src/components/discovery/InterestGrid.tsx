'use client'

import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { Code, Music, Cpu, Palette, Gamepad2, Film, Coffee, Camera, Plane, Book, Dumbbell, Globe, Heart, Zap, Star } from 'lucide-react'

// Define the geometric shapes/shards
const INTERESTS = [
    { id: 'ai', label: 'AI & Tech', icon: Cpu, color: 'from-cyan-400 to-blue-500' },
    { id: 'design', label: 'Minimalism', icon: Palette, color: 'from-pink-400 to-rose-500' },
    { id: 'coding', label: 'Coding', icon: Code, color: 'from-emerald-400 to-cyan-500' },
    { id: 'music', label: 'Music', icon: Music, color: 'from-violet-400 to-purple-500' },
    { id: 'gaming', label: 'Gaming', icon: Gamepad2, color: 'from-orange-400 to-red-500' },
    { id: 'anime', label: 'Anime', icon: Star, color: 'from-yellow-400 to-orange-500' },
    { id: 'film', label: 'Cinema', icon: Film, color: 'from-zinc-400 to-zinc-200' },
    { id: 'coffee', label: 'Coffee', icon: Coffee, color: 'from-amber-700 to-orange-900' },
    { id: 'photo', label: 'Photography', icon: Camera, color: 'from-sky-400 to-blue-600' },
    { id: 'travel', label: 'Travel', icon: Plane, color: 'from-teal-400 to-emerald-600' },
    { id: 'books', label: 'Literature', icon: Book, color: 'from-indigo-400 to-blue-600' },
    { id: 'fitness', label: 'Fitness', icon: Dumbbell, color: 'from-lime-400 to-green-600' },
    { id: 'web3', label: 'Web3', icon: Globe, color: 'from-fuchsia-400 to-pink-600' },
    { id: 'health', label: 'Wellness', icon: Heart, color: 'from-rose-400 to-pink-600' },
    { id: 'crypto', label: 'Crypto', icon: Zap, color: 'from-yellow-400 to-amber-500' },
]

interface InterestGridProps {
    selected: string[]
    toggleInterest: (id: string) => void
}

export function InterestGrid({ selected, toggleInterest }: InterestGridProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 perspective-[1000px]">
            {INTERESTS.map((interest, index) => {
                const isSelected = selected.includes(interest.id)
                const Icon = interest.icon

                return (
                    <motion.button
                        key={interest.id}
                        onClick={() => toggleInterest(interest.id)}
                        initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
                        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05, rotateX: 5, z: 20 }}
                        whileTap={{ scale: 0.95 }}
                        className={clsx(
                            "relative group h-32 rounded-2xl border transition-all duration-500 overflow-hidden flex flex-col items-center justify-center gap-3",
                            isSelected
                                ? "bg-white/10 border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                                : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/20"
                        )}
                    >
                        {/* Refraction Gradient Overlay */}
                        <div className={clsx(
                            "absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br",
                            interest.color
                        )} />

                        {/* Living Glow when selected */}
                        {isSelected && (
                            <div className={clsx(
                                "absolute inset-0 opacity-30 animate-pulse bg-gradient-to-tr",
                                interest.color
                            )} />
                        )}

                        {/* Icon */}
                        <Icon className={clsx(
                            "w-8 h-8 transition-colors duration-300 relative z-10",
                            isSelected ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" : "text-white/40 group-hover:text-white/80"
                        )} />

                        {/* Label */}
                        <span className={clsx(
                            "text-sm font-bold tracking-wider relative z-10",
                            isSelected ? "text-white" : "text-white/40 group-hover:text-white/80"
                        )}>
                            {interest.label}
                        </span>

                        {/* Glass Reflections */}
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </motion.button>
                )
            })}
        </div>
    )
}
