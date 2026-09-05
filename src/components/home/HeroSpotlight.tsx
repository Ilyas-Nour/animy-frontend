'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Play, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Anime } from '@/types/anime'
import { cn } from '@/lib/utils'

// Curated hero entries with reliable image sources.
// fanartUrl: high-res banner/fanart from AniList CDN (always works, no hotlink block)
const HERO_STATIC = [
    {
        mal_id: 5114,
        title: 'Fullmetal Alchemist: Brotherhood',
        logoUrl: '',
        fanartUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/5114-LuHrFVoGbRs1.jpg',
        genres: ['Action', 'Adventure', 'Drama', 'Fantasy'],
        synopsis: 'Two brothers search for a Philosopher\'s Stone after an attempt to revive their deceased mother goes awry, leaving them in damaged physical forms.',
        score: 9.1, status: 'Finished', type: 'TV', year: 2009,
    },
    {
        mal_id: 1535,
        title: 'Death Note',
        logoUrl: '',
        fanartUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/1535.jpg',
        genres: ['Mystery', 'Psychological', 'Supernatural', 'Thriller'],
        synopsis: 'A high school student discovers a supernatural notebook that allows him to kill anyone whose name he writes in it.',
        score: 8.6, status: 'Finished', type: 'TV', year: 2006,
    },
    {
        mal_id: 16498,
        title: 'Attack on Titan',
        logoUrl: '',
        fanartUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFCOcDmneX.jpg',
        genres: ['Action', 'Drama', 'Fantasy', 'Mystery'],
        synopsis: 'Humanity lives within enormous walled cities to protect themselves from man-eating giants. A young boy vows revenge after his hometown is destroyed.',
        score: 9.0, status: 'Finished', type: 'TV', year: 2013,
    },
    {
        mal_id: 21,
        title: 'One Piece',
        logoUrl: '',
        fanartUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJmZqs.jpg',
        genres: ['Action', 'Adventure', 'Comedy', 'Fantasy'],
        synopsis: 'Monkey D. Luffy sets off on an adventure to find the legendary One Piece and become King of the Pirates.',
        score: 8.7, status: 'Releasing', type: 'TV', year: 1999,
    },
    {
        mal_id: 11061,
        title: 'Hunter x Hunter (2011)',
        logoUrl: '',
        fanartUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/11061-JeZRsfIPRyZb.jpg',
        genres: ['Action', 'Adventure', 'Fantasy', 'Shounen'],
        synopsis: 'Gon Freecss aspires to become a Hunter to find his missing father, an exceptionally rare individual who hunts incredible wonders of the world.',
        score: 9.0, status: 'Finished', type: 'TV', year: 2011,
    },
    {
        mal_id: 44511,
        title: 'Demon Slayer',
        logoUrl: '',
        fanartUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-YfZhKBUDDS6L.jpg',
        genres: ['Action', 'Fantasy', 'Historical', 'Supernatural'],
        synopsis: 'A young boy becomes a demon slayer to avenge his family and cure his sister after they are attacked by demons.',
        score: 8.7, status: 'Releasing', type: 'TV', year: 2019,
    },
    {
        mal_id: 40748,
        title: 'Jujutsu Kaisen',
        logoUrl: '',
        fanartUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-BBJRRZbGHBDF.jpg',
        genres: ['Action', 'Fantasy', 'Horror', 'Supernatural'],
        synopsis: 'A boy swallows a cursed talisman and becomes host to a powerful demon. He joins secret sorcerers to eliminate curses.',
        score: 8.6, status: 'Releasing', type: 'TV', year: 2020,
    },
    {
        mal_id: 38000,
        title: 'Chainsaw Man',
        logoUrl: '',
        fanartUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/127230-YgWF8NICmfSY.jpg',
        genres: ['Action', 'Adventure', 'Supernatural'],
        synopsis: 'Denji merges with his pet devil Pochita and becomes Chainsaw Man — a devil-human hybrid with chainsaws erupting from his body.',
        score: 8.6, status: 'Releasing', type: 'TV', year: 2022,
    },
    {
        mal_id: 9253,
        title: 'Steins;Gate',
        logoUrl: '',
        fanartUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/9253-UHWFnXaXbBBq.jpg',
        genres: ['Drama', 'Sci-Fi', 'Thriller'],
        synopsis: 'A group of friends accidentally discover time travel through text messages, leading to dire consequences threatening their very lives.',
        score: 9.1, status: 'Finished', type: 'TV', year: 2011,
    },
    {
        mal_id: 30276,
        title: 'One Punch Man',
        logoUrl: '',
        fanartUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/97940-3oFRBCOmRUwH.jpg',
        genres: ['Action', 'Comedy', 'Sci-Fi', 'Superhero'],
        synopsis: 'Saitama is a superhero who can defeat any enemy with a single punch. He seeks a worthy opponent while dealing with existential boredom.',
        score: 8.7, status: 'Finished', type: 'TV', year: 2015,
    },
    {
        mal_id: 49387,
        title: 'Spy x Family',
        logoUrl: '',
        fanartUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/140960-C7v5mXBCOPCF.jpg',
        genres: ['Action', 'Comedy', 'Slice of Life'],
        synopsis: 'A spy, an assassin, and a telepathic girl create a fake family for a mission, while hiding their true identities from each other.',
        score: 8.6, status: 'Finished', type: 'TV', year: 2022,
    },
    {
        mal_id: 52991,
        title: "Frieren: Beyond Journey's End",
        logoUrl: '',
        fanartUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-Wq4GRNMIdSUQ.jpg',
        genres: ['Adventure', 'Drama', 'Fantasy'],
        synopsis: 'An elven mage reflects on her quest with the hero\'s party after their passing, as she travels to understand the humans she never truly knew.',
        score: 9.1, status: 'Finished', type: 'TV', year: 2023,
    },
    {
        mal_id: 31964,
        title: 'My Hero Academia',
        logoUrl: '',
        fanartUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/100166-t2v1LG4FLFAJ.jpg',
        genres: ['Action', 'Comedy', 'School', 'Superhero'],
        synopsis: 'In a world where most have superpowers called "Quirks," a boy born without one inherits the greatest power and enrolls in superhero high school.',
        score: 7.8, status: 'Finished', type: 'TV', year: 2016,
    },
    {
        mal_id: 1,
        title: 'Cowboy Bebop',
        logoUrl: '',
        fanartUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/1-T3PJUjFJyRSg.jpg',
        genres: ['Action', 'Adventure', 'Drama', 'Sci-Fi'],
        synopsis: 'A ragtag crew of bounty hunters chases criminals across the solar system while each dealing with their troubled pasts.',
        score: 8.8, status: 'Finished', type: 'TV', year: 1998,
    },
    {
        mal_id: 20,
        title: 'Naruto',
        logoUrl: '',
        fanartUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/20-WvJEhcv1KXzj.jpg',
        genres: ['Action', 'Adventure', 'Fantasy', 'Martial Arts'],
        synopsis: 'A young ninja with a powerful demon fox spirit seeks recognition and dreams of becoming the Hokage, leader of his village.',
        score: 8.0, status: 'Finished', type: 'TV', year: 2002,
    },
    {
        mal_id: 459,
        title: 'Bleach',
        logoUrl: '',
        fanartUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/269-UAt7BNjGMFmQ.jpg',
        genres: ['Action', 'Adventure', 'Comedy', 'Supernatural'],
        synopsis: 'High school student Ichigo Kurosaki gains Soul Reaper powers and must defend the living world from evil spirits called Hollows.',
        score: 7.9, status: 'Releasing', type: 'TV', year: 2004,
    },
    {
        mal_id: 33,
        title: 'Dragon Ball Z',
        logoUrl: '',
        fanartUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/139-4-KMT7rLFe.jpg',
        genres: ['Action', 'Adventure', 'Comedy', 'Fantasy'],
        synopsis: 'Goku and his allies defend Earth against increasingly powerful villains including Saiyans, Frieza, Cell, and Majin Buu.',
        score: 8.2, status: 'Finished', type: 'TV', year: 1989,
    },
    {
        mal_id: 28977,
        title: 'Sword Art Online',
        logoUrl: '',
        fanartUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/11757-9XfMGRYNvFaU.jpg',
        genres: ['Action', 'Adventure', 'Fantasy', 'Romance'],
        synopsis: 'In the near future, players are trapped inside a virtual reality MMORPG and must clear the game to escape, or face death.',
        score: 7.2, status: 'Finished', type: 'TV', year: 2012,
    },
]

interface HeroSpotlightProps {
    anime: Anime[]
}

// Map static list into the shape the component renders
type HeroEntry = Omit<typeof HERO_STATIC[number], 'genres'> & { genres: { name: string }[] }

export function HeroSpotlight({ anime }: HeroSpotlightProps) {
    // Step 1: build initial list from static curated data — renders INSTANTLY, no API wait
    const staticList: HeroEntry[] = HERO_STATIC.map(h => ({
        ...h,
        genres: h.genres.map(g => ({ name: g })),
    }))

    const [list, setList] = useState<HeroEntry[]>(staticList)
    const [current, setCurrent] = useState(0)

    // Step 2: In background, try to enrich with extra dynamic anime from the `anime` prop
    useEffect(() => {
        if (!anime?.length) return
        let mounted = true

        const alreadyHasMalIds = new Set(HERO_STATIC.map(h => h.mal_id))
        const candidates = anime.filter(a => a.mal_id && !alreadyHasMalIds.has(a.mal_id)).slice(0, 15)
        if (!candidates.length) return

        Promise.allSettled(
            candidates.map(async (item) => {
                const res = await fetch(`https://api.ani.zip/mappings?mal_id=${item.mal_id}`)
                if (!res.ok) return null
                const data = await res.json()
                const logo = data.images?.find((img: any) => img.coverType === 'Clearlogo' || img.coverType === 'Clearart')
                const fanart = data.images?.find((img: any) => img.coverType === 'Fanart') || data.images?.find((img: any) => img.coverType === 'Banner')
                const fanartUrl = fanart?.url || item.bannerImage || item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url || ''
                if (!fanartUrl) return null
                return {
                    ...item,
                    logoUrl: logo?.url || '',
                    fanartUrl,
                    genres: (item.genres || []).map((g: any) => ({ name: g.name || g })),
                    score: item.score ?? 0,
                    status: item.status ?? 'Finished',
                    type: item.type ?? 'TV',
                    year: item.year ?? (item.aired as any)?.prop?.from?.year ?? undefined,
                } as HeroEntry
            })
        ).then(results => {
            if (!mounted) return
            const valid = results
                .filter(r => r.status === 'fulfilled' && r.value !== null)
                .map(r => (r as PromiseFulfilledResult<HeroEntry | null>).value!)
                .filter(Boolean)
            if (valid.length > 0) {
                setList(prev => [...prev, ...valid].slice(0, 25))
            }
        })

        return () => { mounted = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [anime])

    // Auto-advance carousel
    useEffect(() => {
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
