'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Play, ChevronLeft, ChevronRight, Calendar, Info } from 'lucide-react'
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
    const [logos, setLogos] = useState<Record<number, string>>({})

    // Auto-advance carousel
    useEffect(() => {
        if (!anime.length) return
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % anime.length)
        }, 8000)
        return () => clearInterval(timer)
    }, [anime.length])

    // Fetch official clear logos for all hero anime dynamically via api.ani.zip
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
                .catch(() => {
                    // Silently ignore failures, will fallback to title text
                })
        })
    }, [anime])

    const active = anime[current]
    if (!active) return null

    const currentLogoUrl = logos[active.mal_id || active.anilistId || active.id] || active.logo

    return (
        <section className="relative h-[650px] sm:h-[620px] md:h-[85vh] min-h-[580px] max-h-[850px] w-full overflow-hidden bg-background">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0"
                >
                    <div className="absolute inset-0">
                        {/* LAYERED BACKGROUND SYSTEM WITH BRAND DNA GRADIENTS */}
                        <div className="absolute inset-0 z-0 overflow-hidden">
                            {/* Ambient Blur Layer for atmosphere */}
                            <Image
                                src={active.bannerImage || active.images.jpg.large_image_url}
                                alt=""
                                fill
                                className="object-cover blur-[90px] opacity-30 scale-110"
                                priority
                            />
                            
                            {/* Main High Quality Background Image */}
                            <Image
                                src={active.bannerImage || active.images.jpg.large_image_url}
                                alt={active.title}
                                fill
                                className="object-cover object-center opacity-70 dark:opacity-60"
                                priority
                                quality={100}
                            />
                            
                            {/* Brand DNA Radial & Linear Gradient Overlays */}
                            <div 
                                className="absolute inset-0 z-10 hidden md:block" 
                                style={{ 
                                    background: 'linear-gradient(to right, hsl(var(--background)) 0%, hsl(var(--background)/0.95) 25%, hsl(var(--background)/0.6) 55%, transparent 100%)'
                                }}
                            />
                            <div 
                                className="absolute inset-0 z-10 md:hidden" 
                                style={{ 
                                    background: 'linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background)/0.9) 50%, hsl(var(--background)/0.4) 100%)'
                                }}
                            />
                            
                            {/* Edge & Ground Fade */}
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
                        </div>
                    </div>

                    {/* Content Layer */}
                    <div className="container relative h-full z-20 flex flex-col justify-center pt-10 md:pt-16">
                        <div className="max-w-3xl space-y-4 md:space-y-6">
                            
                            {/* Badges: Trending + Score + Year + Genres */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="flex flex-wrap items-center gap-2.5"
                            >
                                <Badge className="bg-primary/20 text-primary border-primary/30 backdrop-blur-xl px-2.5 py-1 text-[10px] md:text-xs font-black uppercase tracking-widest">
                                    Trending #{current + 1}
                                </Badge>

                                {active.score && (
                                    <div className="flex items-center gap-1.5 bg-yellow-500/10 dark:bg-yellow-500/20 backdrop-blur-md px-2.5 py-1 rounded-md border border-yellow-500/30 text-yellow-500 text-xs font-black">
                                        <Star className="h-3.5 w-3.5 fill-yellow-500" />
                                        <span>{active.score.toFixed(1)}</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-1 bg-muted/40 backdrop-blur-md px-2.5 py-1 rounded-md border border-border/40 text-foreground/90 text-xs font-bold">
                                    <Calendar className="h-3.5 w-3.5 text-primary" />
                                    <span>{active.year || '2026'}</span>
                                </div>

                                {active.genres?.slice(0, 3).map(g => (
                                    <Badge key={g.mal_id} variant="outline" className="backdrop-blur-md border-border/50 text-foreground/80 font-bold text-[10px] md:text-xs px-2.5 py-1">
                                        {g.name}
                                    </Badge>
                                ))}
                            </motion.div>

                            {/* Title Section: Official Logo PNG or Gradient Typography fallback */}
                            <motion.div
                                initial={{ y: 25, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="min-h-[100px] md:min-h-[140px] flex items-center"
                            >
                                {currentLogoUrl ? (
                                    <div className="relative h-[110px] sm:h-[150px] md:h-[190px] lg:h-[220px] w-full max-w-[550px]">
                                        <Image
                                            src={currentLogoUrl}
                                            alt={active.title}
                                            fill
                                            className="object-contain object-left filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] dark:drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]"
                                            priority
                                            unoptimized
                                        />
                                    </div>
                                ) : (
                                    <h1 className={`font-black leading-[0.95] tracking-tighter text-foreground drop-shadow-md dark:drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] line-clamp-2 md:line-clamp-3 ${active.title.length > 40 ? 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl' : 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl'}`}>
                                        <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                                            {active.title}
                                        </span>
                                    </h1>
                                )}
                            </motion.div>

                            {/* Synopsis */}
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-xs sm:text-sm md:text-base text-muted-foreground line-clamp-2 sm:line-clamp-3 leading-relaxed font-medium max-w-xl drop-shadow-sm"
                                dangerouslySetInnerHTML={{ __html: active.synopsis || '' }}
                            />

                            {/* Action Buttons with Signature Animy DNA Colors */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2"
                            >
                                <Link href={`/anime/${active.mal_id}`}>
                                    <Button size="lg" className="h-12 sm:h-14 px-6 md:px-8 text-sm md:text-base font-black gap-2.5 bg-gradient-to-r from-primary via-purple-600 to-indigo-600 text-white shadow-[0_0_25px_rgba(139,92,246,0.4)] hover:shadow-[0_0_35px_rgba(139,92,246,0.6)] rounded-xl md:rounded-2xl border-0 overflow-hidden group/btn transition-all duration-300 hover:scale-105 active:scale-95">
                                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer group-hover/btn:opacity-100 opacity-0 transition-opacity" />
                                        <Play className="relative h-4 w-4 md:h-5 md:w-5 fill-current group-hover/btn:translate-x-0.5 transition-transform" />
                                        <span className="relative">Watch Now</span>
                                    </Button>
                                </Link>

                                <Link href={`/anime/${active.mal_id}`}>
                                    <Button size="lg" variant="outline" className="h-12 sm:h-14 px-6 md:px-8 text-sm md:text-base font-black gap-2 border-foreground/15 bg-background/20 backdrop-blur-xl text-foreground hover:bg-background/40 hover:border-foreground/30 rounded-xl md:rounded-2xl transition-all duration-300 hover:scale-105 group/intel">
                                        <Info className="h-4 w-4 md:h-5 md:w-5 text-primary group-hover/intel:scale-110 transition-transform" />
                                        <span>Details</span>
                                    </Button>
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Bottom Carousel Controls with Active Progress Indicator & Carets */}
            <div className="absolute bottom-6 left-0 right-0 z-30 w-full flex justify-center items-center gap-4">
                <button
                    onClick={() => setCurrent((prev) => (prev - 1 + anime.length) % anime.length)}
                    aria-label="Previous Slide"
                    className="p-2 rounded-full bg-background/30 hover:bg-background/60 backdrop-blur-md text-foreground/70 hover:text-foreground border border-border/30 transition-all hover:scale-110 active:scale-95"
                >
                    <ChevronLeft size={18} />
                </button>
                
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-full bg-background/30 backdrop-blur-md border border-border/30">
                    {anime.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            aria-label={`Go to slide ${i + 1}`}
                            className={cn(
                                "relative h-2 rounded-full overflow-hidden transition-all duration-500",
                                current === i ? "w-10 bg-primary/30" : "w-2 bg-foreground/20 hover:bg-foreground/40"
                            )}
                        >
                            {current === i && (
                                <motion.div
                                    layoutId="heroProgress"
                                    className="absolute inset-0 bg-primary rounded-full"
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '0%' }}
                                    transition={{ duration: 8, ease: "linear" }}
                                />
                            )}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setCurrent((prev) => (prev + 1) % anime.length)}
                    aria-label="Next Slide"
                    className="p-2 rounded-full bg-background/30 hover:bg-background/60 backdrop-blur-md text-foreground/70 hover:text-foreground border border-border/30 transition-all hover:scale-110 active:scale-95"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </section>
    )
}
