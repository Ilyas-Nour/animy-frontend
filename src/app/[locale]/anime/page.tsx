'use client'
export const runtime = 'edge';
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, Search, X } from 'lucide-react'
import { Anime, Pagination as PaginationType } from '@/types/anime'
import { AnimeGrid } from '@/components/anime/AnimeGrid'
import { AnimeFilter, FilterState } from '@/components/anime/AnimeFilter'
import { Pagination } from '@/components/common/Pagination'
import { Loading } from '@/components/common/Loading'
import { ErrorMessage } from '@/components/common/ErrorMessage'

function AnimeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [anime, setAnime] = useState<Anime[]>([])
  const [pagination, setPagination] = useState<PaginationType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')

  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const query = searchParams.get('query') || ''

  // Sync search input with URL
  useEffect(() => {
    setSearchInput(query)
  }, [query])

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        params.set('page', currentPage.toString())
        params.set('limit', '24')
        if (query) params.set('q', query)
        const filterParams = ['type', 'status', 'rating', 'order_by', 'sort']
        filterParams.forEach((param) => {
          const value = searchParams.get(param)
          if (value) params.set(param, value)
        })
        if (!params.has('order_by') && !params.has('q')) {
          params.set('order_by', 'score')
          params.set('sort', 'desc')
        }
        const response = await fetch(`/api/anime/search?${params.toString()}`)
        const json = await response.json()
        const data = Array.isArray(json.data) ? json.data : json.data?.data || []
        const pagination = json.pagination || json.data?.pagination || null
        setAnime(data)
        setPagination(pagination)
        setError(null)
      } catch (err: any) {
        console.error(err)
        setError('Failed to load anime')
      } finally {
        setLoading(false)
      }
    }
    fetchAnime()
  }, [searchParams, currentPage, query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchInput.trim()) {
      params.set('query', searchInput.trim())
    } else {
      params.delete('query')
    }
    params.set('page', '1')
    router.push(`/anime?${params.toString()}`)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('query')
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

  const totalResults = pagination?.items?.total ?? anime.length

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="relative overflow-hidden border-b border-border mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/60 via-purple-900/30 to-transparent" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(139,92,246,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.1) 0%, transparent 50%)'
        }} />
        {/* Animated orbs */}
        <div className="absolute top-4 right-24 w-32 h-32 rounded-full bg-purple-600/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-2 left-1/3 w-24 h-24 rounded-full bg-blue-600/10 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative container px-4 sm:px-6 py-10 sm:py-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)]">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">Discover</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-2">
              Browse{' '}
              <span className="bg-gradient-to-r from-purple-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
                Anime
              </span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Discover thousands of anime titles. Search, filter, and find your next favorite.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mt-6 max-w-xl"
          >
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search anime titles..."
                className="w-full bg-card border border-input rounded-xl pl-11 pr-28 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all duration-200"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-20 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 text-white text-xs font-bold hover:from-purple-500 hover:to-violet-500 transition-all duration-200 shadow-[0_0_12px_rgba(139,92,246,0.3)]"
              >
                Search
              </button>
            </div>
          </motion.form>
        </div>
      </div>

      <div className="container px-4 sm:px-6 space-y-6 pb-16">
        {/* Filter Row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <AnimeFilter onFilterChange={handleFilterChange} />
        </motion.div>

        {/* Result Count */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2"
          >
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {totalResults > 0 ? `${anime.length} results${totalResults > anime.length ? ` of ${totalResults.toLocaleString()}` : ''}` : 'No results'}
            </span>
            <div className="h-px flex-1 bg-border" />
          </motion.div>
        )}

        {/* Content */}
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
    </div>
  )
}

export default function AnimePage() {
  return (
    <Suspense fallback={<Loading />}>
      <AnimeContent />
    </Suspense>
  )
}
