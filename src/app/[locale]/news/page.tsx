import type { Metadata } from 'next'
import { NewsFeed } from '@/components/news/NewsFeed'
import { Suspense } from 'react'
import JsonLd from '@/components/seo/JsonLd'

export const runtime = 'edge'

export const metadata: Metadata = {
    title: 'Anime & Manga News — Latest Updates | Animy',
    description: 'Stay up to date with the latest anime and manga news. Breaking news from Anime News Network, Crunchyroll, MyAnimeList, and more — all in one place on Animy.',
    keywords: [
        'anime news', 'manga news', 'latest anime updates', 'crunchyroll news',
        'anime news network', 'myanimelist news', 'new anime episodes',
        'anime season news', 'new manga chapters', 'anime release dates'
    ],
    alternates: {
        canonical: 'https://animy.xyz/news',
    },
    openGraph: {
        title: 'Anime & Manga News — Latest Updates | Animy',
        description: 'Breaking anime and manga news from top sources, aggregated in real time.',
        type: 'website',
        url: 'https://animy.xyz/news',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Anime & Manga News | Animy',
        description: 'The latest anime and manga news from ANN, Crunchyroll, MAL & more.',
    }
}

const newsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: 'Animy News',
    url: 'https://animy.xyz/news',
    description: 'Anime and manga news aggregator covering the latest from ANN, Crunchyroll, MyAnimeList and more.',
    logo: {
        '@type': 'ImageObject',
        url: 'https://animy.xyz/logo.png',
    }
}

export default function NewsPage() {
    return (
        <>
            <JsonLd data={newsJsonLd} />
            <div className="min-h-screen bg-background text-foreground">
                {/* Subtle background gradient */}
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-orange-500/5 blur-[120px] rounded-full" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-4 pt-10 pb-20 md:pt-16">
                    {/* Page Header */}
                    <div className="mb-10 md:mb-14">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-500/80">Live Feed</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.05]">
                            Anime News
                        </h1>
                        <p className="mt-3 text-sm md:text-base text-muted-foreground/60 max-w-md">
                            Real-time articles from ANN, Crunchyroll, MAL, Anime Corner and more — all in one place.
                        </p>
                    </div>

                    <Suspense>
                        <NewsFeed />
                    </Suspense>
                </div>
            </div>
        </>
    )
}
