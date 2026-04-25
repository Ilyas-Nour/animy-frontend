export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { Manga } from '@/types/manga'
import { notFound } from 'next/navigation'
import MangaDetailsClient from '@/components/manga/MangaDetailsClient'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1'

async function getManga(id: string) {
    try {
        const res = await fetch(`${API_URL}/manga/${id}/full`)
        if (!res.ok) return null
        const json = await res.json()
        return json.data as Manga
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
        // API returns data: { chapters: [...] }
        const chaptersData = json.data?.chapters || json.chapters || []
        return Array.isArray(chaptersData) ? chaptersData : []
    } catch (error) {
        console.error('[Manga] Failed to fetch chapters:', error)
        return []
    }
}

export default async function MangaDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    // Fetch all data in parallel for speed
    const [manga, characters, chapters] = await Promise.all([
        getManga(id),
        getCharacters(id),
        getChapters(id)
    ])

    if (!manga) {
        notFound()
    }

    return (
        <MangaDetailsClient 
            manga={manga} 
            characters={characters} 
            initialChapters={chapters} 
        />
    )
}
