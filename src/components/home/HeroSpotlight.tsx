'use client'

import { useState, useEffect, useRef } from 'react'
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

type HeroEntry = {
    mal_id: number;
    title: string;
    logoUrl: string;
    fanartUrl: string;
    genres: { name: string }[];
    synopsis: string;
    score: number;
    status: string;
    type: string;
    year?: number;
}

function buildInitialList(animeList: Anime[]): HeroEntry[] {
    if (!animeList) return [];
    return animeList.map(item => {
        let fanartUrl = '';
        if (item.trailer?.images?.maximum_image_url) {
            fanartUrl = item.trailer.images.maximum_image_url;
        } else if (item.bannerImage) {
            fanartUrl = item.bannerImage;
        } else if (item.images?.webp?.large_image_url) {
            fanartUrl = item.images.webp.large_image_url;
        }

        return {
            mal_id: item.mal_id,
            title: item.title_english || item.title || '',
            logoUrl: '',
            fanartUrl,
            genres: (item.genres || []).map((g: any) => ({ name: g.name || g })),
            synopsis: item.synopsis || '',
            score: item.score ?? 0,
            status: item.status ?? 'Finished',
            type: item.type ?? 'TV',
            year: item.year ?? (item.aired as any)?.prop?.from?.year ?? undefined,
        }
    }).filter(item => item.fanartUrl);
}

export function HeroSpotlight({ anime }: HeroSpotlightProps) {
    const [list, setList] = useState<HeroEntry[]>([])
    const [current, setCurrent] = useState(0)
    
    // Track if we have initialized to avoid flicker if anime prop stays same
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!anime?.length) return;
        
        const initial = buildInitialList(anime).slice(0, 15);
        if (initial.length === 0) return;
        
        setList(initial);
        initializedRef.current = true;
        setCurrent(0);

        let mounted = true;

        Promise.allSettled(
            initial.map(async (item) => {
                try {
                    const res = await fetch(`https://api.ani.zip/mappings?mal_id=${item.mal_id}`)
                    if (!res.ok) return null
                    const data = await res.json()
                    const logo = data.images?.find((img: any) => img.coverType === 'Clearlogo' || img.coverType === 'Clearart')
                    const fanart = data.images?.find((img: any) => img.coverType === 'Fanart') || data.images?.find((img: any) => img.coverType === 'Banner')
                    
                    if (logo || fanart) {
                        return {
                            mal_id: item.mal_id,
                            logoUrl: logo?.url || '',
                            fanartUrl: fanart?.url || '' 
                        }
                    }
                    return null;
                } catch {
                    return null;
                }
            })
        ).then(results => {
            if (!mounted) return;
            const updates = results
                .filter(r => r.status === 'fulfilled' && r.value !== null)
                .map(r => (r as PromiseFulfilledResult<any>).value!);
            
            if (updates.length > 0) {
                setList(prevList => {
                    const newList = [...prevList];
                    let changed = false;
                    updates.forEach(update => {
                        const idx = newList.findIndex(x => x.mal_id === update.mal_id);
                        if (idx !== -1) {
                            newList[idx] = {
                                ...newList[idx],
                                logoUrl: update.logoUrl || newList[idx].logoUrl,
                                fanartUrl: update.fanartUrl || newList[idx].fanartUrl,
                            };
                            changed = true;
                        }
                    });
                    return changed ? newList : prevList;
                });
            }
        });

        return () => { mounted = false; }
    }, [anime]);

    useEffect(() => {
        if (list.length <= 1) return;
        const timer = setInterval(() => {
            setCurrent(prev => (prev + 1) % list.length)
        }, 8000)
        return () => clearInterval(timer)
    }, [list.length])

    const active = list[current % list.length]
    if (!active) return null

    const prev = () => setCurrent(p => (p - 1 + list.length) % list.length)
    const next = () => setCurrent(p => (p + 1) % list.length)

    return (
        <section className="relative h-[80vh] min-h-[600px] w-full overflow-hidden bg-background group">
            <AnimatePresence mode="sync">
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
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={active.fanartUrl}
                            alt={active.title}
                            className="absolute inset-0 w-full h-full object-cover object-top opacity-90 dark:opacity-80"
                            loading="eager"
                            decoding="async"
                            referrerPolicy="no-referrer"
                        />

                        {/* Gradients for text legibility */}
                        <div className="absolute inset-0 z-10 bg-gradient-to-r from-background via-background/80 md:via-background/50 to-transparent w-full md:w-[65%]" />
                        <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-background/20 to-transparent h-full" />
                    </div>

                    {/* CONTENT ALIGNED TO BOTTOM LEFT */}
                    <div className="container relative h-full z-20 flex flex-col justify-end pb-12 sm:pb-16 lg:pb-20">
                        <div className="max-w-xl xl:max-w-2xl space-y-3 lg:space-y-4">

                            {/* Title / Logo */}
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

                            {/* Tag Pills */}
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
                                        <span>{typeof active.score === 'number' ? active.score.toFixed(1) : active.score}</span>
                                    </div>
                                )}
                            </motion.div>

                            {/* Genres */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-sm sm:text-base font-semibold text-white/80"
                            >
                                {active.genres?.map((g: any) => g.name || g).join(', ')}
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

            {/* Slide Dot Indicators */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {list.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className={cn(
                            "rounded-full transition-all duration-300",
                            i === current
                                ? "w-6 h-1.5 bg-white"
                                : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"
                        )}
                        aria-label={`Go to slide ${i + 1}`}
                    />
                ))}
            </div>

            {/* Side Navigation Arrows */}
            <button
                onClick={prev}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 p-2 text-white/50 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Previous Slide"
            >
                <ChevronLeft size={32} strokeWidth={2.5} />
            </button>
            <button
                onClick={next}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 p-2 text-white/50 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Next Slide"
            >
                <ChevronRight size={32} strokeWidth={2.5} />
            </button>
        </section>
    )
}
