'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Play, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Anime } from '@/types/anime'

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
        <section className="relative h-[600px] md:h-[85vh] w-full overflow-hidden bg-background">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0"
                >
                    {/* Background with Parallax/Zoom Effect */}
                    <motion.div
                        initial={{ scale: 1.1, filter: 'blur(10px)' }}
                        animate={{ scale: 1, filter: 'blur(0px)' }}
                        transition={{ duration: 8 }}
                        className="absolute inset-0"
                    >
                        <Image
                            src={active.images.jpg.large_image_url}
                            alt={active.title}
                            fill
                            className="object-cover"
                            priority
                        />
                        {/* Complex Gradient Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent z-10" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/20 z-10" />
                        <div className="absolute inset-0 bg-background/10 dark:bg-black/40 z-0" />
                    </motion.div>

                    {/* Content Layer */}
                    <div className="container relative h-full z-20 flex flex-col justify-center pt-12 md:pt-20">
                        <div className="max-w-4xl space-y-4 md:space-y-6 lg:space-y-8">
                            <motion.div
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="flex flex-wrap gap-3"
                            >
                                <Badge className="bg-primary/20 text-primary border-primary/30 backdrop-blur-xl px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-sm font-black uppercase tracking-widest">
                                    Trending #{current + 1}
                                </Badge>
                                {active.genres?.slice(0, 2).map(g => (
                                    <Badge key={g.mal_id} variant="outline" className="backdrop-blur-md border-foreground/20 text-foreground font-bold text-[10px] md:text-sm">
                                        {g.name}
                                    </Badge>
                                ))}
                            </motion.div>

                            <motion.div
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="space-y-3 md:space-y-4"
                            >
                                <h1 className={`font-black leading-[0.9] tracking-tighter text-foreground drop-shadow-sm dark:drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] line-clamp-2 md:line-clamp-3 ${active.title.length > 50 ? 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl' : active.title.length > 30 ? 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl' : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl'}`}>
                                    {active.title}
                                </h1>

                                <div className="flex items-center gap-3 md:gap-6 text-foreground/90">
                                    {active.score && (
                                        <div className="flex items-center gap-1.5 md:gap-2 bg-yellow-500/10 dark:bg-yellow-500/20 backdrop-blur-2xl px-2.5 py-1 md:px-4 md:py-2 rounded-xl md:rounded-2xl border border-yellow-500/30">
                                            <Star className="h-3.5 w-3.5 md:h-5 md:w-5 text-yellow-500 fill-yellow-500" />
                                            <span className="text-base md:text-xl font-black">{active.score.toFixed(1)}</span>
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground text-[7px] md:text-[10px] font-black uppercase tracking-widest">Format</span>
                                        <span className="text-[10px] md:text-base font-bold">{active.type}</span>
                                    </div>
                                    <div className="h-4 md:h-8 w-px bg-border hidden sm:block" />
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground text-[7px] md:text-[10px] font-black uppercase tracking-widest">Year</span>
                                        <span className="text-[10px] md:text-base font-bold">{active.year || 'Unknown'}</span>
                                    </div>
                                    <div className="h-4 md:h-8 w-px bg-border hidden sm:block" />
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground text-[7px] md:text-[10px] font-black uppercase tracking-widest">Status</span>
                                        <span className="text-[10px] md:text-base font-bold">{active.status}</span>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-xs sm:text-base lg:text-lg xl:text-xl text-muted-foreground line-clamp-2 md:line-clamp-3 max-w-2xl leading-relaxed font-medium"
                                dangerouslySetInnerHTML={{ __html: active.synopsis || '' }}
                            />

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="flex flex-wrap gap-4 pt-2 md:pt-4"
                            >
                                <Link href={`/anime/${active.mal_id}`}>
                                    <Button size="lg" className="relative h-11 sm:h-12 lg:h-13 xl:h-14 px-6 lg:px-8 xl:px-10 text-[11px] sm:text-xs md:text-sm lg:text-sm xl:text-base font-black gap-2 md:gap-3 bg-gradient-to-r from-primary via-purple-500 to-indigo-600 text-primary-foreground shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_35px_rgba(139,92,246,0.5)] rounded-xl md:rounded-2xl lg:rounded-3xl border-0 overflow-hidden group/btn transition-all duration-300 hover:scale-105 active:scale-95">
                                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer group-hover/btn:opacity-100 opacity-0 transition-opacity" />
                                        <Play className="relative h-4 w-4 lg:h-5 xl:h-5 fill-current group-hover/btn:translate-x-1 transition-transform" />
                                        <span className="relative">Start Your Journey</span>
                                    </Button>
                                </Link>
                                <Link href={`/anime/${active.mal_id}`}>
                                    <Button size="lg" variant="outline" className="h-11 sm:h-12 lg:h-13 xl:h-14 px-6 lg:px-8 xl:px-10 text-[11px] sm:text-xs md:text-sm lg:text-sm xl:text-base font-black gap-2 md:gap-3 border-white/20 bg-white/5 backdrop-blur-2xl text-foreground hover:bg-white/10 hover:border-white/40 rounded-xl md:rounded-2xl lg:rounded-3xl shadow-xl transition-all duration-300 hover:scale-105 group/intel">
                                        <Info className="h-4 w-4 lg:h-5 xl:h-5 text-primary group-hover/intel:scale-110 transition-transform" />
                                        Intel Details
                                    </Button>
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Premium Navigation Controls */}
            <div className="absolute right-8 bottom-32 z-30 flex flex-col gap-4">
                <button
                    onClick={() => setCurrent((prev) => (prev - 1 + anime.length) % anime.length)}
                    className="h-14 w-14 bg-foreground/5 hover:bg-foreground/10 backdrop-blur-2xl rounded-2xl border border-foreground/10 flex items-center justify-center text-foreground transition-all hover:scale-110 active:scale-90"
                >
                    <ChevronLeft size={28} />
                </button>
                <button
                    onClick={() => setCurrent((prev) => (prev + 1) % anime.length)}
                    className="h-14 w-14 bg-foreground/5 hover:bg-foreground/10 backdrop-blur-2xl rounded-2xl border border-foreground/10 flex items-center justify-center text-foreground transition-all hover:scale-110 active:scale-90"
                >
                    <ChevronRight size={28} />
                </button>
            </div>

            {/* Animated Progress Indicators */}
            <div className="absolute bottom-12 left-0 right-0 z-30 w-full flex justify-center gap-3">
                {anime.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className="group relative h-1.5 rounded-full bg-foreground/20 overflow-hidden transition-all duration-300"
                        style={{ width: current === i ? '64px' : '20px' }}
                    >
                        {current === i && (
                            <motion.div
                                layoutId="heroProgress"
                                className="absolute inset-0 bg-primary"
                                initial={{ x: '-100%' }}
                                animate={{ x: '0%' }}
                                transition={{ duration: 8, ease: "linear" }}
                            />
                        )}
                    </button>
                ))}
            </div>
        </section>
    )
}
