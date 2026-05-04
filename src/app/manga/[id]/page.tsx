export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import type { Metadata } from 'next'
import { Manga } from '@/types/manga'
import { notFound } from 'next/navigation'
import MangaDetailsClient from '@/components/manga/MangaDetailsClient'
import JsonLd from '@/components/seo/JsonLd'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const manga = await getMangaFull(id)
    if (!manga) return { title: 'Manga Not Found | Animy' }
    
    const title = `Read ${manga.title} Manga Online Free - All Chapters | Animy`
    const description = manga.synopsis 
        ? `${manga.synopsis.slice(0, 150)}... Read ${manga.title} online in high quality on Animy.`
        : `Read ${manga.title} manga online for free on Animy. Latest chapters, characters, and reviews.`
    
    const keywords = [
        manga.title,
        `read ${manga.title} online`,
        `${manga.title} chapters`,
        `${manga.title} manga online`,
        `${manga.title} english`,
        ...(manga.genres?.map((g: any) => g.name) || []),
        ...(manga.authors?.map((a: any) => a.name) || []),
        'manga reader',
        'free manga'
    ]

    return {
        title,
        description,
        keywords,
        openGraph: {
            title,
            description,
            type: 'book',
            images: [
                {
                    url: manga.images?.jpg?.large_image_url || '',
                    width: 600,
                    height: 900,
                    alt: manga.title,
                }
            ]
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [manga.images?.jpg?.large_image_url || ''],
        }
    }
}

async function getMangaFull(id: string) {
    try {
        const res = await fetch(`${API_URL}/manga/${id}/full`)
        if (!res.ok) return null
        const json = await res.json()
        return json.data
    } catch (error) {
        return null
    }
}

async function getCharacters(id: string) {
    try {
        const res = await fetch(`${API_URL}/manga/${id}/characters`)
        if (!res.ok) return []
        const json = await res.json()
        return Array.isArray(json.data) ? json.data : []
    } catch (error) {
        return []
    }
}

async function getChapters(id: string) {
    try {
        const res = await fetch(`${API_URL}/manga/${id}/read-chapters`)
        if (!res.ok) return []
        const json = await res.json()
        const chaptersData = json.data?.chapters || json.chapters || []
        return Array.isArray(chaptersData) ? chaptersData : []
    } catch (error) {
        console.error('[Manga] Failed to fetch chapters:', error)
        return []
    }
}

export default async function MangaDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    // Fetch core data in parallel for speed, but leave chapters for the client
    const [rawManga, characters] = await Promise.all([
        getMangaFull(id),
        getCharacters(id)
    ])

    if (!rawManga) {
        notFound()
    }

    // Enrich manga with sub-data for components
    const manga = {
        ...rawManga,
        relations: rawManga.relations || [],
        recommendations: rawManga.recommendations || [],
        external: rawManga.external || []
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Book',
        name: manga.title,
        description: manga.synopsis,
        image: manga.images?.jpg?.large_image_url,
        genre: manga.genres?.map((g: any) => g.name),
        author: manga.authors?.map((a: any) => ({ '@type': 'Person', name: a.name })),
        datePublished: manga.published?.from,
        aggregateRating: manga.score ? {
            '@type': 'AggregateRating',
            ratingValue: manga.score,
            reviewCount: manga.scored_by || 50,
            bestRating: 10,
            worstRating: 1
        } : undefined
    }

    return (
        <>
            <JsonLd data={jsonLd} />
            <MangaDetailsClient 
                manga={manga} 
                characters={characters} 
            />
        </>
    )
}
