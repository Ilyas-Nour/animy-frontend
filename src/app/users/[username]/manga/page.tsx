'use client'

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { BookOpen, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import api from '@/lib/api'
import { MangaListGrid } from '@/components/dashboard/MangaListGrid'
import { Loading } from '@/components/common/Loading'

export default function UserMangaListPage() {
    const params = useParams()
    const username = params.username as string
    const [mangalist, setMangalist] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('ALL')

    useEffect(() => {
        const fetchMangalist = async () => {
            try {
                const res = await api.get(`/users/${username}/mangalist`)
                setMangalist(res.data.data || [])
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        if (username) fetchMangalist()
    }, [username])

    const filteredList = filter === 'ALL' 
        ? mangalist 
        : mangalist.filter(item => item.status === filter)

    if (loading) return <Loading />

    return (
        <div className="container py-24 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="space-y-4">
                    <Link href={`/users/${username}`}>
                        <Button variant="ghost" size="sm" className="gap-2 -ml-2">
                            <ArrowLeft className="h-4 w-4" /> Back to Profile
                        </Button>
                    </Link>
                    <h1 className="text-4xl font-black uppercase tracking-tight flex items-center gap-3">
                        <BookOpen className="h-10 w-10 text-orange-500" />
                        {username}&apos;s Manga Collection
                    </h1>
                </div>
            </div>

            <MangaListGrid 
                items={filteredList} 
                isOwner={false}
                emptyTitle="No Scrolls Found"
                emptyMessage="This user hasn't added any manga to their collection yet."
            />
        </div>
    )
}
