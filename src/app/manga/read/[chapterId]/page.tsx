export const runtime = 'edge';
export const revalidate = 3600;

import type { Metadata } from 'next';
import MangaReaderClient from '@/components/manga/MangaReaderClient';

export async function generateMetadata({ params }: { params: Promise<{ chapterId: string }> }): Promise<Metadata> {
    const { chapterId } = await params;
    
    // Attempt to extract a clean chapter number from the ID if possible
    const cleanChapterId = chapterId.replace(/-/g, ' ');
    const title = `Read ${cleanChapterId} Online | Animy`;
    const description = `Read ${cleanChapterId} online in high quality. The best place to read manga for free on Animy.`;

    return {
        title,
        description,
        alternates: {
            canonical: `https://animy.xyz/manga/read/${chapterId}`,
        },
        openGraph: { title, description }
    }
}

export default function MangaReaderPage() {
    return <MangaReaderClient />
}
