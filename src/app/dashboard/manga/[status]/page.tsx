export const runtime = 'edge';
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, ArrowLeft, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/common/Loading'
import { MangaListGrid } from '@/components/dashboard/MangaListGrid'
import api from '@/lib/api'

const statusMap: Record<string, string> = {
    'reading': 'READING',
    'completed': 'COMPLETED',
    'on-hold': 'ON_HOLD',
    'dropped': 'DROPPED',
    'plan-to-read': 'PLAN_TO_READ',
}

const labelMap: Record<string, string> = {
    'reading': 'Currently Reading',
    'completed': 'Completed Manga',
    'on-hold': 'On Hold',
    'dropped': 'Dropped',
    'plan-to-read': 'Plan to Read',
}

const colorMap: Record<string, string> = {
    'reading': 'bg-purple-500',
    'completed': 'bg-emerald-500',
    'on-hold': 'bg-orange-500',
    'dropped': 'bg-rose-500',
    'plan-to-read': 'bg-indigo-500',
}

export default function MangaListPage() {
    const router = useRouter()
    const params = useParams()
    const status = params.status as string
    const { isAuthenticated, isLoading } = useAuth()
    const [manga, setManga] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth/login')
        }
    }, [isAuthenticated, isLoading, router])

    useEffect(() => {
        const fetchManga = async () => {
            try {
                const response = await api.get('/users/mangalist')
                const backendStatus = statusMap[status] || 'READING'
                const filtered = response.data.data.filter((item: any) => item.status === backendStatus)
                setManga(filtered)
            } catch (error) {
                console.error('Failed to fetch manga list:', error)
            } finally {
                setLoading(false)
            }
        }

        if (isAuthenticated && status) {
            fetchManga()
        }
    }, [isAuthenticated, status])

    const handleRemove = async (mangaId: number) => {
        try {
            await api.delete(`/users/mangalist/${mangaId}`)
            setManga(manga.filter(item => item.mangaId !== mangaId))
        } catch (error) {
            console.error('Failed to remove from manga list:', error)
        }
    }

    if (isLoading || loading) return <Loading />

    return (
        <div className="container py-12 space-y-8">
            <div className="space-y-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="gap-2 text-white hover:bg-white/5">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </Link>
                <h1 className="text-4xl font-bold flex items-center gap-3 text-white">
                    <BookOpen className={`h-8 w-8 ${colorMap[status] || 'text-purple-500'}`} />
                    {labelMap[status] || 'Manga List'}
                </h1>
                <p className="text-muted-foreground">
                    {manga.length} manga in this list
                </p>
            </div>

            <MangaListGrid
                items={manga}
                onRemove={handleRemove}
                emptyIcon={BookOpen}
                emptyTitle="No manga here"
                emptyMessage="Start reading some manga to track your progress"
                statusLabel={labelMap[status]}
                statusBadgeColor={colorMap[status]}
            />
        </div>
    )
}
