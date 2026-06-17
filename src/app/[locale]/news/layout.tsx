import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Anime News & Updates',
    description: 'Stay updated with the latest anime news, announcements, and community discussions. Join the conversation on Animy.',
    keywords: ['anime news', 'anime updates', 'anime announcements', 'anime community', 'anime discussion'],
    openGraph: {
        title: 'Anime News - Animy',
        description: 'Stay updated with the latest anime news and community discussions.',
        type: 'website',
    },
}

export default function NewsLayout({ children }: { children: React.ReactNode }) {
    return children
}
