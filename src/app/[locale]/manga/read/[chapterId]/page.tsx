export const runtime = 'edge';
export const revalidate = 3600;

import type { Metadata } from 'next';
import { Suspense } from 'react';
import MangaReaderClient from '@/components/manga/MangaReaderClient';
import { Loader2 } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ chapterId: string }> }): Promise<Metadata> {
    const { chapterId } = await params;
    
    // Attempt to extract a clean chapter number from the ID if possible
    const cleanChapterId = chapterId.replace(/-/g, ' ');
    
    // Capitalize words for the title
    const formattedTitle = cleanChapterId.replace(/\b\w/g, c => c.toUpperCase());
    
    const title = `Read ${formattedTitle} Online Free | Animy`;
    const description = `Read ${formattedTitle} online in high quality. The best place to read manga for free on Animy. Stay updated with the latest manga chapters!`;
    const keywords = [
        formattedTitle,
        `read ${cleanChapterId}`,
        `read ${cleanChapterId} online`,
        `read ${cleanChapterId} free`,
        `${cleanChapterId} english`,
        `manga chapter`,
        'read manga online',
        'free manga reader'
    ];

    return {
        title,
        description,
        keywords,
        alternates: {
            canonical: `https://animy.xyz/manga/read/${chapterId}`,
            languages: {
                'en': `https://animy.xyz/manga/read/${chapterId}`,
                'es': `https://animy.xyz/es/manga/read/${chapterId}`,
                'fr': `https://animy.xyz/fr/manga/read/${chapterId}`,
            }
        },
        openGraph: { title, description }
    }
}

function MangaReaderFallback() {
    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white fixed inset-0 z-[100]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="font-medium animate-pulse text-muted-foreground tracking-widest uppercase text-xs">Loading Scrolls...</p>
        </div>
    )
}

export default function MangaReaderPage() {
    return (
        <Suspense fallback={<MangaReaderFallback />}>
            <MangaReaderClient />
        </Suspense>
    )
}
