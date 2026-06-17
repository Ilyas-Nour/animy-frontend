'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Trash2, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/common/Loading'
import { WatchlistGrid } from '@/components/dashboard/WatchlistGrid'
import api from '@/lib/api'

interface Favorite {
  id: string
  animeId: number
  animeTitle: string
  animeImage?: string
  addedAt: string
}

export default function FavoritesPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await api.get('/users/favorites')
        setFavorites(response.data.data)
      } catch (error) {
        console.error('Failed to fetch favorites:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchFavorites()
    }
  }, [isAuthenticated])

  const handleRemove = async (animeId: number) => {
    try {
      await api.delete(`/users/favorites/${animeId}`)
      setFavorites(favorites.filter(f => f.animeId !== animeId))
    } catch (error) {
      console.error('Failed to remove favorite:', error)
    }
  }

  if (isLoading || loading) return <Loading />

  return (
    <div className="container py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Heart className="h-8 w-8 text-pink-500 fill-pink-500" />
            My Favorites
          </h1>
          <p className="text-muted-foreground">
            {favorites.length} anime in your favorites
          </p>
        </div>
      </div>

      <WatchlistGrid
        // @ts-ignore
        items={favorites}
        onRemove={handleRemove}
        emptyIcon={Heart}
        emptyTitle="No favorites yet"
        emptyMessage="Start adding anime to your favorites to see them here"
        statusLabel="Favorite"
        statusBadgeColor="bg-pink-500"
      />
    </div>
  )
}