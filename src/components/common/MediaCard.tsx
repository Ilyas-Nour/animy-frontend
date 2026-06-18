'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Star, BookOpen, Tv, Play } from 'lucide-react'
import { truncateText, stripHtml, cn } from '@/lib/utils'

interface MediaCardProps {
    item: {
        mal_id: number;
        title: string;
        images?: {
            jpg?: { large_image_url?: string; image_url?: string; };
            webp?: { large_image_url?: string; image_url?: string; };
        };
        score?: number;
        type?: string;
        synopsis?: string;
        genres?: Array<{ name: string; mal_id: number }>;
        status?: string;
        chapters?: number;
        episodes?: number;
    }
    type: 'anime' | 'manga'
    index?: number
}

export function MediaCard({ item, type, index = 0 }: MediaCardProps) {
    const isAiringOrPublishing = item.status === 'Currently Airing' || item.status === 'Publishing'
    const image = item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url || item.images?.webp?.image_url || ''

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.4 }}
        >
            <Link href={`/${type}/${item.mal_id}`} className="group block relative rounded-2xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-secondary">
                    {/* Status Badge */}
                    {isAiringOrPublishing && (
                        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/80 backdrop-blur-md border border-border">
                            <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${type === 'anime' ? 'bg-green-400' : 'bg-pink-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${type === 'anime' ? 'bg-green-500' : 'bg-pink-500'}`}></span>
                            </span>
                            <span className="text-[10px] font-bold text-foreground">
                                {item.status === 'Currently Airing' ? 'Airing' : 'Publishing'}
                            </span>
                        </div>
                    )}

                    {/* Type Badge */}
                    {item.type && (
                        <div className="absolute top-2 right-2 z-20 px-2 py-1 rounded-md bg-background/80 backdrop-blur-md border border-border flex items-center gap-1 text-[10px] font-bold text-foreground">
                            {type === 'manga' ? <BookOpen className="w-3 h-3 text-pink-500" /> : <Tv className="w-3 h-3 text-blue-500" />}
                            {item.type}
                        </div>
                    )}

                    {image ? (
                        <Image
                            src={image}
                            alt={item.title}
                            fill
                            className="object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/30">
                            {type === 'manga' ? <BookOpen className="w-12 h-12 mb-2" /> : <Tv className="w-12 h-12 mb-2" />}
                            <span className="text-xs font-semibold">No Image</span>
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

                    {/* Hover Action Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-100 scale-75 z-20">
                        <div className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm",
                            type === 'anime' 
                                ? "bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.5)]" 
                                : "bg-pink-600/90 text-white shadow-[0_0_20px_rgba(236,72,153,0.5)]"
                        )}>
                            {type === 'anime' ? <Play className="w-6 h-6 ml-1 fill-current" /> : <BookOpen className="w-6 h-6" />}
                        </div>
                    </div>

                    {/* Bottom Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 z-20 flex flex-col gap-2">
                        {/* Title & Score */}
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug drop-shadow-md">
                                {truncateText(item.title, 45)}
                            </h3>
                            {item.score && (
                                <div className="flex items-center gap-1 shrink-0 bg-yellow-500/20 backdrop-blur-md px-1.5 py-0.5 rounded border border-yellow-500/30">
                                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                    <span className="text-xs font-bold text-yellow-100">{item.score}</span>
                                </div>
                            )}
                        </div>

                        {/* Sliding Genres */}
                        <div className="flex gap-1.5 overflow-hidden translate-y-[150%] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                            {item.genres?.slice(0, 3).map(genre => (
                                <span
                                    key={genre.mal_id}
                                    className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/80 bg-white/20 backdrop-blur-md rounded border border-white/20 whitespace-nowrap"
                                >
                                    {genre.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}
