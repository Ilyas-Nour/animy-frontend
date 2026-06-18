'use client'
export const runtime = 'edge';
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Tv, Search, X } from 'lucide-react'
import { Anime, Pagination as PaginationType } from '@/types/anime'
import { AnimeGrid } from '@/components/anime/AnimeGrid'
import { Pagination } from '@/components/common/Pagination'
import { Loading } from '@/components/common/Loading'
import { ErrorMessage } from '@/components/common/ErrorMessage'

function SeriesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [series, setSeries] = useState<Anime[]>([])
  const [pagination, setPagination] = useState<PaginationType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')

  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const query = searchParams.get('query') || ''

  useEffect(() => {
    setSearchInput(query)
  }, [query])

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setLoading(true)
        let url: string
        if (query) {
          url = `/api/anime/search?page=${currentPage}&limit=24&type=tv&q=${encodeURIComponent(query)}`
        } else {
          url = `/api/anime/series?page=${currentPage}&limit=24`
        }

        const response = await fetch(url)
        const json = await response.json()
        const data = Array.isArray(json.data) ? json.data : json.data?.data || []
        const pagination = json.pagination || json.data?.pagination || null

        setSeries(data)
        setPagination(pagination)
        setError(null)
      } catch (err: any) {
        console.error(err)
        setError('Failed to load series')
      } finally {
        setLoading(false)
      }
    }

    fetchSeries()
  }, [currentPage, query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchInput.trim()) params.set('query', searchInput.trim())
    params.set('page', '1')
    router.push(`/series?${params.toString()}`)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    const params = new URLSearchParams()
    params.set('page', '1')
    router.push(`/series?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/series?${params.toString()}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalResults = pagination?.items?.total ?? series.length

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="relative overflow-hidden border-b border-white/5 mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/60 via-blue-900/30 to-transparent" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.1) 0%, transparent 50%)'
        }} />
        <div className="absolute top-4 right-24 w-32 h-32 rounded-full bg-indigo-600/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-2 left-1/3 w-24 h-24 rounded-full bg-blue-600/10 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative container px-4 sm:px-6 py-10 sm:py-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                <Tv className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">TV Shows</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
              Anime{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Series
              </span>
            </h1>
            <p className="text-white/50 text-sm">
              Browse the best TV anime series. From long-running classics to seasonal favorites.
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
              <Search className="absolute left-4 w-4 h-4 text-white/30 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search anime series..."
                className="w-full bg-white/8 backdrop-blur-sm border border-white/12 rounded-xl pl-11 pr-28 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-200"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-20 text-white/30 hover:text-white/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-bold hover:from-indigo-500 hover:to-blue-500 transition-all duration-200 shadow-[0_0_12px_rgba(99,102,241,0.3)]"
              >
                Search
              </button>
            </div>
          </motion.form>
        </div>
      </div>

      <div className="container px-4 sm:px-6 space-y-6 pb-16">
        {/* Result Count */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2"
          >
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-xs font-semibold text-white/25 uppercase tracking-wider">
              {totalResults > 0 ? `${series.length} results${totalResults > series.length ? ` of ${totalResults.toLocaleString()}` : ''}` : 'No results'}
            </span>
            <div className="h-px flex-1 bg-white/5" />
          </motion.div>
        )}

        {/* Content */}
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
    </div>
  )
}

export default function SeriesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SeriesContent />
    </Suspense>
  )
}
