'use client'

export const runtime = 'edge';

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { PlayCircle, CheckCircle, Clock1, PauseCircle, XCircle, ArrowLeft, BarChart3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/common/Loading'
import api from '@/lib/api'
import Image from 'next/image'
import Link from 'next/link'

export default function UserAnimeListPage() {
    const params = useParams()
    const router = useRouter()
    const username = params.username as string
    const [watchlist, setWatchlist] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('ALL')

    useEffect(() => {
        const fetchWatchlist = async () => {
            try {
                setLoading(true)
                const res = await api.get(`/users/${username}/watchlist`)
                setWatchlist(res.data.data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        if (username) fetchWatchlist()
    }, [username])

    const statusOptions = [
        { value: 'WATCHING', label: 'Watching', color: 'bg-blue-500', icon: PlayCircle },
        { value: 'COMPLETED', label: 'Completed', color: 'bg-green-500', icon: CheckCircle },
        { value: 'ON_HOLD', label: 'On Hold', color: 'bg-orange-500', icon: PauseCircle },
        { value: 'DROPPED', label: 'Dropped', color: 'bg-red-500', icon: XCircle },
        { value: 'PLAN_TO_WATCH', label: 'Planned', color: 'bg-yellow-500', icon: Clock1 },
    ]

    const filteredList = filter === 'ALL'
        ? watchlist
        : watchlist.filter(item => item.status === filter)

    if (loading) return <Loading />

    return (
        <div className="min-h-screen bg-background pb-20 pt-12">
            <div className="container max-w-7xl mx-auto px-4 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <Link href={`/users/${username}`}>
                            <Button variant="ghost" className="gap-2 mb-4">
                                <ArrowLeft className="h-4 w-4" /> Back to Profile
                            </Button>
                        </Link>
                        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                            <BarChart3 className="h-10 w-10 text-primary" />
                            @{username}&apos;s Anime Journey
                        </h1>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={filter === 'ALL' ? 'default' : 'outline'}
                            onClick={() => setFilter('ALL')}
                            className="rounded-full"
                        >
                            All
                        </Button>
                        {statusOptions.map(opt => (
                            <Button
                                key={opt.value}
                                variant={filter === opt.value ? 'default' : 'outline'}
                                onClick={() => setFilter(opt.value)}
                                className="rounded-full gap-2"
                            >
                                <opt.icon className="h-4 w-4" />
                                {opt.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {filteredList.length === 0 ? (
                    <div className="py-20 text-center bg-card/50 backdrop-blur-xl border border-dashed border-border rounded-3xl">
                        <p className="text-xl text-muted-foreground">No anime found in this category.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {filteredList.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Link href={`/anime/${item.animeId}`}>
                                    <div className="group relative aspect-[2/3] rounded-2xl overflow-hidden bg-muted shadow-lg hover:shadow-primary/20 transition-all border border-border">
                                        {item.animeImage ? (
                                            <Image src={item.animeImage} alt={item.animeTitle} fill className="object-cover transition-transform group-hover:scale-110 duration-500" sizes="(max-width: 768px) 50vw, 20vw" />
                                        ) : (
                                            <div className="flex items-center justify-center w-full h-full text-muted-foreground">No Image</div>
                                        )}
                                        <div className="absolute top-2 left-2 z-20">
                                            <Badge className={`${statusOptions.find(o => o.value === item.status)?.color || 'bg-secondary'} text-white border-0 shadow-lg`}>
                                                {statusOptions.find(o => o.value === item.status)?.label || item.status}
                                            </Badge>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                            <p className="text-white font-bold text-sm line-clamp-2">{item.animeTitle}</p>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
