'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { PauseCircle, ArrowLeft, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/common/Loading'
import { WatchlistGrid } from '@/components/dashboard/WatchlistGrid'
import api from '@/lib/api'

export default function OnHoldPage() {
    const router = useRouter()
    const { isAuthenticated, isLoading } = useAuth()
    const [onHold, setOnHold] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth/login')
        }
    }, [isAuthenticated, isLoading, router])

    useEffect(() => {
        const fetchOnHold = async () => {
            try {
                const response = await api.get('/users/watchlist')
                const onHoldOnly = response.data.data.filter((item: any) => item.status === 'ON_HOLD')
                setOnHold(onHoldOnly)
            } catch (error) {
                console.error('Failed to fetch on hold list:', error)
            } finally {
                setLoading(false)
            }
        }

        if (isAuthenticated) {
            fetchOnHold()
        }
    }, [isAuthenticated])

    const handleRemove = async (animeId: number) => {
        try {
            await api.delete(`/users/watchlist/${animeId}`)
            setOnHold(onHold.filter(item => item.animeId !== animeId))
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
                    <PauseCircle className="h-8 w-8 text-orange-500" />
                    On Hold
                </h1>
                <p className="text-muted-foreground">
                    {onHold.length} anime you&apos;ve paused
                </p>
            </div>

            <WatchlistGrid
                items={onHold}
                onRemove={handleRemove}
                emptyIcon={PauseCircle}
                emptyTitle="No anime on hold"
                emptyMessage="Anime you pause will appear here"
                statusLabel="On Hold"
                statusBadgeColor="bg-orange-500"
            />
        </div>
    )
}