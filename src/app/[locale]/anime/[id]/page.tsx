export const runtime = 'edge';
export const revalidate = 3600;
import type { Metadata } from 'next'
import { AnimeDetailsClient } from '@/components/anime/AnimeDetailsClient'
import { notFound } from 'next/navigation'
import JsonLd from '@/components/seo/JsonLd'
import { AdBanner } from '@/components/ads/AdBanner'

import { constructMetadata } from '@/lib/seo-utils'

import { TOP_ANIME_STATIC, TOP_MOVIES_STATIC, HERO_SPOTLIGHT_ANIME } from '@/lib/static-anime-data'

import { anilistFetch, mapAniListToAnime, fetchAnilistAnimeFull } from '@/lib/anilist-client'

async function getAnimeFull(id: string): Promise<any> {
  const numericId = parseInt(id, 10)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1'

  try {
      const controller = new AbortController();
      let fetchTimeout: NodeJS.Timeout;
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      // Race the backend API against Jikan directly. Whichever resolves first wins!
      // This bypasses the 8s cold start completely since Jikan is usually fast.
      const fetchBackend = fetch(`${API_URL}/anime/${numericId}`, {
          headers: { 'Accept': 'application/json' },
          next: { revalidate: 3600 },
          signal: controller.signal
      }).then(async res => {
          if (!res.ok) throw new Error(`Backend fetch failed: ${res.status}`);
          const data = await res.json();
          return data.data || data;
      });

      const fetchJikan = fetch(`https://api.jikan.moe/v4/anime/${numericId}/full`, {
          next: { revalidate: 3600 },
          signal: controller.signal
      }).then(async res => {
          if (!res.ok) throw new Error(`Jikan fetch failed: ${res.status}`);
          const jikanData = await res.json();
          if (!jikanData?.data) throw new Error('Jikan data empty');
          return jikanData.data;
      });

      const fetchAnilist = fetchAnilistAnimeFull(numericId).then(anime => {
          if (!anime) throw new Error('Anilist fetch failed or empty');
          return anime;
      });

      const timeoutPromise = new Promise<any>((_, reject) => 
          fetchTimeout = setTimeout(() => reject(new Error('Fetch timeout exceeded')), 30000)
      );
      timeoutPromise.catch(() => {}); // Prevent unhandled rejection

      // We wait for the fastest successful response, but strictly bound it to 8 seconds
      const anime = await Promise.race([
          Promise.any([fetchBackend, fetchJikan, fetchAnilist]),
          timeoutPromise
      ]);
      clearTimeout(timeoutId);
      clearTimeout(fetchTimeout!);
      return anime;
  } catch (error) {
      console.error('Anime detail fetch failed for both providers:', error)
      const staticHit = [...TOP_ANIME_STATIC, ...TOP_MOVIES_STATIC, ...HERO_SPOTLIGHT_ANIME]
        .find(a => (a as any).id === numericId || a.mal_id === numericId)
      return staticHit || null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string, id: string }> }): Promise<Metadata> {
  const { locale, id } = await params;
  const anime = await getAnimeFull(id)
  if (!anime) return { title: 'Anime Not Found | Animy' }

  const title = `Watch ${anime.title} (English Sub/Dub) Online Free in HD`
  const description = anime.synopsis
    ? `${anime.synopsis.slice(0, 150)}... Watch ${anime.title} episodes online in high quality with English sub and dub on Animy for free.`
    : `Watch ${anime.title} online for free in HD on Animy. Get the latest episodes, characters, and reviews.`

  const keywords = [
    anime.title,
    `watch ${anime.title} online free`,
    `${anime.title} episodes`,
    `${anime.title} english sub`,
    `${anime.title} english dub`,
    `${anime.title} hd`,
    ...(anime.genres?.map((g: any) => g.name) || []),
    ...((anime as any).studios?.map((s: any) => s.name) || []),
    'anime streaming',
    'free anime'
  ]

  return constructMetadata({
    title,
    description,
    keywords,
    image: anime.images?.jpg?.large_image_url || '/og-image.png',
    type: 'video.tv_show',
    canonicalPath: `anime/${id}`,
    locale
  });
}

export default async function AnimeDetailPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
  const { id, locale } = await params;
  const anime = await getAnimeFull(id)

  if (!anime) {
    notFound()
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://animy.xyz';

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': anime.type === 'Movie' ? 'Movie' : 'TVSeries',
      name: anime.title,
      description: anime.synopsis,
      image: anime.images?.jpg?.large_image_url,
      genre: anime.genres?.map((g: any) => g.name),
      datePublished: anime.aired?.from,
      author: anime.studios?.map((s: any) => ({ '@type': 'Organization', name: s.name })),
      aggregateRating: anime.score ? {
        '@type': 'AggregateRating',
        ratingValue: anime.score,
        reviewCount: anime.scored_by || 100,
        bestRating: 10,
        worstRating: 1
      } : undefined
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Anime',
          item: `${baseUrl}/anime`
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: anime.title,
          item: `${baseUrl}/anime/${id}`
        }
      ]
    }
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <AdBanner className="max-w-7xl mx-auto px-4" />
      <AnimeDetailsClient
        anime={anime}
      />
      <AdBanner className="max-w-7xl mx-auto px-4 mt-12" />
    </>
  )
}
