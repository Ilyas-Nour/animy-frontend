/**
 * SEO Utility Functions
 * Helper functions for generating SEO-friendly content
 */

const SITE_NAME = 'Animy';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://animy.com';
const SITE_DESCRIPTION = 'Discover, track, and discuss your favorite anime and manga. Join the ultimate anime community.';

export interface SEOConfig {
    title?: string;
    description?: string;
    keywords?: string[];
    image?: string;
    type?: 'website' | 'article' | 'profile';
    author?: string;
    publishedTime?: string;
    modifiedTime?: string;
}

/**
 * Generate page title with site name
 */
export function generateTitle(pageTitle?: string): string {
    if (!pageTitle) return `${SITE_NAME} - Discover Your Next Favorite Anime`;
    return `${pageTitle} | ${SITE_NAME}`;
}

/**
 * Generate meta description with proper length
 */
export function generateDescription(content: string, maxLength: number = 160): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength - 3) + '...';
}

/**
 * Generate keywords from content
 */
export function generateKeywords(items: string[]): string {
    return items.join(', ');
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${SITE_URL}${cleanPath}`;
}

/**
 * Generate Open Graph metadata
 */
export function generateOpenGraph(config: SEOConfig) {
    return {
        title: config.title || SITE_NAME,
        description: config.description || SITE_DESCRIPTION,
        url: SITE_URL,
        siteName: SITE_NAME,
        images: config.image ? [
            {
                url: config.image,
                width: 1200,
                height: 630,
                alt: config.title || SITE_NAME,
            }
        ] : [],
        locale: 'en_US',
        type: config.type || 'website',
    };
}

/**
 * Generate Twitter Card metadata
 */
export function generateTwitterCard(config: SEOConfig) {
    return {
        card: 'summary_large_image',
        title: config.title || SITE_NAME,
        description: config.description || SITE_DESCRIPTION,
        images: config.image ? [config.image] : [],
        creator: '@animy',
    };
}

/**
 * Generate anime-specific metadata
 */
export function generateAnimeMetadata(anime: {
    title: string;
    synopsis?: string;
    image?: string;
    genres?: string[];
    score?: number;
}) {
    const title = generateTitle(anime.title);
    const description = generateDescription(
        anime.synopsis || `Watch ${anime.title} and discover more anime on Animy.`,
        160
    );
    const keywords = [
        anime.title,
        'anime',
        'watch anime',
        'anime streaming',
        ...(anime.genres || []),
    ];

    return {
        title,
        description,
        keywords: generateKeywords(keywords),
        openGraph: generateOpenGraph({
            title: anime.title,
            description,
            image: anime.image,
            type: 'website',
        }),
        twitter: generateTwitterCard({
            title: anime.title,
            description,
            image: anime.image,
        }),
    };
}

/**
 * Generate manga-specific metadata
 */
export function generateMangaMetadata(manga: {
    title: string;
    synopsis?: string;
    image?: string;
    genres?: string[];
    score?: number;
}) {
    const title = generateTitle(manga.title);
    const description = generateDescription(
        manga.synopsis || `Read ${manga.title} and discover more manga on Animy.`,
        160
    );
    const keywords = [
        manga.title,
        'manga',
        'read manga',
        'manga online',
        ...(manga.genres || []),
    ];

    return {
        title,
        description,
        keywords: generateKeywords(keywords),
        openGraph: generateOpenGraph({
            title: manga.title,
            description,
            image: manga.image,
            type: 'website',
        }),
        twitter: generateTwitterCard({
            title: manga.title,
            description,
            image: manga.image,
        }),
    };
}

/**
 * Generate character-specific metadata
 */
export function generateCharacterMetadata(character: {
    name: string;
    about?: string;
    image?: string;
}) {
    const title = generateTitle(character.name);
    const description = generateDescription(
        character.about || `Learn about ${character.name} and discover more anime characters on Animy.`,
        160
    );

    return {
        title,
        description,
        openGraph: generateOpenGraph({
            title: character.name,
            description,
            image: character.image,
            type: 'profile',
        }),
        twitter: generateTwitterCard({
            title: character.name,
            description,
            image: character.image,
        }),
    };
}

export const SEO_CONSTANTS = {
    SITE_NAME,
    SITE_URL,
    SITE_DESCRIPTION,
};
