'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, ArrowLeft, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/common/Loading'
import { WatchlistGrid } from '@/components/dashboard/WatchlistGrid'
import api from '@/lib/api'

export default function PlanToWatchPage() {
    const router = useRouter()
    const { isAuthenticated, isLoading } = useAuth()
    const [planToWatch, setPlanToWatch] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth/login')
        }
    }, [isAuthenticated, isLoading, router])

    useEffect(() => {
        const fetchPlanToWatch = async () => {
            try {
                const response = await api.get('/users/watchlist')
                const planToWatchOnly = response.data.data.filter((item: any) => item.status === 'PLAN_TO_WATCH')
                setPlanToWatch(planToWatchOnly)
            } catch (error) {
                console.error('Failed to fetch plan to watch list:', error)
            } finally {
                setLoading(false)
            }
        }

        if (isAuthenticated) {
            fetchPlanToWatch()
        }
    }, [isAuthenticated])

    const handleRemove = async (animeId: number) => {
        try {
            await api.delete(`/users/watchlist/${animeId}`)
            setPlanToWatch(planToWatch.filter(item => item.animeId !== animeId))
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
                    <Clock className="h-8 w-8 text-yellow-500" />
                    Plan to Watch
                </h1>
                <p className="text-muted-foreground">
                    {planToWatch.length} anime in your watch queue
                </p>
            </div>

            <WatchlistGrid
                items={planToWatch}
                onRemove={handleRemove}
                emptyIcon={Clock}
                emptyTitle="Your watch queue is empty"
                emptyMessage="Add anime to your plan to watch list"
                statusLabel="Plan to Watch"
                statusBadgeColor="bg-yellow-500"
            />
        </div>
    )
}