'use client'

import { NewsFeed } from '@/components/news/NewsFeed'
import { Suspense } from 'react'

export default function NewsPage() {
    return (
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
                        Real-time articles from ANN, Crunchyroll, MAL, and 4 more sources — all in one place.
                    </p>
                </div>

                <Suspense>
                    <NewsFeed />
                </Suspense>
            </div>
        </div>
    )
}
