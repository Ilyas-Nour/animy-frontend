'use client'

import { useState, useEffect, useRef } from 'react'
import Hls from 'hls.js'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StreamingPlayerProps {
    episodeId: string
    poster?: string
}

export function StreamingPlayer({ episodeId, poster }: StreamingPlayerProps) {
    const [sources, setSources] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [retryCount, setRetryCount] = useState(0)
    const videoRef = useRef<HTMLVideoElement>(null)
    const hlsRef = useRef<Hls | null>(null)

    useEffect(() => {
        fetchSources()
    }, [episodeId])

    const fetchSources = async () => {
        try {
            setLoading(true)
            setError(null)

            console.log(`Fetching streaming links for episode: ${episodeId}`)

            // Get streaming links via our API route (no CORS issues)
            const res = await fetch(`/api/streaming/watch/${encodeURIComponent(episodeId)}`)

            if (!res.ok) {
                throw new Error('Failed to load video sources')
            }

            const data = await res.json()

            if (!data.data?.sources && !data.sources) {
                // Try both wrapped and unwrapped to be safe
                throw new Error('No video sources structure found')
            }

            // Handle wrapped response from TransformInterceptor
            const sourcesData = data.data?.sources ? data.data : data

            if (!sourcesData.sources || sourcesData.sources.length === 0) {
                throw new Error('No video sources available')
            }

            console.log(`Found ${sourcesData.sources.length} sources`)
            setSources(sourcesData)

        } catch (err: any) {
            console.error('Error fetching sources:', err)
            setError(err.message || 'Failed to load video')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!sources || !videoRef.current) return

        initializePlayer()

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy()
            }
        }
    }, [sources])

    const initializePlayer = () => {
        if (!sources || !videoRef.current) return

        // Find best quality source
        const videoSource = sources.sources.find((s: any) => s.quality === '1080p') ||
            sources.sources.find((s: any) => s.quality === '720p') ||
            sources.sources.find((s: any) => s.quality === 'default') ||
            sources.sources[0]

        if (!videoSource) {
            setError('No valid video source found')
            return
        }

        let videoUrl = videoSource.url

        console.log(`Playing video from: ${videoUrl}`)

        // Setup HLS player
        if (Hls.isSupported() && (videoUrl.includes('.m3u8') || videoSource.isM3U8)) {
            if (hlsRef.current) {
                hlsRef.current.destroy()
            }

            const hls = new Hls({
                capLevelToPlayerSize: true,
                autoStartLoad: true,
                enableWorker: true,
                maxBufferLength: 30,
            })

            hls.loadSource(videoUrl)
            hls.attachMedia(videoRef.current)

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('HLS manifest parsed, starting playback')
                videoRef.current?.play().catch(console.error)
            })

            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS error:', data)
                if (data.fatal) {
                    if (retryCount < 2) {
                        setRetryCount(prev => prev + 1)
                        hls.destroy()
                        setTimeout(() => initializePlayer(), 1000)
                    } else {
                        setError('Video playback failed. Please try again.')
                    }
                }
            })

            hlsRef.current = hls
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari native HLS
            videoRef.current.src = videoUrl
            videoRef.current.play().catch(console.error)
        } else {
            // Direct video
            videoRef.current.src = videoUrl
            videoRef.current.play().catch(console.error)
        }
    }

    if (loading) {
        return (
            <div className="aspect-video bg-black/50 rounded-xl flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                    <p className="text-white/60 text-sm">Loading video...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="aspect-video bg-black/50 rounded-xl flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center px-4">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                    <p className="text-white/80">{error}</p>
                    <Button
                        onClick={() => {
                            setRetryCount(0)
                            fetchSources()
                        }}
                        variant="outline"
                        className="gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="aspect-video bg-black rounded-xl overflow-hidden">
            <video
                ref={videoRef}
                className="w-full h-full"
                controls
                poster={poster}
                playsInline
            />
        </div>
    )
}
