'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Star, BookOpen, Tv } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { truncateText } from '@/lib/utils'

interface MediaCardProps {
    id: number
    title: string
    image: string
    score?: number
    type?: string
    subtitle?: string | number
    link: string
    index?: number
    genres?: { name: string; mal_id: number }[]
    synopsis?: string
}

export function MediaCard({
    id,
    title,
    image,
    score,
    type,
    subtitle,
    link,
    index = 0,
    genres = [],
    synopsis
}: MediaCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <Link href={link}>
                <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full border-muted/40">
                    <div className="relative aspect-[2/3] overflow-hidden">
                        <Image
                            src={image || '/placeholder.png'}
                            alt={title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                        />
                        {score && (
                            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md rounded-full px-2 py-1 flex items-center space-x-1 shadow-sm border border-white/10">
                                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                <span className="text-white text-xs font-bold">
                                    {score.toFixed(1)}
                                </span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    <CardContent className="p-3">
                        <h3 className="font-semibold text-sm md:text-base line-clamp-2 group-hover:text-primary transition-colors leading-tight mb-1">
                            {title}
                        </h3>

                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {type && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-normal bg-muted">
                                    {type === 'TV' || type === 'Movie' ? <Tv className="h-3 w-3 mr-1" /> : <BookOpen className="h-3 w-3 mr-1" />}
                                    {type}
                                </Badge>
                            )}
                            {subtitle && (
                                <Badge variant="outline" className="text-[10px] px-1.5 h-5 font-normal text-muted-foreground">
                                    {subtitle}
                                </Badge>
                            )}
                        </div>

                        {synopsis && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute inset-x-3 bottom-12 z-10 text-white drop-shadow-md hidden md:block">
                                {truncateText(synopsis, 80)}
                            </p>
                        )}
                    </CardContent>

                    <CardFooter className="p-3 pt-0">
                        {genres.length > 0 && (
                            <div className="flex flex-wrap gap-1 w-full overflow-hidden h-5">
                                {genres.slice(0, 2).map((genre) => (
                                    <span key={genre.mal_id} className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 rounded-sm">
                                        {genre.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </CardFooter>
                </Card>
            </Link>
        </motion.div>
    )
}
