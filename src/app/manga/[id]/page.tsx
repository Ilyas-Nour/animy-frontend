import { Manga } from '@/types/manga'
import { notFound } from 'next/navigation'
import MangaDetailsClient from '@/components/manga/MangaDetailsClient'

export const revalidate = 3600 // ISR: 1 hour

async function getManga(id: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
    try {
        const res = await fetch(`${apiUrl}/manga/${id}`, {
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
    try {
        const res = await fetch(`${apiUrl}/manga/${id}/characters`, {
            next: { revalidate: 3600 }
        })
        if (!res.ok) return []
        const json = await res.json()
        return json.data || []
    } catch (error) {
        return []
    }
}

export default async function MangaDetailPage({ params }: { params: { id: string } }) {
    const manga = await getManga(params.id)
    const characters = await getCharacters(params.id)

    if (!manga) {
        notFound()
    }

    return (
        <MangaDetailsClient manga={manga} characters={characters} />
    )
}
