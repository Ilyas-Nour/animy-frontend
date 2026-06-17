'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { PlayCircle, ArrowLeft, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/common/Loading'
import { WatchlistGrid } from '@/components/dashboard/WatchlistGrid'
import api from '@/lib/api'

export default function WatchingPage() {
    const router = useRouter()
    const { isAuthenticated, isLoading } = useAuth()
    const [watching, setWatching] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth/login')
        }
    }, [isAuthenticated, isLoading, router])

    useEffect(() => {
        const fetchWatching = async () => {
            try {
                const response = await api.get('/users/watchlist')
                const watchingOnly = response.data.data.filter((item: any) => item.status === 'WATCHING')
                setWatching(watchingOnly)
            } catch (error) {
                console.error('Failed to fetch watching list:', error)
            } finally {
                setLoading(false)
            }
        }

        if (isAuthenticated) {
            fetchWatching()
        }
    }, [isAuthenticated])

    const handleRemove = async (animeId: number) => {
        try {
            await api.delete(`/users/watchlist/${animeId}`)
            setWatching(watching.filter(item => item.animeId !== animeId))
        } catch (error) {
            console.error('Failed to remove from watchlist:', error)
        }
    }

    if (isLoading || loading) return <Loading />

    return (
        <div className="container py-12 space-y-8">
            <div className="space-y-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </Link>
                <h1 className="text-4xl font-bold flex items-center gap-3">
                    <PlayCircle className="h-8 w-8 text-blue-500" />
                    Currently Watching
                </h1>
                <p className="text-muted-foreground">
                    {watching.length} anime you&apos;re watching right now
                </p>
            </div>

            <WatchlistGrid
                items={watching}
                onRemove={handleRemove}
                emptyIcon={PlayCircle}
                emptyTitle="Not watching anything yet"
                emptyMessage="Start watching some anime to track your progress"
                statusLabel="Watching"
                statusBadgeColor="bg-blue-500"
            />
        </div>
    )
}