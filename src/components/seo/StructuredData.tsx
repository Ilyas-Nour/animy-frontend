/**
 * Structured Data (JSON-LD) Component
 * Generates schema.org structured data for SEO
 */

import Script from 'next/script'

interface OrganizationSchema {
    type: 'Organization'
    name: string
    url: string
    logo?: string
    description?: string
    sameAs?: string[]
}

interface WebSiteSchema {
    type: 'WebSite'
    name: string
    url: string
    potentialAction?: {
        '@type': string
        target: string
        'query-input': string
    }
}

interface BreadcrumbSchema {
    type: 'BreadcrumbList'
    itemListElement: Array<{
        '@type': string
        position: number
        name: string
        item?: string
    }>
}

interface AnimeSchema {
    type: 'Movie' | 'TVSeries'
    name: string
    description?: string
    image?: string
    genre?: string[]
    aggregateRating?: {
        '@type': string
        ratingValue: number
        bestRating: number
        ratingCount?: number
    }
    datePublished?: string
}

interface MangaSchema {
    type: 'Book'
    name: string
    description?: string
    image?: string
    genre?: string[]
    aggregateRating?: {
        '@type': string
        ratingValue: number
        bestRating: number
        ratingCount?: number
    }
    author?: string
}

interface CharacterSchema {
    type: 'Person'
    name: string
    description?: string
    image?: string
}

interface ArticleSchema {
    type: 'Article'
    headline: string
    description?: string
    image?: string
    author?: {
        '@type': string
        name: string
    }
    datePublished?: string
    dateModified?: string
}

type SchemaType =
    | OrganizationSchema
    | WebSiteSchema
    | BreadcrumbSchema
    | AnimeSchema
    | MangaSchema
    | CharacterSchema
    | ArticleSchema

interface StructuredDataProps {
    data: SchemaType | SchemaType[]
}

export function StructuredData({ data }: StructuredDataProps) {
    const schemas = Array.isArray(data) ? data : [data]

    const jsonLd = schemas.map((schema) => {
        const baseSchema = {
            '@context': 'https://schema.org',
        }

        switch (schema.type) {
            case 'Organization':
                return {
                    ...baseSchema,
                    '@type': 'Organization',
                    name: schema.name,
                    url: schema.url,
                    logo: schema.logo,
                    description: schema.description,
                    sameAs: schema.sameAs,
                }

            case 'WebSite':
                return {
                    ...baseSchema,
                    '@type': 'WebSite',
                    name: schema.name,
                    url: schema.url,
                    potentialAction: schema.potentialAction,
                }

            case 'BreadcrumbList':
                return {
                    ...baseSchema,
                    '@type': 'BreadcrumbList',
                    itemListElement: schema.itemListElement,
                }

            case 'Movie':
            case 'TVSeries':
                return {
                    ...baseSchema,
                    '@type': schema.type,
                    name: schema.name,
                    description: schema.description,
                    image: schema.image,
                    genre: schema.genre,
                    aggregateRating: schema.aggregateRating,
                    datePublished: schema.datePublished,
                }

            case 'Book':
                return {
                    ...baseSchema,
                    '@type': 'Book',
                    name: schema.name,
                    description: schema.description,
                    image: schema.image,
                    genre: schema.genre,
                    aggregateRating: schema.aggregateRating,
                    author: schema.author,
                }

            case 'Person':
                return {
                    ...baseSchema,
                    '@type': 'Person',
                    name: schema.name,
                    description: schema.description,
                    image: schema.image,
                }

            case 'Article':
                return {
                    ...baseSchema,
                    '@type': 'Article',
                    headline: schema.headline,
                    description: schema.description,
                    image: schema.image,
                    author: schema.author,
                    datePublished: schema.datePublished,
                    dateModified: schema.dateModified,
                }

            default:
                return baseSchema
        }
    })

    return (
        <Script
            id="structured-data"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(schemas.length === 1 ? jsonLd[0] : jsonLd),
            }}
        />
    )
}

// Helper functions to generate common schemas

export function generateOrganizationSchema(siteUrl: string): OrganizationSchema {
    return {
        type: 'Organization',
        name: 'Animy',
        url: siteUrl,
        logo: `${siteUrl}/logo.png`,
        description: 'Discover, track, and discuss your favorite anime and manga',
        sameAs: [
            // Add your social media URLs here
            // 'https://twitter.com/animy',
            // 'https://facebook.com/animy',
        ],
    }
}

export function generateWebSiteSchema(siteUrl: string): WebSiteSchema {
    return {
        type: 'WebSite',
        name: 'Animy',
        url: siteUrl,
        potentialAction: {
            '@type': 'SearchAction',
            target: `${siteUrl}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
        },
    }
}

export function generateBreadcrumbSchema(
    items: Array<{ name: string; url?: string }>
): BreadcrumbSchema {
    return {
        type: 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    }
}

export function generateAnimeSchema(anime: {
    title: string
    synopsis?: string
    image?: string
    genres?: string[]
    score?: number
    type?: string
    aired?: string
}): AnimeSchema {
    return {
        type: anime.type === 'Movie' ? 'Movie' : 'TVSeries',
        name: anime.title,
        description: anime.synopsis,
        image: anime.image,
        genre: anime.genres,
        aggregateRating: anime.score
            ? {
                '@type': 'AggregateRating',
                ratingValue: anime.score,
                bestRating: 10,
            }
            : undefined,
        datePublished: anime.aired,
    }
}

export function generateMangaSchema(manga: {
    title: string
    synopsis?: string
    image?: string
    genres?: string[]
    score?: number
    authors?: string[]
}): MangaSchema {
    return {
        type: 'Book',
        name: manga.title,
        description: manga.synopsis,
        image: manga.image,
        genre: manga.genres,
        aggregateRating: manga.score
            ? {
                '@type': 'AggregateRating',
                ratingValue: manga.score,
                bestRating: 10,
            }
            : undefined,
        author: manga.authors?.[0],
    }
}

export function generateCharacterSchema(character: {
    name: string
    about?: string
    image?: string
}): CharacterSchema {
    return {
        type: 'Person',
        name: character.name,
        description: character.about,
        image: character.image,
    }
}

export function generateArticleSchema(article: {
    title: string
    content?: string
    image?: string
    author?: string
    publishedAt?: string
    updatedAt?: string
}): ArticleSchema {
    return {
        type: 'Article',
        headline: article.title,
        description: article.content,
        image: article.image,
        author: article.author
            ? {
                '@type': 'Person',
                name: article.author,
            }
            : undefined,
        datePublished: article.publishedAt,
        dateModified: article.updatedAt,
    }
}
