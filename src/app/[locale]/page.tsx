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
import { TOP_ANIME_STATIC, TOP_MANGA_STATIC } from '@/lib/static-anime-data'

// Modular Components
import { HeroSpotlight } from '@/components/home/HeroSpotlight'
import { CategorySwiper } from '@/components/home/CategorySwiper'
import { AnimeHomeSection } from '@/components/home/AnimeHomeSection'
import { MangaHomeSection } from '@/components/home/MangaHomeSection'
import { UserHomeSection } from '@/components/home/UserHomeSection'

// Global cache to persist home data across client-side navigations
let globalHomeCache: any = null;

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, login } = useAuth()
  const [hasMounted, setHasMounted] = useState(false)
  const [topAnime, setTopAnime] = useState<Anime[]>(globalHomeCache?.popularAnime || (TOP_ANIME_STATIC.slice(0, 20) as any))
  const [trendingHighlight, setTrendingHighlight] = useState<Anime[]>(globalHomeCache?.trendingAnime || (TOP_ANIME_STATIC.slice(0, 10) as any))
  const [upcomingAnime, setUpcomingAnime] = useState<Anime[]>(globalHomeCache?.upcomingAnime || (TOP_ANIME_STATIC.slice(10, 20) as any))
  const [recentEpisodes, setRecentEpisodes] = useState<Anime[]>(globalHomeCache?.recentEpisodes || (TOP_ANIME_STATIC.slice(0, 12) as any))
  const [heroAnime, setHeroAnime] = useState<Anime[]>(globalHomeCache?.popularAnime?.slice(0, 6) || (TOP_ANIME_STATIC.slice(0, 6) as any))
  const [topManga, setTopManga] = useState<Manga[]>(globalHomeCache?.topManga || (TOP_MANGA_STATIC.slice(0, 15) as any))
  const [publishingManga, setPublishingManga] = useState<Manga[]>(globalHomeCache?.publishingManga || (TOP_MANGA_STATIC.slice(0, 15) as any))
  const [activeCategory, setActiveCategory] = useState<'anime' | 'manga' | 'social'>('anime')

  // Fine-grained loading states
  const [heroLoading, setHeroLoading] = useState(false)
  const [topAnimeLoading, setTopAnimeLoading] = useState(false)
  const [upcomingLoading, setUpcomingLoading] = useState(false)
  const [recentLoading, setRecentLoading] = useState(false)
  const [topMangaLoading, setTopMangaLoading] = useState(false)
  const [pubMangaLoading, setPubMangaLoading] = useState(false)
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
      let data: any = null;

      try {
        // 1. Try /api/home with a strict 6-second timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        
        try {
          const res = await fetch('/api/home', { signal: controller.signal });
          clearTimeout(timeoutId);
          if (res.ok) {
            const json = await res.json();
            data = json.data || json;
          }
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          console.warn('Primary /api/home call timed out or failed, trying direct AniList fallback...', fetchErr);
        }

        // 2. Client-side AniList fallback if /api/home failed or was empty
        if (!data || (!data.popularAnime?.length && !data.topManga?.length)) {
          try {
            const query = `
              query {
                trendingAnime: Page(page: 1, perPage: 15) {
                  media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
                    id
                    title { english romaji native }
                    coverImage { extraLarge large medium color }
                    bannerImage
                    description
                    averageScore
                    format
                    episodes
                    status
                    genres
                  }
                }
                popularAnime: Page(page: 1, perPage: 20) {
                  media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
                    id
                    title { english romaji native }
                    coverImage { extraLarge large medium color }
                    bannerImage
                    description
                    averageScore
                    format
                    episodes
                    status
                    genres
                  }
                }
                topManga: Page(page: 1, perPage: 15) {
                  media(type: MANGA, sort: POPULARITY_DESC, isAdult: false) {
                    id
                    title { english romaji native }
                    coverImage { extraLarge large medium color }
                    description
                    averageScore
                    format
                    chapters
                    status
                    genres
                  }
                }
              }
            `;
            const alRes = await fetch('https://graphql.anilist.co', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query })
            });

            if (alRes.ok) {
              const alJson = await alRes.json();
              const alData = alJson.data;
              const mapMedia = (m: any) => ({
                id: m.id,
                mal_id: m.id,
                title: m.title?.english || m.title?.romaji || m.title?.native,
                title_english: m.title?.english,
                title_japanese: m.title?.native,
                images: {
                  jpg: { image_url: m.coverImage?.large, large_image_url: m.coverImage?.extraLarge || m.coverImage?.large },
                  webp: { image_url: m.coverImage?.large, large_image_url: m.coverImage?.extraLarge || m.coverImage?.large }
                },
                bannerImage: m.bannerImage,
                synopsis: m.description ? m.description.replace(/<[^>]*>?/gm, '') : '',
                score: m.averageScore ? m.averageScore / 10 : undefined,
                type: m.format,
                episodes: m.episodes,
                chapters: m.chapters,
                status: m.status,
                genres: m.genres?.map((g: string, i: number) => ({ mal_id: i, name: g })) || []
              });

              data = {
                popularAnime: alData.popularAnime?.media?.map(mapMedia) || [],
                trendingAnime: alData.trendingAnime?.media?.map(mapMedia) || [],
                upcomingAnime: alData.trendingAnime?.media?.map(mapMedia) || [],
                recentEpisodes: alData.trendingAnime?.media?.map(mapMedia) || [],
                topManga: alData.topManga?.media?.map(mapMedia) || [],
                publishingManga: alData.topManga?.media?.map(mapMedia) || []
              };
            }
          } catch (alErr) {
            console.warn('Client AniList fallback failed, using static data...', alErr);
          }
        }

        // 3. Static fallback guarantee
        if (!data || (!data.popularAnime?.length && !data.topManga?.length)) {
          data = {
            popularAnime: TOP_ANIME_STATIC.slice(0, 20),
            trendingAnime: TOP_ANIME_STATIC.slice(0, 10),
            upcomingAnime: TOP_ANIME_STATIC.slice(10, 20),
            recentEpisodes: TOP_ANIME_STATIC.slice(0, 20),
            topManga: TOP_MANGA_STATIC.slice(0, 20),
            publishingManga: TOP_MANGA_STATIC.slice(0, 20),
          };
        }

        if (data && isMounted) {
          // Update global cache
          globalHomeCache = data;

          // Update local state
          if (data.popularAnime?.length) setTopAnime(data.popularAnime)
          
          // Use pool for hero section
          const heroPool = [...(data.trendingAnime || []), ...(data.popularAnime || [])]
          const uniquePool = Array.from(new Map(heroPool.map(item => [item.mal_id || item.id, item])).values())
          
          // Deduplicate franchises
          const uniqueAnime: Anime[] = [];
          for (const anime of uniquePool) {
            const title = (anime.title_english || anime.title || '').toLowerCase();
            const isDuplicate = uniqueAnime.some(existing => {
              const existingTitle = (existing.title_english || existing.title || '').toLowerCase();
              const baseExisting = existingTitle.split(/[:\s-]*season|[:\s-]*part|:/i)[0].trim();
              const baseCurrent = title.split(/[:\s-]*season|[:\s-]*part|:/i)[0].trim();
              return baseExisting === baseCurrent || title.startsWith(existingTitle) || existingTitle.startsWith(title);
            });
            if (!isDuplicate) {
              uniqueAnime.push(anime as Anime);
            }
          }
          if (isMounted && uniqueAnime.length > 0) {
            setHeroAnime(uniqueAnime.slice(0, 15))
          }

          if (data.trendingAnime?.length) setTrendingHighlight(data.trendingAnime)
          if (data.upcomingAnime?.length) setUpcomingAnime(data.upcomingAnime)
          if (data.recentEpisodes?.length) setRecentEpisodes(data.recentEpisodes)
          if (data.topManga?.length) setTopManga(data.topManga)
          if (data.publishingManga?.length) setPublishingManga(data.publishingManga)
        }
      } catch (err) {
        console.error('Home load error caught, fallback content remains active:', err);
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
  }, [login, router])

  if (error && topAnime.length === 0 && topManga.length === 0) return <ErrorMessage message={error} />

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
      <HeroSpotlight anime={heroAnime} />

      {/* 2. Mobile Category Swiper - Sticky */}
      <CategorySwiper onCategoryChange={setActiveCategory} />

      <div className="container mt-8">
        <AdBanner className="mb-12" />
      </div>

      {/* 3. High-Impact Interaction Area (User Only) */}
      {hasMounted && isAuthenticated && (
        <UserHomeSection trending={trendingHighlight} />
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