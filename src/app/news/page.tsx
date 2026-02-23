import { NewsFeed } from '@/components/news/NewsFeed'
import { Flame } from 'lucide-react'
import { fetchRedditPosts } from '@/actions/news'

export const revalidate = 3600 // Revalidate every hour

export default async function NewsPage() {
    const news = await fetchRedditPosts()

    return (
        <div className="min-h-screen bg-background text-foreground relative overflow-hidden selection:bg-orange-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-orange-500/10 dark:bg-orange-600/10 rounded-full blur-[120px] dark:blur-[150px] opacity-50 dark:opacity-100" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[60%] bg-purple-500/10 dark:bg-red-600/10 rounded-full blur-[120px] dark:blur-[150px] opacity-40 dark:opacity-100" />
            </div>

            <div className="relative z-10 container max-w-4xl mx-auto px-4 py-8 md:py-16">
                <div className="mb-8 md:mb-16 text-center space-y-4 md:space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 md:px-6 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">
                        <Flame className="w-3 h-3 md:w-4 md:h-4" />
                        Live Feed Active
                    </div>

                    <h1 className="text-4xl md:text-7xl font-black text-foreground leading-[0.9] tracking-tighter italic uppercase">
                        Global<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-purple-600">Transmissions</span>
                    </h1>

                    <p className="max-w-xl mx-auto text-muted-foreground text-xs md:text-sm font-medium leading-relaxed px-4">
                        Intercepting high-priority data shards from the secure Anime news lattice.
                        Stay synchronized with every shift in the multi-world frequency.
                    </p>
                </div>

                <NewsFeed initialNews={news} />
            </div>
        </div>
    )
}
