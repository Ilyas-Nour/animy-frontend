import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MangaGrid } from '@/components/manga/MangaGrid'
import { Manga } from '@/types/manga'
import { AnimeGridSkeleton } from '@/components/anime/AnimeGrid'

interface MangaHomeSectionProps {
    topManga: Manga[]
    publishingManga: Manga[]
    topLoading?: boolean
    pubLoading?: boolean
}

export function MangaHomeSection({ topManga, publishingManga, topLoading, pubLoading }: MangaHomeSectionProps) {
    return (
        <div className="space-y-16">
            {/* Top Tier Manga */}
            <section className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-2">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">
                            Top Tier <span className="text-orange-500 italic">Scrolls</span>
                        </h2>
                        <p className="text-muted-foreground font-medium">The most legendary manga series of all time</p>
                    </div>
                    <Link href="/manga?filter=bypopularity">
                        <Button variant="outline" className="h-12 px-8 rounded-xl font-bold border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                            View Top Manga
                        </Button>
                    </Link>
                </div>
                {topLoading ? (
                    <AnimeGridSkeleton count={6} />
                ) : (
                    <MangaGrid manga={topManga} />
                )}
            </section>

            {/* Current Publishing Manga */}
            <section className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-2">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">
                            Publishing <span className="text-pink-500 italic">Now</span>
                        </h2>
                        <p className="text-muted-foreground font-medium">Fresh chapters dropping this season</p>
                    </div>
                    <Link href="/manga?filter=publishing">
                        <Button variant="outline" className="h-12 px-8 rounded-xl font-bold border-border bg-foreground/[0.03] hover:bg-foreground/[0.05] transition-all">
                            Currently Publishing
                        </Button>
                    </Link>
                </div>
                {pubLoading ? (
                    <AnimeGridSkeleton count={6} />
                ) : (
                    <MangaGrid manga={publishingManga} />
                )}
            </section>
        </div>
    )
}
