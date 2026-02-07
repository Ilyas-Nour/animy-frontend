'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { XCircle, ArrowLeft, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/common/Loading'
import { WatchlistGrid } from '@/components/dashboard/WatchlistGrid'
import api from '@/lib/api'

export default function DroppedPage() {
    const router = useRouter()
    const { isAuthenticated, isLoading } = useAuth()
    const [dropped, setDropped] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth/login')
        }
    }, [isAuthenticated, isLoading, router])

    useEffect(() => {
        const fetchDropped = async () => {
            try {
                const response = await api.get('/users/watchlist')
                const droppedOnly = response.data.data.filter((item: any) => item.status === 'DROPPED')
                setDropped(droppedOnly)
            } catch (error) {
                console.error('Failed to fetch dropped list:', error)
            } finally {
                setLoading(false)
            }
        }

        if (isAuthenticated) {
            fetchDropped()
        }
    }, [isAuthenticated])

    const handleRemove = async (animeId: number) => {
        try {
            await api.delete(`/users/watchlist/${animeId}`)
            setDropped(dropped.filter(item => item.animeId !== animeId))
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
                    <XCircle className="h-8 w-8 text-red-500" />
                    Dropped Anime
                </h1>
                <p className="text-muted-foreground">
                    {dropped.length} anime you&apos;ve dropped
                </p>
            </div>

            <WatchlistGrid
                items={dropped}
                onRemove={handleRemove}
                emptyIcon={XCircle}
                emptyTitle="No dropped anime"
                emptyMessage="Anime you drop will appear here"
                statusLabel="Dropped"
                statusBadgeColor="bg-red-500"
            />
        </div>
    )
}