export const runtime = 'edge';
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    ChevronLeft,
    Search,
    TrendingUp,
    Flame,
    CheckCircle2,
    XCircle,
    Clock,
    Tv,
    BookOpen,
    ArrowUpRight
} from 'lucide-react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import Image from 'next/image'

interface ReportItem {
    id: number
    title: string
    image: string
    count: number
}

export default function MediaReportPage() {
    const params = useParams()
    const { type, metric } = params as { type: string, metric: string }

    const [items, setItems] = useState<ReportItem[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await api.get(`/admin/reports/${type}/${metric}`)
                const data = res.data?.data || res.data
                setItems(Array.isArray(data) ? data : [])
            } catch (error) {
                console.error('Failed to fetch report', error)
            } finally {
                setLoading(false)
            }
        }
        fetchReport()
    }, [type, metric])

    const getMetricIcon = () => {
        switch (metric) {
            case 'favorites': return <Flame className="w-5 h-5 text-red-500" />
            case 'COMPLETED': return <CheckCircle2 className="w-5 h-5 text-primary" />
            case 'DROPPED': return <XCircle className="w-5 h-5 text-red-500" />
            case 'WATCHING':
            case 'READING': return <Clock className="w-5 h-5 text-green-500" />
            default: return <TrendingUp className="w-5 h-5 text-purple-500" />
        }
    }

    const filtered = items.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-8 pb-20 px-4 sm:px-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-3 sm:gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 sm:w-10 sm:h-10">
                            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black capitalize flex items-center gap-2 sm:gap-3">
                            {getMetricIcon()}
                            <span className="truncate">{type} {metric.replace(/_/g, ' ')}</span>
                        </h1>
                        <p className="text-muted-foreground font-medium text-xs sm:text-sm">Ranked engagement metrics for {type}.</p>
                    </div>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search items..."
                        className="pl-10 rounded-xl h-10 sm:h-11"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                        <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-2xl" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <Card className="p-20 text-center border-dashed bg-muted/20">
                    <p className="text-muted-foreground italic font-medium">No results found for your search.</p>
                </Card>
            ) : (
                <div className="grid gap-3 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {filtered.map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Link href={`/admin/reports/${type}/${metric}/${item.id}`}>
                                <Card className="overflow-hidden group hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 bg-card/60 backdrop-blur-sm relative cursor-pointer sm:rounded-2xl rounded-xl">
                                    <div className="relative aspect-[2/3]">
                                        <Image
                                            src={item.image || '/placeholder-anime.png'}
                                            alt={item.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />
                                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                                            <Badge className="bg-primary/95 text-primary-foreground font-black px-2 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-xs shadow-lg rounded-md">
                                                #{idx + 1}
                                            </Badge>
                                        </div>
                                        <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4">
                                            <p className="text-white font-black text-sm sm:text-lg leading-tight line-clamp-2 drop-shadow-md">
                                                {item.title}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-2 sm:p-4 flex items-center justify-between bg-muted/20">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] sm:text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60">Score</span>
                                            <span className="text-sm sm:text-lg font-black">{item.count}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                            <ArrowUpRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                                        </Button>
                                    </div>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
