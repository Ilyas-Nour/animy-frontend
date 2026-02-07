'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import api from '@/lib/api'
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
    // 1. Fetch Top Anime (Hero + Top Section)
    const fetchTopAnime = async () => {
      try {
        setHeroLoading(true)
        setTopAnimeLoading(true)
        const res = await api.get('/anime/top', { params: { filter: 'airing' } })
        const data = res.data?.data?.data || []
        setTopAnime(data.slice(0, 10))
        setHeroAnime(data.slice(0, 5))
        setTrendingHighlight(data.slice(5, 15))
      } catch (err) {
        console.error('Top Anime fetch error:', err)
      } finally {
        setHeroLoading(false)
        setTopAnimeLoading(false)
      }
    }

    // 2. Fetch Current Season (Seasonal Section)
    const fetchSeasonal = async () => {
      try {
        setSeasonLoading(true)
        const res = await api.get('/seasons/current')
        const data = res.data?.data?.data || []
        setCurrentSeason(data.slice(0, 10))
      } catch (err) {
        console.error('Seasonal fetch error:', err)
      } finally {
        setSeasonLoading(false)
      }
    }

    // 3. Fetch Top Manga
    const fetchTopManga = async () => {
      try {
        setTopMangaLoading(true)
        const res = await api.get('/manga/search', { params: { order_by: 'popularity', sort: 'desc', limit: 10 } })
        const data = res.data?.data?.data || []
        setTopManga(data.slice(0, 10))
      } catch (err) {
        console.error('Top Manga fetch error:', err)
      } finally {
        setTopMangaLoading(false)
      }
    }

    // 4. Fetch Publishing Manga
    const fetchPubManga = async () => {
      try {
        setPubMangaLoading(true)
        const res = await api.get('/manga/search', { params: { status: 'publishing', type: 'manga', order_by: 'popularity', sort: 'desc', limit: 10 } })
        const data = res.data?.data?.data || []
        setPublishingManga(data.slice(0, 10))
      } catch (err) {
        console.error('Publishing Manga fetch error:', err)
      } finally {
        setPubMangaLoading(false)
      }
    }

    // Execute all independently
    fetchTopAnime()
    fetchSeasonal()
    fetchTopManga()
    fetchPubManga()
    setHasMounted(true)
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