'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Anime } from '@/types/anime'
import { Manga } from '@/types/manga'
import { AnimeGrid } from '@/components/anime/AnimeGrid'
import { MangaGrid } from '@/components/manga/MangaGrid'
import { Loading } from '@/components/common/Loading'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { StructuredData, generateOrganizationSchema, generateWebSiteSchema } from '@/components/seo/StructuredData'

// Modular Components
import { HeroSpotlight } from '@/components/home/HeroSpotlight'
import { CategorySwiper } from '@/components/home/CategorySwiper'
import { AnimeHomeSection } from '@/components/home/AnimeHomeSection'
import { MangaHomeSection } from '@/components/home/MangaHomeSection'
import { GuestHomeSection } from '@/components/home/GuestHomeSection'
import { UserHomeSection } from '@/components/home/UserHomeSection'

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const [hasMounted, setHasMounted] = useState(false)
  const [topAnime, setTopAnime] = useState<Anime[]>([])
  const [trendingHighlight, setTrendingHighlight] = useState<Anime[]>([])
  const [currentSeason, setCurrentSeason] = useState<Anime[]>([])
  const [heroAnime, setHeroAnime] = useState<Anime[]>([])
  const [topManga, setTopManga] = useState<Manga[]>([])
  const [publishingManga, setPublishingManga] = useState<Manga[]>([])
  const [activeCategory, setActiveCategory] = useState<'anime' | 'manga' | 'social'>('anime')

  // Fine-grained loading states
  const [heroLoading, setHeroLoading] = useState(true)
  const [topAnimeLoading, setTopAnimeLoading] = useState(true)
  const [seasonLoading, setSeasonLoading] = useState(true)
  const [topMangaLoading, setTopMangaLoading] = useState(true)
  const [pubMangaLoading, setPubMangaLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setHasMounted(true)

        // 1. Fetch Top Anime First (The Source of Truth for Deduplication)
        const fetchTopAnime = async () => {
          setHeroLoading(true)
          setTopAnimeLoading(true)
          const res = await fetch('/api/anime/top?filter=airing&limit=20')
          const json = await res.json()

          let data = []
          if (Array.isArray(json.data?.data)) data = json.data.data
          else if (Array.isArray(json.data)) data = json.data
          else if (Array.isArray(json)) data = json

          const top = data.slice(0, 10)
          const hero = data.slice(0, 5)
          const trending = data.slice(5, 15)

          setTopAnime(top)
          setHeroAnime(hero)
          setTrendingHighlight(trending)
          setHeroLoading(false)
          setTopAnimeLoading(false)

          return top // Return for sequencing
        }

        // 2. Fetch Seasonal (Sequenced)
        const fetchSeasonal = async (baseAnime: Anime[]) => {
          setSeasonLoading(true)
          const res = await fetch('/api/seasons/current?limit=30')
          const json = await res.json()

          let data = []
          if (Array.isArray(json.data?.data)) data = json.data.data
          else if (Array.isArray(json.data)) data = json.data
          else if (Array.isArray(json)) data = json

          const topIds = new Set(baseAnime.map(a => a.mal_id))
          const filtered = data.filter((a: Anime) => !topIds.has(a.mal_id))
          setCurrentSeason(filtered.slice(0, 10))
          setSeasonLoading(false)
        }

        // 3. Fetch Top Manga
        const fetchTopManga = async () => {
          setTopMangaLoading(true)
          const res = await fetch('/api/manga/search?order_by=popularity&sort=desc&limit=15')
          const json = await res.json()

          let data = []
          if (Array.isArray(json.data?.data)) data = json.data.data
          else if (Array.isArray(json.data)) data = json.data
          else if (Array.isArray(json)) data = json

          const top = data.slice(0, 10)
          setTopManga(top)
          setTopMangaLoading(false)
          return top
        }

        // 4. Fetch Publishing Manga (Sequenced)
        const fetchPubManga = async (baseManga: Manga[]) => {
          setPubMangaLoading(true)
          const res = await fetch('/api/manga/search?status=publishing&type=manga&order_by=popularity&sort=desc&limit=30')
          const json = await res.json()

          let data = []
          if (Array.isArray(json.data?.data)) data = json.data.data
          else if (Array.isArray(json.data)) data = json.data
          else if (Array.isArray(json)) data = json

          const topIds = new Set(baseManga.map(m => m.mal_id))
          const filtered = data.filter((m: Manga) => !topIds.has(m.mal_id))
          setPublishingManga(filtered.slice(0, 10))
          setPubMangaLoading(false)
        }

        // Run sequences
        const loadedTopAnime = await fetchTopAnime()
        await fetchSeasonal(loadedTopAnime)

        const loadedTopManga = await fetchTopManga()
        await fetchPubManga(loadedTopManga)

      } catch (err) {
        console.error('Home load error:', err)
        setError('Failed to load portal content. Please try again.')
      }
    }

    loadAllData()
  }, [])

  if (error) return <ErrorMessage message={error} />

  return (
    <div className="min-h-screen bg-background">
      {/* 1. Cinematic Hero Section */}
      {heroLoading ? (
        <div className="h-[600px] md:h-[85vh] w-full bg-muted/20 animate-pulse flex items-center justify-center">
          <div className="container space-y-8">
            <div className="w-1/4 h-10 bg-muted/40 rounded-lg" />
            <div className="w-2/3 h-24 bg-muted/40 rounded-lg" />
            <div className="w-1/2 h-8 bg-muted/40 rounded-lg" />
          </div>
        </div>
      ) : heroAnime.length > 0 ? (
        <HeroSpotlight anime={heroAnime} />
      ) : null}

      {/* 2. Mobile Category Swiper - Sticky */}
      <CategorySwiper onCategoryChange={setActiveCategory} />

      {/* 3. High-Impact Interaction Area (Guest vs User) */}
      {!hasMounted ? (
        <div className="container py-12 md:py-24 h-[400px] animate-pulse bg-muted/10 rounded-[3rem] mx-auto opacity-20" />
      ) : isAuthenticated ? (
        <UserHomeSection trending={trendingHighlight} />
      ) : (
        <GuestHomeSection />
      )}

      <div className="container py-12 space-y-24">

        {/* 4. DESKTOP LAYOUT (Vertical Stack) */}
        <div className="hidden md:block space-y-24">
          <AnimeHomeSection
            topAnime={topAnime}
            currentSeason={currentSeason}
            topLoading={topAnimeLoading}
            seasonLoading={seasonLoading}
          />
          <MangaHomeSection
            topManga={topManga}
            publishingManga={publishingManga}
            topLoading={topMangaLoading}
            pubLoading={pubMangaLoading}
          />
        </div>

        {/* 4. MOBILE LAYOUT (Swiper Tabs) */}
        <div className="md:hidden">
          <AnimatePresence mode="wait">
            {activeCategory === 'anime' && (
              <motion.div
                key="anime-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AnimeHomeSection
                  topAnime={topAnime}
                  currentSeason={currentSeason}
                  topLoading={topAnimeLoading}
                  seasonLoading={seasonLoading}
                />
              </motion.div>
            )}

            {activeCategory === 'manga' && (
              <motion.div
                key="manga-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <MangaHomeSection
                  topManga={topManga}
                  publishingManga={publishingManga}
                  topLoading={topMangaLoading}
                  pubLoading={pubMangaLoading}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}