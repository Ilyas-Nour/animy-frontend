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
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isFallback, setIsFallback] = useState(false)

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
            setIsFallback(false)

            console.log(`Searching for "${animeTitle}" (MAL: ${malId})`)

            // Step 1: Use refined "find" endpoint for better matching
            let searchPayload;
            try {
                const searchRes = await api.get(`/streaming/find?title=${encodeURIComponent(animeTitle)}&titleEnglish=${encodeURIComponent(animeTitleEnglish || '')}&anilistId=${malId}`)
                searchPayload = searchRes.data.data || searchRes.data
            } catch (e) {
                console.warn('Streaming search failed, trying fallback mode')
                searchPayload = []
            }

            const results = Array.isArray(searchPayload) ? searchPayload : (searchPayload.results || [])

            if (results.length === 0) {
                // Fallback Mode: Generate episode list from metadata
                generateFallbackData()
                return
            }

            const animeId = results[0].id
            console.log(`Found anime ID: ${animeId}`)

            // Step 2: Get anime info with episodes
            try {
                const infoRes = await api.get(`/streaming/anime/${encodeURIComponent(animeId)}`)
                const animeInfo = infoRes.data.data || infoRes.data

                if (!animeInfo.episodes || animeInfo.episodes.length === 0) {
                    throw new Error('No episodes found')
                }

                setAnimeData(animeInfo)
                setSelectedEpisode(animeInfo.episodes[0])
            } catch (e) {
                console.warn('Anime info fetch failed, trying fallback mode')
                generateFallbackData()
            }

        } catch (err: any) {
            console.error('Error loading anime:', err)
            setError(err.message || 'Failed to load anime data')
        } finally {
            setLoading(false)
        }
    }

    const generateFallbackData = () => {
        console.log(`Generating fallback data for ${totalEpisodes} episodes`)
        const episodes = []
        const count = totalEpisodes > 0 ? totalEpisodes : 1; // At least one episode
        
        for (let i = 1; i <= count; i++) {
            episodes.push({
                id: i.toString(),
                number: i,
                title: `Episode ${i}`
            })
        }

        setAnimeData({
            provider: 'fallback',
            title: animeTitle,
            episodes: episodes
        })
        setSelectedEpisode(episodes[0])
        setIsFallback(true)
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
                    <p className="text-white/80">Connecting to streaming nodes...</p>
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
