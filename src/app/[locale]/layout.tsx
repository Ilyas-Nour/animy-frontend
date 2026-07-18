export const runtime = 'edge';
import type { Metadata } from 'next'
// import { Inter } from 'next/font/google'
import './globals.css'
import ClientLayoutWrapper from './ClientLayoutWrapper'



// const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    template: '%s | Animy - Discover Anime & Read Manga',
    default: 'Animy | Discover Anime, Read Manga & Share with Friends',
  },
  description:
    'Discover the best anime series, read the latest manga chapters, and share your favorites with friends on Animy. Your ultimate anime and manga community.',
  keywords: [
    'anime',
    'manga',
    'discover anime',
    'read manga',
    'share anime',
    'anime database',
    'manga database',
    'explore manga',
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
    'english sub anime info',
    'english dub anime info',
    'high quality anime database',
    'seasonal anime',
    'anime schedule'
  ],
  authors: [{ name: 'Animy Team' }],
  creator: 'Animy',
  publisher: 'Animy',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://animy-frontend.pages.dev'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Animy | Discover Anime, Read Manga & Share with Friends',
    description: 'Discover the best anime series, read the latest manga chapters, and share your favorites with friends on Animy. Your ultimate anime and manga community.',
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
    title: 'Animy | Discover Anime, Read Manga & Share with Friends',
    description: 'Discover the best anime series, read the latest manga chapters, and share your favorites with friends on Animy. Your ultimate anime and manga community.',
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
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon-48x48.png',
    apple: '/icon-192.png',
  },
  manifest: '/manifest.json',
}

import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import { GoogleAnalytics } from '@next/third-parties/google';
import Script from 'next/script';

export default async function RootLayout({ children, params }: { children: React.ReactNode, params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
        </NextIntlClientProvider>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
        {/* Global Monetag Scripts */}
        <Script 
          src="https://al5sm.com/tag.min.js" 
          data-zone="11344223" 
          async 
          data-cfasync="false"
          strategy="afterInteractive"
        />
        <Script 
          src="https://al5sm.com/tag.min.js" 
          data-zone="11343530" 
          async 
          data-cfasync="false"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}