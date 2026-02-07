'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { List, Trash2, ArrowLeft, Edit } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Loading } from '@/components/common/Loading'
import api from '@/lib/api'

interface WatchlistItem {
  id: string
  animeId: number
  animeTitle: string
  animeImage?: string
  status: string
  addedAt: string
  updatedAt: string
}

const statusOptions = [
  { value: 'WATCHING', label: 'Watching', color: 'bg-blue-500' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-green-500' },
  { value: 'ON_HOLD', label: 'On Hold', color: 'bg-orange-500' },
  { value: 'DROPPED', label: 'Dropped', color: 'bg-red-500' },
  { value: 'PLAN_TO_WATCH', label: 'Plan to Watch', color: 'bg-yellow-500' },
]

export default function WatchlistPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const response = await api.get('/users/watchlist')
        setWatchlist(response.data.data)
      } catch (error) {
        console.error('Failed to fetch watchlist:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchWatchlist()
    }
  }, [isAuthenticated])

  const handleStatusChange = async (animeId: number, newStatus: string) => {
    try {
      await api.patch(`/users/watchlist/${animeId}`, { status: newStatus })
      setWatchlist(watchlist.map(item =>
        item.animeId === animeId ? { ...item, status: newStatus } : item
      ))
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleRemove = async (animeId: number) => {
    try {
      await api.delete(`/users/watchlist/${animeId}`)
      setWatchlist(watchlist.filter(item => item.animeId !== animeId))
    } catch (error) {
      console.error('Failed to remove from watchlist:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status)
    return option || { label: status, color: 'bg-gray-500' }
  }

  const filteredWatchlist = filter === 'ALL'
    ? watchlist
    : watchlist.filter(item => item.status === filter)

  if (isLoading || loading) return <Loading />

  return (
    <div className="container py-12 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <List className="h-8 w-8 text-primary" />
              My Watchlist
            </h1>
            <p className="text-muted-foreground mt-2">
              {filteredWatchlist.length} of {watchlist.length} anime
            </p>
          </div>

          {/* Filter */}
          <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="ALL">All Status</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Watchlist Grid */}
      {filteredWatchlist.length === 0 ? (
        <Card className="p-12 text-center">
          <List className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {filter === 'ALL' ? 'No anime in watchlist' : `No ${getStatusBadge(filter).label} anime`}
          </h3>
          <p className="text-muted-foreground mb-6">
            Start adding anime to track your progress
          </p>
          <Link href="/anime">
            <Button>Browse Anime</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredWatchlist.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="group overflow-hidden hover:shadow-lg transition-all relative">
                <Link href={`/anime/${item.animeId}`} className="absolute inset-0 z-10">
                  <span className="sr-only">View {item.animeTitle}</span>
                </Link>
                <div className="relative aspect-[2/3]">
                  {item.animeImage ? (
                    <Image
                      src={item.animeImage}
                      alt={item.animeTitle}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <List className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2 z-20">
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8 rounded-full"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleRemove(item.animeId)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute top-2 left-2 pointer-events-none z-20">
                    <Badge className={`${getStatusBadge(item.status).color} text-white`}>
                      {getStatusBadge(item.status).label}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-3 space-y-2 relative z-20 pointer-events-none">
                  <h3 className="text-sm font-semibold line-clamp-2 hover:text-primary transition-colors cursor-pointer leading-tight pointer-events-auto">
                    {item.animeTitle}
                  </h3>

                  <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.animeId, e.target.value)}
                      className="text-xs h-8"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <p className="text-[10px] text-muted-foreground">
                    Updated {new Date(item.updatedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}