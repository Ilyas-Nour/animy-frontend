export const runtime = 'edge';
import { constructMetadata } from '@/lib/seo-utils'
import JsonLd from '@/components/seo/JsonLd'

export const metadata = constructMetadata({
    title: 'Anime - Browse & Discover',
    description: 'Explore thousands of anime series and movies. Find your next favorite anime, read reviews, and track your watchlist on Animy.',
    keywords: ['anime', 'watch anime', 'anime series', 'anime movies', 'anime streaming', 'anime reviews', 'anime recommendations'],
    type: 'website',
    canonicalPath: 'anime',
})

export default function AnimeLayout({ children }: { children: React.ReactNode }) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://animy.xyz';

    const jsonLd = [
        {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Browse Anime - Animy',
            description: 'Explore thousands of anime series and movies.',
            url: `${baseUrl}/anime`,
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Home',
                    item: baseUrl
                },
                {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Anime',
                    item: `${baseUrl}/anime`
                }
            ]
        }
    ];

    return (
        <>
            <JsonLd data={jsonLd} />
            {children}
        </>
    )
}
