'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Anime, Pagination as PaginationType } from '@/types/anime'
import { AnimeGrid } from '@/components/anime/AnimeGrid'
import { AnimeSearch } from '@/components/anime/AnimeSearch'
import { AnimeFilter, FilterState } from '@/components/anime/AnimeFilter'
import { Pagination } from '@/components/common/Pagination'
import { Loading } from '@/components/common/Loading'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { BrandTitle } from '@/components/common/BrandTitle'

function AnimeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [anime, setAnime] = useState<Anime[]>([])
  const [pagination, setPagination] = useState<PaginationType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const query = searchParams.get('query') || ''

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        setLoading(true)
        const params: any = {
          page: currentPage,
          limit: 24,
        }

        if (query) params.query = query

        // Add filter params
        const filterParams = [
          'type',
          'status',
          'rating',
          'order_by',
          'sort',
        ]
        filterParams.forEach((param) => {
          const value = searchParams.get(param)
          if (value) params[param] = value
        })

        const response = await api.get('/anime/search', { params })
        setAnime(response.data.data.data)
        setPagination(response.data.data.pagination)
        setError(null)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load anime')
      } finally {
        setLoading(false)
      }
    }

    fetchAnime()
  }, [searchParams, currentPage, query])

  const handleSearch = (searchQuery: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (searchQuery) {
      params.set('query', searchQuery)
    } else {
      params.delete('query')
    }
    params.set('page', '1')
    router.push(`/anime?${params.toString()}`)
  }

  const handleFilterChange = (filters: FilterState) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    params.set('page', '1')
    router.push(`/anime?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/anime?${params.toString()}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="container py-12 space-y-8">
      <div className="space-y-4">
        <BrandTitle>Browse Anime</BrandTitle>
        <p className="text-muted-foreground">
          Discover thousands of anime titles. Search, filter, and find your next favorite series.
        </p>
      </div>

      <div className="space-y-6">
        <AnimeSearch onSearch={handleSearch} />
        <AnimeFilter onFilterChange={handleFilterChange} />
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          <AnimeGrid anime={anime} />
          {pagination && pagination.last_visible_page > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.last_visible_page}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  )
}

export default function AnimePage() { return <Suspense fallback={<Loading />}><AnimeContent /></Suspense> }
