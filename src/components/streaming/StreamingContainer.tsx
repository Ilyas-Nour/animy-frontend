'use client'

import { useState, useEffect } from 'react'
import { StreamingPlayer } from './StreamingPlayer'
import { EpisodeGrid } from './EpisodeGrid'
import { Loader2, AlertCircle, Wifi } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

interface StreamingContainerProps {
    animeTitle: string
    animeTitleEnglish?: string
    animePoster?: string
    malId: number
    totalEpisodes?: number
}

export function StreamingContainer({
    animeTitle,
    animeTitleEnglish,
    animePoster,
    malId,
    totalEpisodes = 0
}: StreamingContainerProps) {
    const [mounted, setMounted] = useState(false)
    const [animeData, setAnimeData] = useState<any>(null)
    const [selectedEpisode, setSelectedEpisode] = useState<any>(null)
    const [loading, setLoading] = useState(false) // Not blocking anymore
    const [error, setError] = useState<string | null>(null)
    const [isFallback, setIsFallback] = useState(true) // Start as fallback for speed

    useEffect(() => {
        setMounted(true)
        // Initialize immediately with metadata episodes
        const episodes = []
        const count = totalEpisodes > 0 ? totalEpisodes : 1
        for (let i = 1; i <= count; i++) {
            episodes.push({
                id: i.toString(),
                number: i,
                title: `Episode ${i}`
            })
        }
        const initialData = {
            provider: 'fallback',
            title: animeTitle,
            episodes: episodes
        }
        setAnimeData(initialData)
        setSelectedEpisode(episodes[0])
        
        // Then try to enrich in background
        enrichAnimeData(initialData)
    }, [totalEpisodes, animeTitle])

    const enrichAnimeData = async (initialData: any) => {
        try {
            setLoading(true)
            console.log(`Enriching data for "${animeTitle}" (MAL: ${malId})`)

            // Try to find the anime on provider for better episode titles/IDs
            let searchPayload;
            try {
                const searchRes = await api.get(`/streaming/find?title=${encodeURIComponent(animeTitle)}&titleEnglish=${encodeURIComponent(animeTitleEnglish || '')}&anilistId=${malId}`)
                searchPayload = searchRes.data.data || searchRes.data
            } catch (e) {
                searchPayload = []
            }

            const results = Array.isArray(searchPayload) ? searchPayload : (searchPayload.results || [])

            if (results.length > 0) {
                const animeId = results[0].id
                const infoRes = await api.get(`/streaming/anime/${encodeURIComponent(animeId)}`)
                const animeInfo = infoRes.data.data || infoRes.data

                if (animeInfo.episodes && animeInfo.episodes.length > 0) {
                    setAnimeData(animeInfo)
                    setIsFallback(false)
                    // Update selected episode if it's the first one and we haven't changed it
                    if (selectedEpisode && selectedEpisode.id === '1') {
                        setSelectedEpisode(animeInfo.episodes[0])
                    }
                }
            }
        } catch (err: any) {
            console.warn('Enrichment failed:', err)
            // Keep using initialData, it's fine
        } finally {
            setLoading(false)
        }
    }

    const fetchAnimeData = () => {
        // Manual retry if needed
        if (animeData) enrichAnimeData(animeData)
    }

    if (!mounted) {
        return (
            <div className="w-full py-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        )
    }

    if (error || !animeData) {
        return (
            <div className="w-full py-12">
                <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <AlertCircle className="w-16 h-16 text-red-500" />
                    <div className="max-w-md">
                        <p className="text-white/80 mb-2 font-bold">Streaming Unavailable</p>
                        <p className="text-white/60 text-sm mb-6">{error}</p>
                        <Button
                            onClick={fetchAnimeData}
                            variant="outline"
                            className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
                        >
                            Retry Connection
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Status Indicator */}
            <div className={cn(
                "flex items-center gap-2 text-sm px-4 py-2 rounded-lg border",
                isFallback 
                    ? "text-amber-400 bg-amber-500/10 border-amber-500/20" 
                    : "text-green-400 bg-green-500/10 border-green-500/20"
            )}>
                <Wifi className="w-4 h-4" />
                <span>{isFallback ? 'High Reliability Mode (VidLink)' : 'Connected to Primary Stream Nodes'}</span>
            </div>

            {/* Video Player */}
            {selectedEpisode && (
                <StreamingPlayer
                    episodeId={selectedEpisode.id}
                    episodeNumber={selectedEpisode.number}
                    poster={animePoster}
                    provider={animeData.provider}
                    malId={malId}
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
