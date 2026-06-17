'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Calendar, Snowflake, Flower, Sun, Leaf } from 'lucide-react'
import { Anime, Pagination as PaginationType } from '@/types/anime'
import { AnimeGrid } from '@/components/anime/AnimeGrid'
import { Pagination } from '@/components/common/Pagination'
import { Loading } from '@/components/common/Loading'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BrandTitle } from '@/components/common/BrandTitle'

const seasonIcons = {
  winter: Snowflake,
  spring: Flower,
  summer: Sun,
  fall: Leaf,
}

const seasonColors = {
  winter: 'from-blue-400 to-cyan-400',
  spring: 'from-pink-400 to-rose-400',
  summer: 'from-yellow-400 to-orange-400',
  fall: 'from-orange-400 to-red-400',
}

const getCurrentYear = () => new Date().getFullYear()
const generateYears = () => {
  const currentYear = getCurrentYear()
  const years = []
  for (let year = currentYear; year >= 2000; year--) {
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
        setSeasonInfo({
          season: selectedSeason,
          year: selectedYear,
        })
      } catch (err: any) {
        console.error('Error fetching season anime:', err)
        setError('Failed to load season anime')
      } finally {
        setLoading(false)
      }
    }

    fetchSeasonAnime()
  }, [selectedYear, selectedSeason, currentPage])

  const handleSeasonChange = (season: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('season', season)
    params.set('page', '1')
    router.push(`/seasons?${params.toString()}`)
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('year', e.target.value)
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

  const quickLinks = [
    { season: 'winter', year: getCurrentYear(), label: `Winter ${getCurrentYear()}` },
    { season: 'spring', year: getCurrentYear(), label: `Spring ${getCurrentYear()}` },
    { season: 'summer', year: getCurrentYear(), label: `Summer ${getCurrentYear()}` },
    { season: 'fall', year: getCurrentYear(), label: `Fall ${getCurrentYear()}` },
  ]

  return (
    <div className="container py-12 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <BrandTitle icon={<Calendar className="h-10 w-10 text-primary" />}>
            Seasonal Anime
          </BrandTitle>
          <p className="text-muted-foreground mt-2">Browse anime by season and year</p>
        </motion.div>

        {/* Quick Links */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Access - {getCurrentYear()}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickLinks.map((link) => {
                const Icon = seasonIcons[link.season as keyof typeof seasonIcons]
                const isActive = selectedSeason === link.season && selectedYear === link.year
                return (
                  <Link key={`${link.season}-${link.year}`} href={`/seasons?year=${link.year}&season=${link.season}`}>
                    <Button
                      variant={isActive ? 'default' : 'outline'}
                      className={`w-full gap-2 ${isActive ? `bg-gradient-to-r ${seasonColors[link.season as keyof typeof seasonColors]} text-white` : ''}`}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
        <h3 className="text-lg font-semibold">Select Season & Year</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
            {seasons.map((season) => {
              const Icon = season.icon
              const isActive = selectedSeason === season.value
              return (
                <Button
                  key={season.value}
                  variant={isActive ? 'default' : 'outline'}
                  onClick={() => handleSeasonChange(season.value)}
                  className={`gap-2 ${isActive ? `bg-gradient-to-r ${seasonColors[season.value as keyof typeof seasonColors]} text-white` : ''}`}
                >
                  <Icon className="h-4 w-4" />
                  {season.label}
                </Button>
              )
            })}
          </div>
          <select value={selectedYear} onChange={handleYearChange} className="px-4 py-2 rounded-md border bg-background min-w-[150px]">
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Season Info */}
      {seasonInfo && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold capitalize">{seasonInfo.season} {seasonInfo.year}</h2>
              <p className="text-muted-foreground mt-1">{pagination ? `${pagination.items?.total || anime.length} anime found` : 'Loading...'}</p>
            </div>
            <div className={`h-16 w-16 rounded-full bg-gradient-to-r ${seasonColors[seasonInfo.season as keyof typeof seasonColors]} flex items-center justify-center`}>
              {(() => {
                const Icon = seasonIcons[seasonInfo.season as keyof typeof seasonIcons]
                return <Icon className="h-8 w-8 text-white" />
              })()}
            </div>
          </div>
        </motion.div>
      )}

      {/* Anime Grid */}
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : anime.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No anime found</h3>
          <p className="text-muted-foreground">No anime available for {selectedSeason} {selectedYear}</p>
        </Card>
      ) : (
        <>
          <AnimeGrid anime={anime} />
          {pagination && pagination.last_visible_page > 1 && (
            <Pagination currentPage={currentPage} totalPages={pagination.last_visible_page} onPageChange={handlePageChange} />
          )}
        </>
      )}
    </div>
  )
}

export default function SeasonsPage() { return <Suspense fallback={<Loading />}><SeasonsContent /></Suspense> }
