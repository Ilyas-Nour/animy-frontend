import type { Metadata } from 'next'
// import { Inter } from 'next/font/google'
import './globals.css'
import ClientLayoutWrapper from './ClientLayoutWrapper'

export const runtime = 'edge';

// const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    template: '%s | Animy',
    default: 'Animy - Discover Your Next Favorite Anime & Manga',
  },
  description:
    'Discover, track, and discuss anime and manga with Animy. Join thousands of anime fans, create watchlists, read reviews, and connect with the ultimate otaku community.',
  keywords: [
    'anime',
    'manga',
    'anime streaming',
    'watch anime',
    'read manga',
    'anime community',
    'anime reviews',
    'manga reviews',
    'anime recommendations',
    'otaku',
    'anime tracker',
    'manga tracker',
    'anime watchlist',
    'anime news',
  ],
  authors: [{ name: 'Animy Team' }],
  creator: 'Animy',
  publisher: 'Animy',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Animy - Discover Your Next Favorite Anime & Manga',
    description: 'Join thousands of anime fans. Discover, track, and discuss your favorite anime and manga.',
    url: '/',
    siteName: 'Animy',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Animy - Anime & Manga Community',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Animy - Discover Your Next Favorite Anime & Manga',
    description: 'Join thousands of anime fans. Discover, track, and discuss your favorite anime and manga.',
    images: ['/og-image.png'],
    creator: '@animy',
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