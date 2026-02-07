'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Tv } from 'lucide-react'
import api from '@/lib/api'
import { Anime, Pagination as PaginationType } from '@/types/anime'
import { AnimeGrid } from '@/components/anime/AnimeGrid'
import { AnimeSearch } from '@/components/anime/AnimeSearch'
import { Pagination } from '@/components/common/Pagination'
import { Loading } from '@/components/common/Loading'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { BrandTitle } from '@/components/common/BrandTitle'

function SeriesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [series, setSeries] = useState<Anime[]>([])
  const [pagination, setPagination] = useState<PaginationType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const query = searchParams.get('query') || ''

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setLoading(true)
        const params: any = {
          page: currentPage,
        }

        if (query) {
          params.query = query
          params.type = 'tv'
          const response = await api.get('/anime/search', { params })
          setSeries(response.data.data.data)
          setPagination(response.data.data.pagination)
        } else {
          const response = await api.get('/anime/series', { params })
          setSeries(response.data.data.data)
          setPagination(response.data.data.pagination)
        }
        setError(null)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load series')
      } finally {
        setLoading(false)
      }
    }

    fetchSeries()
  }, [currentPage, query])

  const handleSearch = (searchQuery: string) => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('query', searchQuery)
    params.set('page', '1')
    router.push(`/series?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/series?${params.toString()}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="container py-12 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Tv className="h-10 w-10 text-primary" />
          <BrandTitle>Anime Series</BrandTitle>
        </div>
        <p className="text-muted-foreground">
          Browse the best TV anime series. From long-running classics to seasonal favorites.
        </p>
      </div>

      <AnimeSearch onSearch={handleSearch} placeholder="Search anime series..." />

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          <AnimeGrid anime={series} />
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
} export default function SeriesPage() { return <Suspense fallback={<Loading />}><SeriesContent /></Suspense> }
