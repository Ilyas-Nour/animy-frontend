'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Play, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Anime } from '@/types/anime'
import { cn } from '@/lib/utils'

interface HeroSpotlightProps {
    anime: Anime[]
}

interface ValidHeroAnime extends Anime {
    logoUrl: string
    fanartUrl: string
}

export function HeroSpotlight({ anime }: HeroSpotlightProps) {
    const [current, setCurrent] = useState(0)
    const [validAnimeList, setValidAnimeList] = useState<ValidHeroAnime[]>([])
    const [isFetching, setIsFetching] = useState(true)

    // Fetch official clear logos and high quality fanart/banners
    useEffect(() => {
        if (!anime.length) return
        
        let mounted = true
        setIsFetching(true)

        const fetchHighQualityAssets = async () => {
            const validList: ValidHeroAnime[] = []
            
            // We only need 5 valid anime for the hero section
            // We'll iterate through the provided anime list (up to 20) and stop when we have 5 perfect matches
            for (const item of anime) {
                if (validList.length >= 5) break;

                const id = item.mal_id || item.anilistId || item.id
                if (!id) continue

                try {
                    const res = await fetch(`https://api.ani.zip/mappings?mal_id=${id}`)
                    if (!res.ok) continue
                    
                    const data = await res.json()
                    
                    // Look for Clearlogo
                    const clearlogo = data.images?.find((img: any) => img.coverType === 'Clearlogo' || img.coverType === 'Clearart')
                    // Look for Fanart (best quality 16:9), fallback to Banner
                    const fanart = data.images?.find((img: any) => img.coverType === 'Fanart') || data.images?.find((img: any) => img.coverType === 'Banner')
                    
                    if (clearlogo?.url && fanart?.url) {
                        validList.push({
                            ...item,
                            logoUrl: clearlogo.url,
                            fanartUrl: fanart.url
                        })
                    }
                } catch (err) {
                    console.error("Failed to fetch assets for", item.title)
                }
            }

            // If we couldn't find 5 perfect matches, fallback to items with at least a logo, 
            // and use their default banner/image if no fanart.
            if (validList.length < 5) {
                for (const item of anime) {
                    if (validList.length >= 5) break;
                    if (validList.some(v => v.mal_id === item.mal_id)) continue;

                    const id = item.mal_id || item.anilistId || item.id
                    if (!id) continue
                    try {
                        const res = await fetch(`https://api.ani.zip/mappings?mal_id=${id}`)
                        if (!res.ok) continue
                        const data = await res.json()
                        const clearlogo = data.images?.find((img: any) => img.coverType === 'Clearlogo' || img.coverType === 'Clearart')
                        
                        // User specifically wants ONLY anime with logos. 
                        // If it has a logo but no fanart, we'll accept it and use the default image
                        if (clearlogo?.url) {
                            validList.push({
                                ...item,
                                logoUrl: clearlogo.url,
                                fanartUrl: item.bannerImage || item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url
                            })
                        }
                    } catch (err) {
                        // ignore
                    }
                }
            }

            if (mounted) {
                setValidAnimeList(validList)
                setIsFetching(false)
            }
        }

        fetchHighQualityAssets()

        return () => { mounted = false }
    }, [anime])

    // Auto-advance carousel
    useEffect(() => {
        if (!validAnimeList.length) return
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % validAnimeList.length)
        }, 8000)
        return () => clearInterval(timer)
    }, [validAnimeList.length])

    if (isFetching || !validAnimeList.length) {
        return (
            <div className="h-[80vh] min-h-[600px] w-full bg-muted/20 animate-pulse flex items-center justify-center">
                <div className="container space-y-8">
                    <div className="w-1/4 h-10 bg-muted/40 rounded-lg" />
                    <div className="w-2/3 h-24 bg-muted/40 rounded-lg" />
                    <div className="w-1/2 h-8 bg-muted/40 rounded-lg" />
                </div>
            </div>
        )
    }

    const active = validAnimeList[current]
    if (!active) return null

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
                            src={active.fanartUrl}
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
                                {active.logoUrl ? (
                                    <div className="relative h-[80px] sm:h-[120px] md:h-[150px] w-full max-w-[450px]">
                                        <Image
                                            src={active.logoUrl}
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
                                {validAnimeList.map((_, i) => (
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
                onClick={() => setCurrent((prev) => (prev - 1 + validAnimeList.length) % validAnimeList.length)}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 p-2 text-white/50 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Previous Slide"
            >
                <ChevronLeft size={32} strokeWidth={2.5} />
            </button>
            <button
                onClick={() => setCurrent((prev) => (prev + 1) % validAnimeList.length)}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 p-2 text-white/50 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Next Slide"
            >
                <ChevronRight size={32} strokeWidth={2.5} />
            </button>
        </section>
    )
}
