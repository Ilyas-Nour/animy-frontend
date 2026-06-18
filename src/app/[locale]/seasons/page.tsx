'use client'
export const runtime = 'edge';
import { Suspense, useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Calendar, Snowflake, Flower, Sun, Leaf, ChevronLeft, ChevronRight } from 'lucide-react'
import { Anime, Pagination as PaginationType } from '@/types/anime'
import { AnimeGrid } from '@/components/anime/AnimeGrid'
import { Pagination } from '@/components/common/Pagination'
import { Loading } from '@/components/common/Loading'
import { ErrorMessage } from '@/components/common/ErrorMessage'

const seasonIcons = {
  winter: Snowflake,
  spring: Flower,
  summer: Sun,
  fall: Leaf,
}

const seasonColors = {
  winter: 'from-sky-500 to-blue-600 shadow-[0_0_20px_rgba(14,165,233,0.3)]',
  spring: 'from-pink-400 to-rose-500 shadow-[0_0_20px_rgba(244,114,182,0.3)]',
  summer: 'from-amber-400 to-orange-500 shadow-[0_0_20px_rgba(251,191,36,0.3)]',
  fall: 'from-orange-500 to-red-600 shadow-[0_0_20px_rgba(249,115,22,0.3)]',
}

const bgColors = {
  winter: 'from-sky-950/40 via-blue-900/10 to-transparent',
  spring: 'from-pink-950/40 via-rose-900/10 to-transparent',
  summer: 'from-amber-950/40 via-orange-900/10 to-transparent',
  fall: 'from-orange-950/40 via-red-900/10 to-transparent',
}

const getCurrentYear = () => new Date().getFullYear()
const generateYears = () => {
  const currentYear = getCurrentYear()
  const years = []
  for (let year = currentYear + 1; year >= 1990; year--) {
    years.push(year)
  }
  return years
}

function SeasonsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [anime, setAnime] = useState<Anime[]>([])
  const [pagination, setPagination] = useState<PaginationType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seasonInfo, setSeasonInfo] = useState<{ season: string; year: number } | null>(null)
  
  const yearsContainerRef = useRef<HTMLDivElement>(null)

  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const selectedYear = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : getCurrentYear()
  const selectedSeason = searchParams.get('season') || getCurrentSeason()

  function getCurrentSeason(): string {
    const month = new Date().getMonth() + 1
    if (month >= 1 && month <= 3) return 'winter'
    if (month >= 4 && month <= 6) return 'spring'
    if (month >= 7 && month <= 9) return 'summer'
    return 'fall'
  }

  useEffect(() => {
    const fetchSeasonAnime = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/seasons/${selectedYear}/${selectedSeason}?page=${currentPage}&limit=24`)
        const json = await response.json()
        const data = Array.isArray(json.data) ? json.data : json.data?.data || []
        const pagination = json.pagination || json.data?.pagination || null
        setAnime(data)
        setPagination(pagination)
        setSeasonInfo({ season: selectedSeason, year: selectedYear })
      } catch (err: any) {
        console.error('Error fetching season anime:', err)
        setError('Failed to load season anime')
      } finally {
        setLoading(false)
      }
    }
    fetchSeasonAnime()
  }, [selectedYear, selectedSeason, currentPage])

  // Center the active year on mount
  useEffect(() => {
    if (yearsContainerRef.current) {
      const activeElement = yearsContainerRef.current.querySelector('[data-active="true"]') as HTMLElement
      if (activeElement) {
        const container = yearsContainerRef.current
        container.scrollTo({
          left: activeElement.offsetLeft - container.offsetWidth / 2 + activeElement.offsetWidth / 2,
          behavior: 'smooth'
        })
      }
    }
  }, [selectedYear])

  const handleSeasonChange = (season: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('season', season)
    params.set('page', '1')
    router.push(`/seasons?${params.toString()}`)
  }

  const handleYearChange = (year: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('year', year.toString())
    params.set('page', '1')
    router.push(`/seasons?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/seasons?${params.toString()}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const years = generateYears()
  const seasons = [
    { value: 'winter', label: 'Winter', icon: Snowflake },
    { value: 'spring', label: 'Spring', icon: Flower },
    { value: 'summer', label: 'Summer', icon: Sun },
    { value: 'fall', label: 'Fall', icon: Leaf },
  ]

  const totalResults = pagination?.items?.total ?? anime.length
  const currentBg = bgColors[selectedSeason as keyof typeof bgColors] || bgColors.winter

  return (
    <div className="min-h-screen">
      {/* Dynamic Background Banner */}
      <div className={`relative overflow-hidden border-b border-white/5 mb-8 bg-gradient-to-br ${currentBg} transition-colors duration-1000`}>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 60%)'
        }} />
        
        <div className="relative container px-4 sm:px-6 py-10 sm:py-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center max-w-3xl mx-auto"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 mb-6 shadow-xl">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-4">
              Anime Seasons
            </h1>
            <p className="text-white/60 text-base">
              Travel through time to discover anime by release season.
            </p>
          </motion.div>

          {/* Season Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10 max-w-4xl mx-auto"
          >
            {seasons.map((season) => {
              const Icon = season.icon
              const isActive = selectedSeason === season.value
              const colorClass = seasonColors[season.value as keyof typeof seasonColors]
              
              return (
                <button
                  key={season.value}
                  onClick={() => handleSeasonChange(season.value)}
                  className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center gap-3 transition-all duration-300 border ${
                    isActive 
                      ? `bg-gradient-to-br ${colorClass} border-transparent text-white scale-105 z-10` 
                      : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/90 hover:border-white/20'
                  }`}
                >
                  <Icon className={`w-8 h-8 ${isActive ? 'text-white' : 'opacity-70'}`} />
                  <span className="font-bold tracking-wide">{season.label}</span>
                </button>
              )
            })}
          </motion.div>
        </div>
      </div>

      <div className="container px-4 sm:px-6 space-y-8 pb-16">
        {/* Year Pill Strip */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative max-w-4xl mx-auto"
        >
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          
          <div 
            ref={yearsContainerRef}
            className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2 px-6 mask-fade-edges"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {years.map((year) => {
              const isActive = selectedYear === year
              return (
                <button
                  key={year}
                  data-active={isActive}
                  onClick={() => handleYearChange(year)}
                  className={`flex-none px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                    isActive
                      ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-110 mx-2'
                      : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/80 border border-white/5'
                  }`}
                >
                  {year}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Season Info Banner */}
        {seasonInfo && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10"
          >
            <div>
              <h2 className="text-2xl font-black capitalize tracking-tight flex items-center gap-3">
                {seasonInfo.season} {seasonInfo.year}
                <span className="text-sm font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/70">
                  {loading ? '...' : totalResults} shows
                </span>
              </h2>
            </div>
            {(() => {
              const Icon = seasonIcons[seasonInfo.season as keyof typeof seasonIcons]
              return (
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${seasonColors[seasonInfo.season as keyof typeof seasonColors]} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              )
            })()}
          </motion.div>
        )}

        {/* Content */}
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : anime.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Calendar className="w-9 h-9 text-white/20" />
            </div>
            <div className="text-center">
              <p className="text-white/50 font-semibold text-base">No anime found</p>
              <p className="text-white/25 text-sm mt-1">No anime available for {selectedSeason} {selectedYear}</p>
            </div>
          </div>
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
      
      {/* Hide scrollbar styles */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

export default function SeasonsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SeasonsContent />
    </Suspense>
  )
}
