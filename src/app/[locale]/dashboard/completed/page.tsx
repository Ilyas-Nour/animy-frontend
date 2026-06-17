'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, ArrowLeft, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/common/Loading'
import { WatchlistGrid } from '@/components/dashboard/WatchlistGrid'
import api from '@/lib/api'

export default function CompletedPage() {
    const router = useRouter()
    const { isAuthenticated, isLoading } = useAuth()
    const [completed, setCompleted] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth/login')
        }
    }, [isAuthenticated, isLoading, router])

    useEffect(() => {
        const fetchCompleted = async () => {
            try {
                const response = await api.get('/users/watchlist')
                const completedOnly = response.data.data.filter((item: any) => item.status === 'COMPLETED')
                setCompleted(completedOnly)
            } catch (error) {
                console.error('Failed to fetch completed list:', error)
            } finally {
                setLoading(false)
            }
        }

        if (isAuthenticated) {
            fetchCompleted()
        }
    }, [isAuthenticated])

    const handleRemove = async (animeId: number) => {
        try {
            await api.delete(`/users/watchlist/${animeId}`)
            setCompleted(completed.filter(item => item.animeId !== animeId))
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
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    Completed Anime
                </h1>
                <p className="text-muted-foreground">
                    {completed.length} anime you&apos;ve finished watching
                </p>
            </div>

            <WatchlistGrid
                items={completed}
                onRemove={handleRemove}
                emptyIcon={CheckCircle}
                emptyTitle="No completed anime yet"
                emptyMessage="Finish watching some anime to see them here"
                statusLabel="Completed"
                statusBadgeColor="bg-green-500"
            />
        </div>
    )
}