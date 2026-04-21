import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Disable SSR completely for the Reader to avoid React Minified error #418 & #423
// The reader has highly complex client-state that mutates the DOM tree
const MangaReaderClient = dynamic(
    () => import('@/components/manga/MangaReaderClient'),
    {
        ssr: false,
        loading: () => (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white fixed inset-0 z-[100]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="font-medium animate-pulse text-muted-foreground tracking-widest uppercase text-xs">Loading Scrolls...</p>
            </div>
        )
    }
)

export default function MangaReaderPage() {
    return <MangaReaderClient />
}
