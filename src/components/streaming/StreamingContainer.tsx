'use client'

import { useState, useEffect } from 'react'
import { StreamingPlayer } from './StreamingPlayer'
import { EpisodeGrid } from './EpisodeGrid'
import { Loader2, AlertCircle, Wifi } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StreamingContainerProps {
    animeTitle: string
    animeTitleEnglish?: string
    animePoster?: string
    malId: number
}

export function StreamingContainer({
    animeTitle,
    animeTitleEnglish,
    animePoster,
    malId
}: StreamingContainerProps) {
    const [mounted, setMounted] = useState(false)
    const [animeData, setAnimeData] = useState<any>(null)
    const [selectedEpisode, setSelectedEpisode] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return
        fetchAnimeData()
    }, [mounted, animeTitle])

    const fetchAnimeData = async () => {
        try {
            setLoading(true)
            setError(null)

            console.log(`Searching for "${animeTitle}"`)

            // Step 1: Search for anime via our API route (no CORS issues)
            const searchRes = await fetch(`/api/streaming/search?query=${encodeURIComponent(animeTitle)}`)

            if (!searchRes.ok) {
                throw new Error('Failed to search anime')
            }

            const searchData = await searchRes.json()
            const results = searchData.results || []

            if (results.length === 0) {
                throw new Error(`"${animeTitle}" not found. Try a different title.`)
            }

            const animeId = results[0].id
            console.log(`Found anime ID: ${animeId}`)

            // Step 2: Get anime info with episodes via our API route
            const infoRes = await fetch(`/api/streaming/info/${animeId}`)

            if (!infoRes.ok) {
                throw new Error('Failed to load anime info')
            }

            const animeInfo = await infoRes.json()

            if (!animeInfo.episodes || animeInfo.episodes.length === 0) {
                throw new Error('No episodes found for this anime')
            }

            console.log(`Loaded ${animeInfo.episodes.length} episodes`)
            setAnimeData(animeInfo)
            setSelectedEpisode(animeInfo.episodes[0])

        } catch (err: any) {
            console.error('Error loading anime:', err)
            setError(err.message || 'Failed to load anime data')
        } finally {
            setLoading(false)
        }
    }

    if (!mounted) {
        return (
            <div className="w-full py-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        )
    }

    if (loading) {
        return (
            <div className="w-full py-12">
                <div className="flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-white/80">Loading from streaming servers...</p>
                </div>
            </div>
        )
    }

    if (error || !animeData) {
        return (
            <div className="w-full py-12">
                <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <AlertCircle className="w-16 h-16 text-red-500" />
                    <div className="max-w-md">
                        <p className="text-white/80 mb-2 font-bold">Failed to Load</p>
                        <p className="text-white/60 text-sm mb-6">{error}</p>
                        <Button
                            onClick={fetchAnimeData}
                            variant="outline"
                            className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
                        >
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Status Indicator */}
            <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20">
                <Wifi className="w-4 h-4" />
                <span>Connected to streaming servers</span>
            </div>

            {/* Video Player */}
            {selectedEpisode && (
                <StreamingPlayer
                    episodeId={selectedEpisode.id}
                    poster={animePoster}
                />
            )}

            {/* Episode List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">
                        Episodes ({animeData.episodes?.length || 0})
                    </h3>
                </div>

                <EpisodeGrid
                    episodes={animeData.episodes || []}
                    currentEpisode={selectedEpisode?.number}
                    onEpisodeSelect={setSelectedEpisode}
                    fallbackImage={animePoster}
                />
            </div>
        </div>
    )
}
