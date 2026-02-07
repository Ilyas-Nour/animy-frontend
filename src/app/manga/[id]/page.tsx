import { Manga } from '@/types/manga'
import { notFound } from 'next/navigation'
import MangaDetailsClient from '@/components/manga/MangaDetailsClient'

export const revalidate = 3600 // ISR: 1 hour

// Use absolute URL for server-side fetching
function getBaseUrl() {
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
    if (process.env.NEXT_PUBLIC_FRONTEND_URL) return process.env.NEXT_PUBLIC_FRONTEND_URL
    return 'http://localhost:3000'
}

async function getManga(id: string) {
    try {
        const baseUrl = getBaseUrl()
        const res = await fetch(`${baseUrl}/api/manga/${id}`, {
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
        const baseUrl = getBaseUrl()
        const res = await fetch(`${baseUrl}/api/manga/${id}/characters`, {
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
