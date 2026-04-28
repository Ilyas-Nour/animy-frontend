export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import type { Metadata } from 'next'
import { PersonDetailsClient } from '@/components/people/PersonDetailsClient'
import { notFound } from 'next/navigation'

async function getPerson(id: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1'
    try {
        const res = await fetch(`${apiUrl}/people/${id}`)

        if (!res.ok) {
            if (res.status === 404) return null
            throw new Error('Failed to fetch person')
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
    const person = await getPerson(id)

    if (!person) {
        return {
            title: 'Person Not Found - Animy',
        }
    }

    return {
        title: `${person.name.full} - Animy`,
        description: person.description?.substring(0, 160).replace(/\n/g, ' ') || `Read about ${person.name.full}`,
        openGraph: {
            title: person.name.full,
            description: person.description?.substring(0, 160),
            images: [
                {
                    url: person.image?.large || '',
                    width: 225,
                    height: 350
                }
            ],
            type: 'website',
        }
    }
}

export default async function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const person = await getPerson(id)

    if (!person) {
        notFound()
    }

    return <PersonDetailsClient person={person} />
}
