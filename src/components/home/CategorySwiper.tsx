'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Film, BookOpen, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategorySwiperProps {
    onCategoryChange?: (category: 'anime' | 'manga') => void
}

export function CategorySwiper({ onCategoryChange }: CategorySwiperProps) {
    const [active, setActive] = useState<'anime' | 'manga'>('anime')

    const categories = [
        { id: 'anime', label: 'Anime', icon: Film, color: 'text-blue-500' },
        { id: 'manga', label: 'Manga', icon: BookOpen, color: 'text-orange-500' },
    ] as const

    const handleSelect = (id: 'anime' | 'manga') => {
        setActive(id)
        if (onCategoryChange) onCategoryChange(id)
    }

    return (
        <div className="md:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-6">
            <div className="flex items-center justify-between h-16 relative">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => handleSelect(cat.id)}
                        className={cn(
                            "flex-1 flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden group", // Added relative and overflow-hidden for shimmer
                            active === cat.id ? cat.color : "text-muted-foreground"
                        )}
                    >
                        <cat.icon size={20} className={cn(active === cat.id ? "scale-110" : "scale-100")} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>

                        {active === cat.id && (
                            <motion.div
                                layoutId="categoryUnderline"
                                className={cn("absolute bottom-0 h-1 w-12 rounded-t-full",
                                    cat.id === 'anime' ? "bg-blue-500" :
                                        cat.id === 'manga' ? "bg-orange-500" : "bg-purple-500"
                                )}
                            />
                        )}
                    </button>
                ))}
            </div>
        </div>
    )
}
