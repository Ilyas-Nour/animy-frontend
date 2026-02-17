'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, LucideIcon, BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface MangaListItem {
    id: number
    mangaId: number
    mangaTitle: string
    mangaImage: string
    status?: string
    updatedAt?: string
    addedAt?: string
}

interface MangaListGridProps {
    items: MangaListItem[]
    onRemove: (mangaId: number) => void
    isLoading?: boolean
    emptyIcon: LucideIcon
    emptyTitle: string
    emptyMessage: string
    statusBadgeColor?: string
    statusLabel?: string
}

export function MangaListGrid({
    items,
    onRemove,
    isLoading,
    emptyIcon: EmptyIcon,
    emptyTitle,
    emptyMessage,
    statusBadgeColor = 'bg-primary',
    statusLabel
}: MangaListGridProps) {
    if (items.length === 0) {
        return (
            <Card className="p-12 text-center border-dashed border-white/10 bg-white/5">
                <EmptyIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2 text-white">{emptyTitle}</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    {emptyMessage}
                </p>
                <Link href="/manga">
                    <Button>Browse Manga</Button>
                </Link>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 4xl:grid-cols-10 5xl:grid-cols-12 gap-4">
            {items.map((item, index) => (
                <motion.div
                    key={item.id || item.mangaId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                >
                    <Card className="group overflow-hidden hover:shadow-lg transition-all border-white/5 bg-card/50 h-full relative">
                        <Link href={`/manga/${item.mangaId}`} className="absolute inset-0 z-10">
                            <span className="sr-only">View {item.mangaTitle}</span>
                        </Link>
                        <div className="relative aspect-[2/3] overflow-hidden">
                            {item.mangaImage ? (
                                <Image
                                    src={item.mangaImage}
                                    alt={item.mangaTitle}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                            )}

                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0 z-20">
                                <Button
                                    size="icon"
                                    variant="destructive"
                                    className="h-7 w-7 rounded-lg shadow-sm"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        onRemove(item.mangaId)
                                    }}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>

                            {statusLabel && (
                                <div className="absolute top-2 left-2 pointer-events-none z-20">
                                    <Badge className={`${statusBadgeColor} text-white text-[10px] px-2 py-0.5 shadow-sm`}>
                                        {statusLabel}
                                    </Badge>
                                </div>
                            )}
                        </div>
                        <CardContent className="p-3">
                            <h3 className="text-sm font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors text-white" title={item.mangaTitle}>
                                {item.mangaTitle}
                            </h3>
                            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                                {new Date(item.updatedAt || item.addedAt || new Date()).toLocaleDateString()}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    )
}
