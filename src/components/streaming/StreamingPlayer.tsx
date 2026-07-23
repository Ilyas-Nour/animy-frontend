'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
    const [activeServer, setActiveServer] = useState<any>(null)
    const [availableServers, setAvailableServers] = useState<any[]>([])
    const videoRef = useRef<HTMLVideoElement>(null)
    const hlsRef = useRef<Hls | null>(null)

    const fetchSources = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            let queryParams = `?provider=hianime`
            if (malId) queryParams += `&malId=${malId}`
            if (episodeNumber) queryParams += `&ep=${episodeNumber}`

            const res = await fetch(`/api/streaming/watch/${encodeURIComponent(episodeId)}${queryParams}`)

            if (!res.ok) {
                setError('Failed to fetch streaming signals')
                return
            }

            const data = await res.json()
            const sourcesData = data.data?.sources ? data.data : data
            
            setSources(sourcesData)
            
            if (sourcesData.servers && sourcesData.servers.length > 0) {
                setAvailableServers(sourcesData.servers)
                // Set first native server as default if available, otherwise first server
                const defaultServer = sourcesData.servers.find((s: any) => s.isNative) || sourcesData.servers[0]
                setActiveServer(defaultServer)
            }
        } catch (err: any) {
            console.error('Error fetching sources:', err)
            setError('Synchronization lost. Signal failed.')
        } finally {
            setLoading(false)
        }
    }, [episodeId, episodeNumber, malId])

    const handleServerFailover = useCallback(() => {
        if (!activeServer || availableServers.length <= 1) {
            setError('All streaming nodes offline.')
            return
        }
        const currentIndex = availableServers.findIndex(s => s.name === activeServer.name)
        const nextIndex = (currentIndex + 1) % availableServers.length
        
        if (nextIndex === 0) {
            setError('All streaming nodes offline.')
            return
        }
        
        setActiveServer(availableServers[nextIndex])
        setRetryCount(0)
        setError(null)
    }, [activeServer, availableServers])

    const initializePlayer = useCallback(() => {
        if (!activeServer || !activeServer.isNative || !videoRef.current) return

        const videoSource = activeServer.sources?.find((s: any) => s.quality === '1080p') ||
            activeServer.sources?.find((s: any) => s.quality === '720p') ||
            activeServer.sources?.find((s: any) => s.quality === 'default') ||
            activeServer.sources?.[0]

        let videoUrl = videoSource ? videoSource.url : activeServer.url
        if (!videoUrl) return

        setError(null)

        if (Hls.isSupported() && (videoUrl.includes('.m3u8') || videoSource?.isM3U8)) {
            if (hlsRef.current) hlsRef.current.destroy()

            const hls = new Hls({
                capLevelToPlayerSize: true,
                autoStartLoad: true,
                enableWorker: true,
                maxBufferLength: 120, // Buffer 2 minutes ahead
                maxMaxBufferLength: 600, // Allow up to 10 minutes if memory allows
                maxBufferSize: 60 * 1000 * 1000, // Allow 60MB RAM usage for buffering
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
                        hls.destroy()
                        handleServerFailover()
                    }
                }
            })

            hlsRef.current = hls
        } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
            videoRef.current.src = videoUrl
            videoRef.current.addEventListener('loadedmetadata', () => {
                videoRef.current?.play().catch(console.error)
            })
            videoRef.current.addEventListener('error', () => {
                handleServerFailover()
            })
        }
    }, [activeServer, retryCount, handleServerFailover])

    useEffect(() => {
        // Reset state when episode changes
        setSources(null)
        setAvailableServers([])
        setActiveServer(null)
    }, [episodeId])

    useEffect(() => {
        if (!sources) {
            fetchSources()
        }
    }, [episodeId, sources, fetchSources])

    useEffect(() => {
        if (!activeServer || !activeServer.isNative || !videoRef.current) return

        initializePlayer()

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy()
            }
        }
    }, [activeServer, initializePlayer])

    const renderPlayer = () => {
        if (loading) {
            return (
                <div className="aspect-video bg-black/50 rounded-xl flex items-center justify-center border border-white/5">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                        <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Scanning frequencies...</p>
                    </div>
                </div>
            )
        }

        if (error || !activeServer) {
            return (
                <div className="aspect-video bg-black/50 rounded-xl flex items-center justify-center border border-white/5">
                    <div className="flex flex-col items-center gap-4 text-center px-4">
                        <AlertCircle className="w-12 h-12 text-rose-500/50" />
                        <p className="text-white/40 text-xs font-bold uppercase tracking-tight">{error || 'No compatible server found'}</p>
                        <Button onClick={fetchSources} variant="outline" className="gap-2 border-white/10 hover:bg-white/5">
                            <RefreshCw className="w-4 h-4" /> Re-sync
                        </Button>
                    </div>
                </div>
            )
        }

        // Handle Iframe Servers (VidLink, Vidsrc, etc)
        if (!activeServer.isNative) {
            const iframeUrl = activeServer.url
            
            if (!iframeUrl) return null

            return (
                <div className="aspect-video bg-black rounded-xl overflow-hidden border border-white/10 relative shadow-2xl">
                    <iframe
                        src={iframeUrl}
                        className="w-full h-full"
                        allowFullScreen
                        allow="autoplay; encrypted-media"
                        referrerPolicy="no-referrer"
                    />
                </div>
            )
        }

        // Handle Native HLS (HiAnime)
        return (
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative border border-white/10 shadow-2xl">
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
        <div className="space-y-6">
            {/* Server Selection */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Transmission Nodes</span>
                    <div className="flex-1 h-px bg-white/5" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {availableServers.map((server, idx) => (
                        <Button
                            key={`${server.provider}-${idx}`}
                            size="sm"
                            variant={activeServer?.name === server.name ? 'default' : 'outline'}
                            onClick={() => setActiveServer(server)}
                            className={cn(
                                "text-[10px] h-9 px-4 font-black uppercase tracking-widest transition-all rounded-xl border",
                                activeServer?.name === server.name 
                                    ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20 scale-[1.02]" 
                                    : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            {server.name}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Video Container */}
            <div className="relative group">
                {renderPlayer()}
                
                {/* Server Badge Overlay */}
                {activeServer && (
                    <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="px-4 py-1.5 bg-black/80 backdrop-blur-xl rounded-full text-[9px] uppercase font-black tracking-[0.2em] text-indigo-400 border border-indigo-500/30 shadow-2xl">
                            {activeServer.isNative ? 'Direct Node' : 'Satellite Link'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
