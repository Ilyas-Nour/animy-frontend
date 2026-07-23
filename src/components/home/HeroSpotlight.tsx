'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Play, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Anime } from '@/types/anime'
import { cn } from '@/lib/utils'

interface HeroSpotlightProps {
    anime: Anime[]
}

export function HeroSpotlight({ anime }: HeroSpotlightProps) {
    const [current, setCurrent] = useState(0)
    const [logos, setLogos] = useState<Record<number, string>>({})

    // Auto-advance carousel
    useEffect(() => {
        if (!anime.length) return
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % anime.length)
        }, 8000)
        return () => clearInterval(timer)
    }, [anime.length])

    // Fetch official clear logos
    useEffect(() => {
        anime.forEach((item) => {
            const id = item.mal_id || item.anilistId || item.id
            if (!id || logos[id]) return

            if (item.logo) {
                setLogos(prev => ({ ...prev, [id]: item.logo! }))
                return
            }

            fetch(`https://api.ani.zip/mappings?mal_id=${id}`)
                .then(res => res.json())
                .then(data => {
                    const clearlogo = data.images?.find((img: any) => img.coverType === 'Clearlogo' || img.coverType === 'Clearart')
                    if (clearlogo?.url) {
                        setLogos(prev => ({ ...prev, [id]: clearlogo.url }))
                    }
                })
                .catch(() => {})
        })
    }, [anime])

    const active = anime[current]
    if (!active) return null

    const currentLogoUrl = logos[active.mal_id || active.anilistId || active.id] || active.logo

    return (
        <section className="relative h-[80vh] min-h-[600px] w-full overflow-hidden bg-background group">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0"
                >
                    {/* FULL SCREEN BACKGROUND */}
                    <div className="absolute inset-0 z-0">
                        {/* High Quality Background Image */}
                        <Image
                            src={active.bannerImage || active.images.jpg.large_image_url}
                            alt={active.title}
                            fill
                            className="object-cover object-top opacity-90 dark:opacity-80"
                            priority
                            quality={100}
                        />
                        
                        {/* Gradients for text legibility (darkens left and bottom) */}
                        <div className="absolute inset-0 z-10 bg-gradient-to-r from-background via-background/80 md:via-background/50 to-transparent w-full md:w-[65%]" />
                        <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-background/20 to-transparent h-full" />
                    </div>

                    {/* CONTENT ALIGNED TO BOTTOM LEFT */}
                    <div className="container relative h-full z-20 flex flex-col justify-end pb-20 sm:pb-28">
                        <div className="max-w-2xl space-y-4">
                            
                            {/* Spotlight Number */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                <span className="text-primary font-bold text-[10px] md:text-xs tracking-widest uppercase">
                                    #{current + 1} Spotlight
                                </span>
                            </motion.div>

                            {/* Title/Logo */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="min-h-[80px] md:min-h-[140px] flex items-end"
                            >
                                {currentLogoUrl ? (
                                    <div className="relative h-[80px] sm:h-[120px] md:h-[150px] w-full max-w-[450px]">
                                        <Image
                                            src={currentLogoUrl}
                                            alt={active.title}
                                            fill
                                            className="object-contain object-left-bottom filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)]"
                                            priority
                                            unoptimized
                                        />
                                    </div>
                                ) : (
                                    <h1 className="font-black leading-none tracking-tighter text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] text-4xl sm:text-5xl md:text-6xl">
                                        {active.title}
                                    </h1>
                                )}
                            </motion.div>

                            {/* Small Tag Pills (Format, Dub/Sub equivalent, Status, Score) */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-wrap items-center gap-2 pt-2"
                            >
                                <div className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-sm text-[10px] sm:text-xs font-semibold text-white/90">
                                    {active.type || 'TV'}
                                </div>
                                <div className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-sm text-[10px] sm:text-xs font-semibold text-white/90">
                                    {active.status || 'Finished'}
                                </div>
                                {active.year && (
                                    <div className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-sm text-[10px] sm:text-xs font-semibold text-white/90">
                                        {active.year}
                                    </div>
                                )}
                                {active.score && (
                                    <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-sm text-[10px] sm:text-xs font-semibold text-white/90">
                                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                        <span>{active.score.toFixed(1)}</span>
                                    </div>
                                )}
                            </motion.div>

                            {/* Genres as plain text */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-xs sm:text-sm font-semibold text-white/80"
                            >
                                {active.genres?.map(g => g.name).join(', ')}
                            </motion.div>

                            {/* Synopsis */}
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-xs sm:text-sm text-white/70 line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-xl"
                                dangerouslySetInnerHTML={{ __html: active.synopsis || '' }}
                            />

                            {/* Action Buttons */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="flex flex-wrap items-center gap-3 pt-4"
                            >
                                <Link href={`/anime/${active.mal_id}`}>
                                    <Button className="h-10 sm:h-12 px-5 sm:px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full gap-2 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                                        <Play className="w-4 h-4 fill-current" /> Watch Now
                                    </Button>
                                </Link>

                                <Link href={`/anime/${active.mal_id}`}>
                                    <Button variant="secondary" className="h-10 sm:h-12 px-5 sm:px-8 bg-white hover:bg-white/90 text-black font-bold rounded-full gap-2 transition-transform hover:scale-105 active:scale-95">
                                        Details <ChevronRight className="w-4 h-4 text-black/70" />
                                    </Button>
                                </Link>
                            </motion.div>

                            {/* Left-Aligned Dash Indicators */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="flex items-center gap-2 pt-6"
                            >
                                {anime.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrent(i)}
                                        aria-label={`Go to slide ${i + 1}`}
                                        className={cn(
                                            "h-1.5 rounded-full transition-all duration-500 overflow-hidden relative",
                                            current === i ? "w-8 bg-primary/30" : "w-4 bg-white/30 hover:bg-white/50"
                                        )}
                                    >
                                        {current === i && (
                                            <motion.div
                                                layoutId="heroIndicator"
                                                className="absolute inset-0 bg-primary"
                                                initial={{ x: '-100%' }}
                                                animate={{ x: '0%' }}
                                                transition={{ duration: 8, ease: "linear" }}
                                            />
                                        )}
                                    </button>
                                ))}
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Side Navigation Arrows (Far Edges) */}
            <button
                onClick={() => setCurrent((prev) => (prev - 1 + anime.length) % anime.length)}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 p-2 text-white/50 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Previous Slide"
            >
                <ChevronLeft size={32} strokeWidth={2.5} />
            </button>
            <button
                onClick={() => setCurrent((prev) => (prev + 1) % anime.length)}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 p-2 text-white/50 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Next Slide"
            >
                <ChevronRight size={32} strokeWidth={2.5} />
            </button>
        </section>
    )
}
