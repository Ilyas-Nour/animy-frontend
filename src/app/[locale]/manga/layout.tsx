import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Manga - Browse & Discover',
    description: 'Explore thousands of manga titles. Find your next favorite manga, read reviews, and track your reading list on Animy.',
    keywords: ['manga', 'read manga', 'manga online', 'manga reviews', 'manga recommendations', 'japanese manga'],
    openGraph: {
        title: 'Browse Manga - Animy',
        description: 'Explore thousands of manga titles. Find your next favorite manga.',
        type: 'website',
    },
}

export default function MangaLayout({ children }: { children: React.ReactNode }) {
    return children
}
