import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AnimeGrid, AnimeGridSkeleton } from '@/components/anime/AnimeGrid'
import { Anime } from '@/types/anime'

interface AnimeHomeSectionProps {
    topAnime: Anime[]
    upcomingAnime: Anime[]
    topLoading?: boolean
    upcomingLoading?: boolean
}

export function AnimeHomeSection({ topAnime, upcomingAnime, topLoading, upcomingLoading }: AnimeHomeSectionProps) {
    return (
        <div className="space-y-16">
            {/* Top Airing Anime */}
            <section className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-2">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">
                            Top Airing <span className="text-primary italic">Relics</span>
                        </h2>
                        <p className="text-muted-foreground font-medium">The most watched series across the globe right now</p>
                    </div>
                    <Link href="/anime?filter=airing">
                        <Button variant="outline" className="h-12 px-8 rounded-xl font-bold border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                            View All Airing
                        </Button>
                    </Link>
                </div>
                {topLoading ? (
                    <AnimeGridSkeleton count={6} />
                ) : (
                    <AnimeGrid anime={topAnime} />
                )}
            </section>

            {/* Upcoming Next Season */}
            <section className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-2">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">
                            Upcoming <span className="text-pink-500 italic">Next Season</span>
                        </h2>
                        <p className="text-muted-foreground font-medium">Anticipated legends arriving in the coming months</p>
                    </div>
                    <Link href="/anime/upcoming">
                        <Button variant="outline" className="h-12 px-8 rounded-xl font-bold border-border bg-foreground/[0.03] hover:bg-foreground/[0.05] transition-all">
                            View Upcoming
                        </Button>
                    </Link>
                </div>
                {upcomingLoading ? (
                    <AnimeGridSkeleton count={6} />
                ) : (
                    <AnimeGrid anime={upcomingAnime} />
                )}
            </section>
        </div>
    )
}
