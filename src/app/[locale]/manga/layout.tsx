export const runtime = 'edge';
import { constructMetadata } from '@/lib/seo-utils'
import JsonLd from '@/components/seo/JsonLd'

export const metadata = constructMetadata({
    title: 'Manga - Browse & Discover',
    description: 'Explore thousands of manga titles. Find your next favorite manga, read reviews, and track your reading list on Animy.',
    keywords: ['manga', 'read manga', 'manga online', 'manga reviews', 'manga recommendations', 'japanese manga'],
    type: 'website',
    canonicalPath: 'manga',
})

export default function MangaLayout({ children }: { children: React.ReactNode }) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://animy.xyz';

    const jsonLd = [
        {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Browse Manga - Animy',
            description: 'Explore thousands of manga titles.',
            url: `${baseUrl}/manga`,
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
                    name: 'Manga',
                    item: `${baseUrl}/manga`
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
