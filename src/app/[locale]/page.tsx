'use client'
export const runtime = 'edge';
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Anime } from '@/types/anime'
import { Manga } from '@/types/manga'
import { AnimeGrid } from '@/components/anime/AnimeGrid'
import { MangaGrid } from '@/components/manga/MangaGrid'
import { Loading } from '@/components/common/Loading'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { StructuredData, generateOrganizationSchema, generateWebSiteSchema } from '@/components/seo/StructuredData'
import { AdBanner } from '@/components/ads/AdBanner'

// Modular Components
import { HeroSpotlight } from '@/components/home/HeroSpotlight'
import { CategorySwiper } from '@/components/home/CategorySwiper'
import { AnimeHomeSection } from '@/components/home/AnimeHomeSection'
import { MangaHomeSection } from '@/components/home/MangaHomeSection'
import { GuestHomeSection } from '@/components/home/GuestHomeSection'
import { UserHomeSection } from '@/components/home/UserHomeSection'

// Global cache to persist home data across client-side navigations
let globalHomeCache: any = null;

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, login } = useAuth()
  const [hasMounted, setHasMounted] = useState(false)
  const [topAnime, setTopAnime] = useState<Anime[]>(globalHomeCache?.popularAnime || [])
  const [trendingHighlight, setTrendingHighlight] = useState<Anime[]>(globalHomeCache?.trendingAnime || [])
  const [upcomingAnime, setUpcomingAnime] = useState<Anime[]>(globalHomeCache?.upcomingAnime || [])
  const [recentEpisodes, setRecentEpisodes] = useState<Anime[]>(globalHomeCache?.recentEpisodes || [])
  const [heroAnime, setHeroAnime] = useState<Anime[]>(globalHomeCache?.popularAnime?.slice(0, 5) || [])
  const [topManga, setTopManga] = useState<Manga[]>(globalHomeCache?.topManga || [])
  const [publishingManga, setPublishingManga] = useState<Manga[]>(globalHomeCache?.publishingManga || [])
  const [activeCategory, setActiveCategory] = useState<'anime' | 'manga' | 'social'>('anime')

  // Fine-grained loading states
  const [heroLoading, setHeroLoading] = useState(!globalHomeCache)
  const [topAnimeLoading, setTopAnimeLoading] = useState(!globalHomeCache)
  const [upcomingLoading, setUpcomingLoading] = useState(!globalHomeCache)
  const [recentLoading, setRecentLoading] = useState(!globalHomeCache)
  const [topMangaLoading, setTopMangaLoading] = useState(!globalHomeCache)
  const [pubMangaLoading, setPubMangaLoading] = useState(!globalHomeCache)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setHasMounted(true)

    // Handle Google OAuth callback token
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');
    if (token) {
      // Clean up URL without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Save token and fetch profile smoothly
      localStorage.setItem('token', token);
      import('@/lib/auth').then(({ authService }) => {
        authService.getProfile().then(user => {
          login(token, user);
          
          // If first time login, redirect to discovery
          if (!user.interests || user.interests.length === 0) {
            router.push('/discovery');
          }
        }).catch(err => {
          console.error("Failed to fetch profile after Google Login:", err);
          window.location.reload(); // Fallback
        });
      });
      return;
    }
    
    let isMounted = true;
    
    const loadAllData = async () => {
      try {
        // Use the new unified home endpoint for instant, single-request loading
        // Added v=2 to bypass old Cloudflare Edge cache
        const res = await fetch('/api/proxy?url=/home&v=2')
        if (!res.ok) throw new Error('Failed to fetch home data')
        
        const json = await res.json()
        const data = json.data || json;

        if (data && isMounted) {
          // Update global cache
          globalHomeCache = data;

          // Update local state
          setTopAnime(data.popularAnime || [])
          
          // Fetch "All Time Popular" for the hero section because they are guaranteed to have 
          // gorgeous high-res fanart and clearlogos in the TVDB/TMDB databases.
          fetch('https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=25')
            .then(r => r.json())
            .then(topData => {
              if (topData?.data && isMounted) {
                // Deduplicate franchises (e.g. Attack on Titan Season 1, 2, 3)
                const uniqueAnime: Anime[] = [];
                for (const anime of topData.data) {
                  const title = (anime.title_english || anime.title || '').toLowerCase();
                  // Check if this title is a sequel or part of an already added franchise
                  const isDuplicate = uniqueAnime.some(existing => {
                    const existingTitle = (existing.title_english || existing.title || '').toLowerCase();
                    // If one title is a prefix of another (up to a colon or " Season"), consider it the same franchise
                    const baseExisting = existingTitle.split(/[:\s-]*season|[:\s-]*part|:/i)[0].trim();
                    const baseCurrent = title.split(/[:\s-]*season|[:\s-]*part|:/i)[0].trim();
                    return baseExisting === baseCurrent || title.startsWith(existingTitle) || existingTitle.startsWith(title);
                  });
                  if (!isDuplicate) {
                    uniqueAnime.push(anime);
                  }
                }
                setHeroAnime(uniqueAnime);
              }
            })
            .catch(() => {
              // Fallback to our backend pool if Jikan fails
              const heroPool = [...(data.trendingAnime || []), ...(data.popularAnime || [])]
              const uniquePool = Array.from(new Map(heroPool.map(item => [item.mal_id || item.id, item])).values())
              if (isMounted) setHeroAnime(uniquePool.slice(0, 40))
            });

          setTrendingHighlight(data.trendingAnime || [])
          setUpcomingAnime(data.upcomingAnime || [])
          setRecentEpisodes(data.recentEpisodes || [])
          setTopManga(data.topManga || [])
          setPublishingManga(data.publishingManga || [])
        }
      } catch (err) {
        console.error('Home load error:', err)
        if (!globalHomeCache && isMounted) {
           setError('Failed to load portal content. Please try again.')
        }
      } finally {
        if (isMounted) {
            setHeroLoading(false)
            setTopAnimeLoading(false)
            setUpcomingLoading(false)
            setRecentLoading(false)
            setTopMangaLoading(false)
            setPubMangaLoading(false)
        }
      }
    }

    loadAllData()
    return () => { isMounted = false }
  }, [])


  if (error) return <ErrorMessage message={error} />

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://animy-frontend.pages.dev'

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <StructuredData 
        data={[
          generateOrganizationSchema(siteUrl),
          generateWebSiteSchema(siteUrl)
        ]} 
      />
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

      <div className="container mt-8">
        <AdBanner className="mb-12" />
      </div>

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
            upcomingAnime={upcomingAnime}
            recentEpisodes={recentEpisodes}
            topLoading={topAnimeLoading}
            upcomingLoading={upcomingLoading}
            recentLoading={recentLoading}
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
                  upcomingAnime={upcomingAnime}
                  recentEpisodes={recentEpisodes}
                  topLoading={topAnimeLoading}
                  upcomingLoading={upcomingLoading}
                  recentLoading={recentLoading}
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