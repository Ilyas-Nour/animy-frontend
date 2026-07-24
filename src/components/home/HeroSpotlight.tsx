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
        // Only show skeleton if we have NO items currently
        if (validAnimeList.length === 0) {
            setIsFetching(true)
        }

        const loadHeroAnime = () => {
            // Check top 25 items concurrently
            const pool = anime.slice(0, 25);
            let processedCount = 0;

            pool.forEach(async (item) => {
                let query = '';
                if (item.mal_id) {
                    query = `mal_id=${item.mal_id}`;
                } else if (item.anilistId || item.id) {
                    query = `anilist_id=${item.anilistId || item.id}`;
                }
                
                if (!query) {
                    processedCount++;
                    return;
                }
                
                try {
                    const res = await fetch(`https://api.ani.zip/mappings?${query}`)
                    if (res.ok) {
                        const data = await res.json()
                        const clearlogo = data.images?.find((img: any) => img.coverType === 'Clearlogo' || img.coverType === 'Clearart')
                        const fanart = data.images?.find((img: any) => img.coverType === 'Fanart') || data.images?.find((img: any) => img.coverType === 'Banner')
                        
                        // Strict requirement: MUST have a high-res fanart or banner for the premium look
                        const fanartUrl = fanart?.url || item.bannerImage;
                        
                        if (fanartUrl) {
                            if (mounted) {
                                setValidAnimeList(prev => {
                                    if (prev.length >= 15) return prev;
                                    
                                    // Robust duplicate check
                                    if (prev.some(p => (p.mal_id && p.mal_id === item.mal_id) || (p.anilistId && p.anilistId === item.anilistId) || (p.id && p.id === item.id))) return prev;
                                    
                                    const newItem = {
                                        ...item,
                                        logoUrl: clearlogo?.url || '',
                                        fanartUrl: fanartUrl
                                    } as ValidHeroAnime;
                                    
                                    // Sort items with logos to the front of the carousel
                                    const newList = [...prev, newItem].sort((a, b) => {
                                        if (a.logoUrl && !b.logoUrl) return -1;
                                        if (!a.logoUrl && b.logoUrl) return 1;
                                        return 0;
                                    });
                                    
                                    setIsFetching(false);
                                    return newList;
                                });
                            }
                        }
                    }
                } catch (err) {
                    // ignore
                } finally {
                    processedCount++;
                    if (processedCount === pool.length && mounted) {
                        setValidAnimeList(prev => {
                            if (prev.length === 0) {
                                setIsFetching(false);
                                return pool.slice(0, 5).map(i => ({
                                    ...i,
                                    logoUrl: '',
                                    fanartUrl: i.bannerImage || i.images?.webp?.large_image_url || i.images?.jpg?.large_image_url || ''
                                }));
                            }
                            return prev;
                        });
                    }
                }
            })
        }

        loadHeroAnime()

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
            <AnimatePresence>
                <motion.div
                    key={active.mal_id || active.id || current}
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
                    <div className="container relative h-full z-20 flex flex-col justify-end pb-12 sm:pb-16 lg:pb-20">
                        <div className="max-w-xl xl:max-w-2xl space-y-3 lg:space-y-4">
                            
                            {/* Title/Logo */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="min-h-[60px] md:min-h-[90px] lg:min-h-[100px] xl:min-h-[130px] flex items-end"
                            >
                                {active.logoUrl ? (
                                    <div className="relative h-[80px] sm:h-[100px] md:h-[110px] lg:h-[120px] xl:h-[160px] w-full max-w-[300px] sm:max-w-[400px] md:max-w-[420px] lg:max-w-[450px] xl:max-w-[500px]">
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
                                    <h1 className="font-outfit font-black leading-none tracking-tighter text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-7xl">
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
                                <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-sm text-xs sm:text-sm font-semibold text-white/90">
                                    {active.type || 'TV'}
                                </div>
                                <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-sm text-xs sm:text-sm font-semibold text-white/90">
                                    {active.status || 'Finished'}
                                </div>
                                {active.year && (
                                    <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-sm text-xs sm:text-sm font-semibold text-white/90">
                                        {active.year}
                                    </div>
                                )}
                                {active.score && (
                                    <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-3 py-1 rounded-sm text-xs sm:text-sm font-semibold text-white/90">
                                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                        <span>{active.score.toFixed(1)}</span>
                                    </div>
                                )}
                            </motion.div>

                            {/* Genres as plain text */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-sm sm:text-base font-semibold text-white/80"
                            >
                                {active.genres?.map(g => g.name).join(', ')}
                            </motion.div>

                            {/* Synopsis */}
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-xs sm:text-sm lg:text-base text-white/70 line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-2xl"
                                dangerouslySetInnerHTML={{ __html: active.synopsis || '' }}
                            />

                            {/* Action Buttons */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2 lg:pt-4"
                            >
                                <Link href={`/anime/${active.mal_id}`}>
                                    <Button className="h-10 sm:h-12 xl:h-14 px-6 sm:px-8 xl:px-10 text-sm sm:text-base xl:text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full gap-2 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                                        <Play className="w-4 h-4 xl:w-5 xl:h-5 fill-current" /> Watch Now
                                    </Button>
                                </Link>

                                <Link href={`/anime/${active.mal_id}`}>
                                    <Button variant="secondary" className="h-10 sm:h-12 xl:h-14 px-6 sm:px-8 xl:px-10 text-sm sm:text-base xl:text-lg bg-white hover:bg-white/90 text-black font-bold rounded-full gap-2 transition-transform hover:scale-105 active:scale-95">
                                        Details <ChevronRight className="w-4 h-4 xl:w-5 xl:h-5 text-black/70" />
                                    </Button>
                                </Link>
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
