import type { Metadata } from 'next'
// import { Inter } from 'next/font/google'
import './globals.css'
import ClientLayoutWrapper from './ClientLayoutWrapper'



// const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    template: '%s | Animy - Watch Anime & Read Manga Online',
    default: 'Animy - Your Ultimate Anime Aggregator & Manga Reader',
  },
  description:
    'Animy is the world\'s most advanced anime and manga aggregator. Watch high-quality anime online, read latest manga chapters, track your progress, and join a vibrant community of fans. Fast, free, and always updated.',
  keywords: [
    'anime',
    'manga',
    'watch anime online',
    'free anime streaming',
    'read manga online',
    'latest manga chapters',
    'anime aggregator',
    'manga aggregator',
    'anime community',
    'anime reviews',
    'manga reviews',
    'anime recommendations',
    'otaku',
    'anime tracker',
    'manga tracker',
    'anime watchlist',
    'anime news',
    'english sub anime',
    'english dub anime',
    'high quality anime',
    'seasonal anime',
    'anime schedule',
  ],
  authors: [{ name: 'Animy Team' }],
  creator: 'Animy',
  publisher: 'Animy',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://animy-frontend.pages.dev'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Animy - Watch Anime & Read Manga Online Free',
    description: 'The ultimate destination for anime and manga fans. Stream thousands of episodes and read chapters in high quality for free.',
    url: '/',
    siteName: 'Animy',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Animy - Anime & Manga Aggregator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Animy - Watch Anime & Read Manga Online Free',
    description: 'The ultimate destination for anime and manga fans. Stream thousands of episodes and read chapters in high quality for free.',
    images: ['/og-image.png'],
    creator: '@animy_official',
    site: '@animy_official',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/icon-512.png',
    apple: '/icon-512.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  )
}