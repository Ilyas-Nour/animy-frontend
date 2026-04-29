'use client'

import { useEffect, useRef } from 'react'
import Artplayer from 'artplayer'
import Hls from 'hls.js'

interface ArtPlayerProps {
  url: string
  poster?: string
  className?: string
  headers?: Record<string, string>
  onReady?: (art: Artplayer) => void
}

export default function ArtPlayer({ url, poster, className, headers, onReady }: ArtPlayerProps) {
  const artRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!artRef.current) return

    const art = new Artplayer({
      container: artRef.current,
      url: url,
      poster: poster,
      volume: 0.7,
      isLive: false,
      muted: false,
      autoplay: false,
      pip: true,
      autoSize: true,
      autoMini: true,
      screenshot: true,
      setting: true,
      loop: false,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      airplay: true,
      theme: '#6366f1', // Indigo-500
      customType: {
        m3u8: function (video: HTMLMediaElement, url: string) {
          if (Hls.isSupported()) {
            const hls = new Hls({
              xhrSetup: function (xhr) {
                if (headers) {
                  Object.entries(headers).forEach(([key, value]) => {
                    // Filter out forbidden headers that cause CORS blocks in browser
                    const forbidden = ['user-agent', 'referer', 'origin', 'host', 'cookie'];
                    if (!forbidden.includes(key.toLowerCase())) {
                      xhr.setRequestHeader(key, value);
                    }
                  });
                }
              }
            })
            hls.loadSource(url)
            hls.attachMedia(video)
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url
          }
        },
      },
    })

    if (onReady) {
      onReady(art)
    }

    return () => {
      if (art && art.destroy) {
        art.destroy(false)
      }
    }
  }, [url, poster])

  return <div ref={artRef} className={className}></div>
}
