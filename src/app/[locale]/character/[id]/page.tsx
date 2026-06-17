export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import type { Metadata } from 'next'
import { CharacterDetailsClient } from '@/components/characters/CharacterDetailsClient'
import { notFound } from 'next/navigation'

async function getCharacter(id: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1'
    try {
        const res = await fetch(`${apiUrl}/characters/${id}`)

        if (!res.ok) {
            if (res.status === 404) return null
            throw new Error('Failed to fetch character')
        }

        const json = await res.json()
        return json.data || json
    } catch (error) {
        console.error('Fetch error:', error)
        return null
    }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const character = await getCharacter(id)

    if (!character) {
        return {
            title: 'Character Not Found - Animy',
        }
    }

    return {
        title: `${character.name} - Animy`,
        description: character.about?.substring(0, 160).replace(/\n/g, ' ') || `Read about ${character.name}`,
        openGraph: {
            title: character.name,
            description: character.about?.substring(0, 160),
            images: [
                {
                    url: character.images?.jpg?.image_url || '',
                    width: 225,
                    height: 350
                }
            ],
            type: 'website',
        }
    }
}

export default async function CharacterDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const character = await getCharacter(id)

    if (!character) {
        notFound()
    }

    return <CharacterDetailsClient character={character} />
}
