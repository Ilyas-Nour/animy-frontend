'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Film } from 'lucide-react'
import { Anime, Pagination as PaginationType } from '@/types/anime'
import { AnimeGrid } from '@/components/anime/AnimeGrid'
import { AnimeSearch } from '@/components/anime/AnimeSearch'
import { Pagination } from '@/components/common/Pagination'
import { Loading } from '@/components/common/Loading'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { BrandTitle } from '@/components/common/BrandTitle'

function MoviesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [movies, setMovies] = useState<Anime[]>([])
  const [pagination, setPagination] = useState<PaginationType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const query = searchParams.get('query') || ''

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true)

        let url: string
        if (query) {
          // Search with type=movie
          url = `/api/anime/search?page=${currentPage}&limit=24&type=movie&q=${encodeURIComponent(query)}`
        } else {
          // Movies endpoint
          url = `/api/anime/movies?page=${currentPage}&limit=24`
        }

        const response = await fetch(url)
        const json = await response.json()
        const data = Array.isArray(json.data) ? json.data : json.data?.data || []
        const pagination = json.pagination || json.data?.pagination || null

        setMovies(data)
        setPagination(pagination)
        setError(null)
      } catch (err: any) {
        console.error(err)
        setError('Failed to load movies')
      } finally {
        setLoading(false)
      }
    }

    fetchMovies()
  }, [currentPage, query])

  const handleSearch = (searchQuery: string) => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('query', searchQuery)
    params.set('page', '1')
    router.push(`/movies?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/movies?${params.toString()}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="container py-12 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Film className="h-10 w-10 text-primary" />
          <BrandTitle>Anime Movies</BrandTitle>
        </div>
        <p className="text-muted-foreground">
          Explore the best anime movies of all time. From classics to modern masterpieces.
        </p>
      </div>

      <AnimeSearch onSearch={handleSearch} placeholder="Search anime movies..." />

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          <AnimeGrid anime={movies} />
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
} export default function MoviesPage() { return <Suspense fallback={<Loading />}><MoviesContent /></Suspense> }
