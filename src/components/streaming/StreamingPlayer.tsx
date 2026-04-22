'use client'

import { useState, useEffect, useRef } from 'react'
import Hls from 'hls.js'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StreamingPlayerProps {
    episodeId: string
    episodeNumber?: number | string
    poster?: string
    provider?: string
    malId?: number
}

type ServerType = 'hianime' | 'vidlink'

export function StreamingPlayer({ episodeId, episodeNumber, poster, provider, malId }: StreamingPlayerProps) {
    const [sources, setSources] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [retryCount, setRetryCount] = useState(0)
    const [activeServer, setActiveServer] = useState<ServerType>(provider === 'fallback' ? 'vidlink' : 'hianime')
    const videoRef = useRef<HTMLVideoElement>(null)
    const hlsRef = useRef<Hls | null>(null)

    useEffect(() => {
        // Reset state when episode or provider changes
        setSources(null)
        setActiveServer(provider === 'fallback' ? 'vidlink' : 'hianime')
    }, [episodeId, provider])

    useEffect(() => {
        // We always try to fetch sources from the backend first.
        // The backend is smart enough to resolve the MAL ID and return a VidLink URL
        // if HiAnime fails or if we are in fallback mode.
        if (!sources) {
            fetchSources()
        }
        
        // If we already have sources and we are in vidlink mode, but sources don't have a vidlink URL,
        // we can generate one from props as a last resort (but this should be rare now).
        if (activeServer === 'vidlink' && sources && !sources.iframeUrl) {
             setSources({
                ...sources,
                iframeUrl: `https://vidlink.pro/anime/${malId}/${episodeNumber}?primaryColor=6366f1`,
                provider: 'vidlink'
            })
        }
    }, [episodeId, activeServer, malId, episodeNumber])

    const fetchSources = async () => {
        try {
            setLoading(true)
            setError(null)

            console.log(`Fetching HiAnime sources for episode: ${episodeId}`)

            let queryParams = `?provider=hianime`
            if (malId) queryParams += `&malId=${malId}`
            if (episodeNumber) queryParams += `&ep=${episodeNumber}`

            const res = await fetch(`/api/streaming/watch/${encodeURIComponent(episodeId)}${queryParams}`)

            if (!res.ok) {
                console.warn('HiAnime sources failed, switching to VidLink')
                setActiveServer('vidlink')
                return
            }

            const data = await res.json()
            const sourcesData = data.data?.sources ? data.data : data

            if (sourcesData.provider === 'fallback' || !sourcesData.sources || sourcesData.sources.length === 0) {
                if (sourcesData.iframeUrl) {
                    setSources(sourcesData)
                    setActiveServer('vidlink')
                    setLoading(false)
                } else {
                    setActiveServer('vidlink')
                }
                return
            }

            setSources(sourcesData)
            setError(null)
        } catch (err: any) {
            console.error('Error fetching sources:', err)
            setActiveServer('vidlink')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (activeServer !== 'hianime' || !sources || !videoRef.current || sources.iframeUrl) return

        initializePlayer()

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy()
            }
        }
    }, [sources, activeServer])

    const initializePlayer = () => {
        if (!sources?.sources || !videoRef.current) return

        const videoSource = sources.sources.find((s: any) => s.quality === '1080p') ||
            sources.sources.find((s: any) => s.quality === '720p') ||
            sources.sources.find((s: any) => s.quality === 'default') ||
            sources.sources[0]

        if (!videoSource) {
            console.warn('No video source found, switching to VidLink')
            setActiveServer('vidlink')
            return
        }

        let videoUrl = videoSource.url
        setError(null)

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
                videoRef.current?.play().catch(console.error)
            })

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    if (retryCount < 2) {
                        setRetryCount(prev => prev + 1)
                        hls.destroy()
                        setTimeout(() => initializePlayer(), 1000)
                    } else {
                        setActiveServer('vidlink')
                    }
                }
            })

            hlsRef.current = hls
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
            videoRef.current.src = videoUrl
            videoRef.current.play().catch(console.error)
        } else {
            videoRef.current.src = videoUrl
            videoRef.current.play().catch(console.error)
        }
    }

    const renderPlayer = () => {
        // PRIORITIZE VidLink: If activeServer is vidlink, we should wait for sources to be ready
        // so we can use the backend-resolved ID instead of guessing from props.
        if (activeServer === 'vidlink') {
            if (!sources?.iframeUrl) {
                return (
                    <div className="aspect-video bg-black/50 rounded-xl flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                            <p className="text-white/60 text-sm">Resolving high-reliability stream...</p>
                        </div>
                    </div>
                )
            }
            return (
                <div className="aspect-video bg-black rounded-xl overflow-hidden border border-white/10 relative">
                    <iframe
                        src={sources.iframeUrl}
                        className="w-full h-full"
                        allowFullScreen
                        allow="autoplay; encrypted-media"
                    />
                </div>
            )
        }

        if (loading) {
            return (
                <div className="aspect-video bg-black/50 rounded-xl flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                        <p className="text-white/60 text-sm">Loading {activeServer} player...</p>
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
                        <div className="flex gap-2">
                            <Button onClick={fetchSources} variant="outline" className="gap-2">
                                <RefreshCw className="w-4 h-4" /> Retry
                            </Button>
                            <Button onClick={() => setActiveServer('vidlink')} variant="secondary">
                                Switch to VidLink
                            </Button>
                        </div>
                    </div>
                </div>
            )
        }

        if (sources?.iframeUrl) {
            return (
                <div className="aspect-video bg-black rounded-xl overflow-hidden border border-white/10 relative">
                    <iframe
                        src={sources.iframeUrl}
                        className="w-full h-full"
                        allowFullScreen
                        allow="autoplay; encrypted-media"
                    />
                </div>
            )
        }

        return (
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
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

    return (
        <div className="space-y-4">
            {/* Server Selection */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-white/60 mr-2">Servers:</span>
                <Button
                    size="sm"
                    variant={activeServer === 'hianime' ? 'default' : 'outline'}
                    onClick={() => setActiveServer('hianime')}
                    className={cn(
                        "text-xs h-8 px-3",
                        activeServer === 'hianime' ? "bg-indigo-600 hover:bg-indigo-700" : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                    )}
                >
                    HiAnime (Native)
                </Button>
                <Button
                    size="sm"
                    variant={activeServer === 'vidlink' ? 'default' : 'outline'}
                    onClick={() => setActiveServer('vidlink')}
                    className={cn(
                        "text-xs h-8 px-3",
                        activeServer === 'vidlink' ? "bg-indigo-600 hover:bg-indigo-700" : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                    )}
                >
                    VidLink (Stable)
                </Button>
            </div>

            {/* Video Container */}
            <div className="relative group">
                {renderPlayer()}
                
                {/* Server Badge Overlay */}
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="px-3 py-1 bg-black/80 backdrop-blur-md rounded-full text-[10px] uppercase font-bold tracking-wider text-indigo-400 border border-indigo-500/30">
                        {activeServer === 'vidlink' ? 'High Reliability' : 'High Speed'}
                    </div>
                </div>
            </div>
        </div>
    )
}
