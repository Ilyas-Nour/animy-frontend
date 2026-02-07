import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Anime - Browse & Discover',
    description: 'Explore thousands of anime series and movies. Find your next favorite anime, read reviews, and track your watchlist on Animy.',
    keywords: ['anime', 'watch anime', 'anime series', 'anime movies', 'anime streaming', 'anime reviews', 'anime recommendations'],
    openGraph: {
        title: 'Browse Anime - Animy',
        description: 'Explore thousands of anime series and movies. Find your next favorite anime.',
        type: 'website',
    },
}

export default function AnimeLayout({ children }: { children: React.ReactNode }) {
    return children
}
