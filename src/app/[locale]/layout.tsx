export const runtime = 'edge';
import type { Metadata } from 'next'
// import { Inter } from 'next/font/google'
import './globals.css'
import ClientLayoutWrapper from './ClientLayoutWrapper'
import { AdController } from '@/components/ads/AdController'


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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://animy.xyz'),
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
    icon: '/FINAL-LOGO.png',
    shortcut: '/FINAL-LOGO.png',
    apple: '/FINAL-LOGO.png',
  },
  manifest: '/manifest.json',
}

import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import { GoogleAnalytics } from '@next/third-parties/google';
import Script from 'next/script';

import { cookies } from 'next/headers';

async function getSystemSettings() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1'}/admin/settings`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return {};
    return await res.json();
  } catch (error) {
    return {};
  }
}

export default async function RootLayout({ children, params }: { children: React.ReactNode, params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const settings = await getSystemSettings();
  const isMaintenance = settings.MAINTENANCE_MODE === true;

  if (isMaintenance) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('token')?.value;
    let isAdmin = false;
    if (token) {
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        isAdmin = payload.role === 'ADMIN';
      } catch (e) {}
    }

    if (!isAdmin) {
      return (
        <html lang={locale}>
          <body className="antialiased bg-background text-foreground flex items-center justify-center min-h-screen p-4">
              <div className="text-center space-y-4 max-w-md">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                </div>
                <h1 className="text-3xl font-black text-primary uppercase tracking-wider">Maintenance Mode</h1>
                <p className="text-muted-foreground">Animy is currently undergoing scheduled maintenance to improve your experience. We will be back online shortly!</p>
              </div>
          </body>
        </html>
      );
    }
  }

  const messages = await getMessages();

  // Root JSON-LD for WebSite and SearchAction
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Animy',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://animy.xyz',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL || 'https://animy.xyz'}/discovery?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <html lang={locale}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
        </NextIntlClientProvider>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
        <AdController />
      </body>
    </html>
  )
}