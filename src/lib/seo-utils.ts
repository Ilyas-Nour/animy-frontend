import { Metadata } from 'next';

const SITE_NAME = 'Animy';
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://animy.xyz';
const SITE_DESCRIPTION = 'Discover, track, and discuss your favorite anime and manga. Join the ultimate anime community.';

export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  icons?: string;
  noIndex?: boolean;
  type?: 'website' | 'article' | 'video.tv_show' | 'book' | 'profile';
  keywords?: string[];
  canonicalPath?: string;
  locale?: string;
}

export function constructMetadata({
  title = SITE_NAME,
  description = SITE_DESCRIPTION,
  image = '/og-image.png',
  icons = '/favicon.ico',
  noIndex = false,
  type = 'website',
  keywords = ['anime', 'manga', 'watch anime', 'read manga', 'anime community'],
  canonicalPath = '',
  locale = 'en',
}: SEOProps = {}): Metadata {
  const fullTitle = title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`;
  
  // Clean canonical path (remove leading slash if present)
  const cleanPath = canonicalPath.startsWith('/') ? canonicalPath.slice(1) : canonicalPath;
  
  // Base Canonical URL (e.g., https://animy.xyz/anime/123)
  const canonicalUrl = locale === 'en' 
    ? `${SITE_URL}/${cleanPath}`
    : `${SITE_URL}/${locale}/${cleanPath}`;

  return {
    title: fullTitle,
    description,
    keywords,
    openGraph: {
      title: fullTitle,
      description,
      type,
      url: canonicalUrl,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: fullTitle,
        }
      ],
      siteName: SITE_NAME,
      locale: locale === 'en' ? 'en_US' : locale === 'es' ? 'es_ES' : locale === 'fr' ? 'fr_FR' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
      creator: '@animy',
    },
    icons,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${SITE_URL}/${cleanPath}`,
        'es': `${SITE_URL}/es/${cleanPath}`,
        'fr': `${SITE_URL}/fr/${cleanPath}`,
        'x-default': `${SITE_URL}/${cleanPath}`,
      }
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      }
    })
  }
}

export const SEO_CONSTANTS = {
  SITE_NAME,
  SITE_URL,
  SITE_DESCRIPTION,
};
