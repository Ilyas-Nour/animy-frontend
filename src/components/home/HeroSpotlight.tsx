'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Anime } from '@/types/anime'
import { cn } from '@/lib/utils'

interface HeroSpotlightProps {
    anime: Anime[]
}

export function HeroSpotlight({ anime }: HeroSpotlightProps) {
    const [current, setCurrent] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % anime.length)
        }, 8000)
        return () => clearInterval(timer)
    }, [anime.length])

    const active = anime[current]

    return (
        <section className="relative h-[650px] sm:h-[600px] md:h-[85vh] w-full overflow-hidden bg-background">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0"
                >
                    <motion.div
                        className="absolute inset-0"
                    >
                        {/* LAYERED BACKGROUND SYSTEM */}
                        <div className="absolute inset-0 z-0 overflow-hidden bg-[#050505]">
                            <Image
                                src={active.bannerImage || active.images.jpg.large_image_url}
                                alt={active.title}
                                fill
                                className="object-cover object-center opacity-60 md:opacity-80"
                                priority
                                quality={100}
                            />
                            
                            {/* The Gradient System for text visibility */}
                            <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#050505] via-[#050505]/80 md:via-[#050505]/60 to-transparent w-full md:w-[70%]" />
                            <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#050505] via-transparent to-transparent h-full" />
                        </div>
                    </motion.div>

                    {/* Content Layer */}
                    <div className="container relative h-full z-20 flex flex-col justify-center pt-12 md:pt-20">
                        <div className="max-w-2xl space-y-4 md:space-y-6 lg:space-y-8">
                            <motion.div
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="space-y-4"
                            >
                                {active.logo ? (
                                    <div className="relative h-[80px] sm:h-[120px] md:h-[160px] lg:h-[200px] w-full max-w-[500px]">
                                        <Image
                                            src={active.logo}
                                            alt={active.title}
                                            fill
                                            className="object-contain object-left drop-shadow-2xl"
                                            priority
                                        />
                                    </div>
                                ) : (
                                    <h1 className={`font-black leading-[0.9] tracking-tighter text-white drop-shadow-sm dark:drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] line-clamp-2 md:line-clamp-3 ${active.title.length > 50 ? 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl' : active.title.length > 30 ? 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl' : 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl'}`}>
                                        {active.title}
                                    </h1>
                                )}

                                <div className="flex flex-wrap items-center gap-2 md:gap-3 text-white/90 pt-2">
                                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded border border-white/5 text-[10px] md:text-xs font-semibold tracking-wider">
                                        <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                        <span>{active.year || '2026'}</span>
                                    </div>
                                    {active.genres?.slice(0, 3).map(g => (
                                        <Badge key={g.mal_id} variant="secondary" className="bg-white/10 hover:bg-white/20 text-white/90 border-none text-[10px] md:text-xs font-semibold px-2.5 py-1 rounded">
                                            {g.name}
                                        </Badge>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-xs sm:text-sm lg:text-base text-white/70 line-clamp-3 leading-relaxed font-medium max-w-xl drop-shadow-md"
                                dangerouslySetInnerHTML={{ __html: active.synopsis || '' }}
                            />

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="pt-2 md:pt-4"
                            >
                                <Link href={`/anime/${active.mal_id}`}>
                                    <Button size="lg" className="h-10 sm:h-12 px-6 sm:px-8 bg-white text-black hover:bg-white/90 font-bold gap-2 rounded shadow-lg transition-transform hover:scale-105 active:scale-95">
                                        <Play className="h-4 w-4 fill-current" />
                                        Watch Now
                                    </Button>
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Carousel Navigation */}
            <div className="absolute bottom-8 left-0 right-0 z-30 w-full flex justify-center items-center gap-4">
                <button
                    onClick={() => setCurrent((prev) => (prev - 1 + anime.length) % anime.length)}
                    className="p-1 hover:text-white/80 text-white/50 transition-colors"
                >
                    <ChevronLeft size={16} strokeWidth={3} />
                </button>
                
                <div className="flex items-center gap-2">
                    {anime.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-500",
                                current === i ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
                            )}
                        />
                    ))}
                </div>

                <button
                    onClick={() => setCurrent((prev) => (prev + 1) % anime.length)}
                    className="p-1 hover:text-white/80 text-white/50 transition-colors"
                >
                    <ChevronRight size={16} strokeWidth={3} />
                </button>
            </div>
        </section>
    )
}
