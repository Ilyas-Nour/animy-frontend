export const runtime = 'edge';
import { Manga } from '@/types/manga'
import { notFound } from 'next/navigation'
import MangaDetailsClient from '@/components/manga/MangaDetailsClient'






export const revalidate = 3600 // ISR: 1 hour

const JIKAN_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

async function getManga(id: string) {
    try {
        const res = await fetch(`${JIKAN_API}/manga/${id}/full`, {
            next: { revalidate: 3600 }
        })
        if (!res.ok) return null
        const json = await res.json()
        return json.data as Manga
    } catch (error) {
        return null
    }
}

async function getCharacters(id: string) {
    try {
        const res = await fetch(`${JIKAN_API}/manga/${id}/characters`, {
            next: { revalidate: 3600 }
        })
        if (!res.ok) return []
        const json = await res.json()
        // API Route returns { data: [...] }
        return Array.isArray(json.data) ? json.data : []
    } catch (error) {
        return []
    }
}

async function getChapters(id: string) {
    try {
        const res = await fetch(`${JIKAN_API}/manga/${id}/read-chapters`, {
            next: { revalidate: 3600 }
        })
        if (!res.ok) return []
        const json = await res.json()
        const chaptersData = json.data?.chapters || json.chapters
        return Array.isArray(chaptersData) ? chaptersData : []
    } catch (error) {
        return []
    }
}

export default async function MangaDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [manga, characters] = await Promise.all([
        getManga(id),
        getCharacters(id)
    ])

    if (!manga) {
        notFound()
    }

    return (
        <MangaDetailsClient manga={manga} characters={characters} />
    )
}
