export const runtime = 'edge';
export const revalidate = 3600;

import type { Metadata } from 'next';
import MangaReaderClient from '@/components/manga/MangaReaderClient';

export async function generateMetadata({ params }: { params: Promise<{ chapterId: string }> }): Promise<Metadata> {
    const { chapterId } = await params;
    
    // Attempt to extract a clean chapter number from the ID if possible
    // e.g. "one-piece-chapter-1000" -> "one piece chapter 1000"
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
        },
        openGraph: { title, description }
    }
}

export default function MangaReaderPage() {
    return <MangaReaderClient />
}
