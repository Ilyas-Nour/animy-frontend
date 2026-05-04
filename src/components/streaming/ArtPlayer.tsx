'use client'

import { useEffect, useRef } from 'react'
import Artplayer from 'artplayer'
import Hls from 'hls.js'

interface ArtPlayerProps {
  url: string
  poster?: string
  className?: string
  subtitles?: Array<{ url: string; lang: string; label: string }>
  onEnded?: () => void
  onReady?: (art: Artplayer) => void
}

export default function ArtPlayer({ url, poster, className, subtitles, onEnded, onReady }: ArtPlayerProps) {
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
      autoplay: true, // Auto-Play enabled
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
      theme: '#6366f1',
      subtitle: {
        url: subtitles?.[0]?.url || '',
        type: 'vtt',
        style: {
          color: '#fff',
          fontSize: '20px',
        },
        encoding: 'utf-8',
      },
      settings: [
        {
          html: 'Subtitles',
          tooltip: subtitles?.[0]?.label || 'Off',
          selector: [
            { html: 'Off', url: '' },
            ...(subtitles || []).map(s => ({
              html: s.label,
              url: s.url,
            })),
          ],
          onSelect: function (item) {
            art.subtitle.url = item.url;
            return item.html;
          },
        },
      ],
      customType: {
        m3u8: function (video: HTMLMediaElement, url: string, art: Artplayer) {
          if (Hls.isSupported()) {
            const hls = new Hls({
              maxBufferLength: 30,
              enableWorker: true,
              capLevelToPlayerSize: true,
            })
            hls.loadSource(url)
            hls.attachMedia(video)
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              video.play().catch(() => {})
            })
            art.on('destroy', () => hls.destroy())
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url
          }
        },
      },
    })

    // Auto-Next Logic
    art.on('video:ended', () => {
      if (onEnded) onEnded();
    })

    if (onReady) {
      onReady(art)
    }

    return () => {
      if (art && art.destroy) {
        art.destroy(false)
      }
    }
  }, [url, poster, subtitles])

  return <div ref={artRef} className={className}></div>
}
