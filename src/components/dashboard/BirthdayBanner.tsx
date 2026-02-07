'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Cake } from 'lucide-react'
import api from '@/lib/api'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

interface BirthdayCharacter {
    mal_id: number
    name: string
    images: {
        webp: {
            image_url: string
        }
    }
}

export function BirthdayBanner() {
    const [characters, setCharacters] = useState<BirthdayCharacter[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchBirthdays = async () => {
            try {
                const res = await api.get('/characters/birthdays')
                const data = res.data.data || res.data
                setCharacters(Array.isArray(data) ? data : [])
            } catch (error) {
                console.error('Failed to fetch birthdays', error)
            } finally {
                setLoading(false)
            }
        }

        fetchBirthdays()
    }, [])

    if (loading) return null // Or skeleton
    if (characters.length === 0) return null

    return (
        <div className="rounded-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 p-6">
            <div className="flex items-center gap-2 mb-4">
                <Cake className="h-5 w-5 text-pink-500" />
                <h2 className="text-lg font-bold">Today&apos;s Birthdays</h2>
                <span className="text-xs text-muted-foreground ml-auto">{new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>
            </div>

            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex w-max space-x-4 pb-4">
                    {characters.map((char) => (
                        <Link key={char.mal_id} href={`/character/${char.mal_id}`} className="group relative">
                            <div className="relative h-16 w-16 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-pink-500 transition-all">
                                <Image
                                    src={char.images.webp.image_url}
                                    alt={char.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <p className="text-xs text-center mt-2 w-16 truncate text-muted-foreground group-hover:text-foreground transition-colors">
                                {char.name}
                            </p>
                        </Link>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    )
}
