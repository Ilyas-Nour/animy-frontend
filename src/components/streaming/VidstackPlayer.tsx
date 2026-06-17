import React from 'react';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { MediaPlayer, MediaProvider, Track } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';

interface Subtitle {
  url: string;
  lang: string;
  label: string;
}

interface VidstackPlayerProps {
  url: string;
  poster?: string;
  subtitles?: Subtitle[];
  onEnded?: () => void;
  className?: string;
  referer?: string;
}

export default function VidstackPlayer({
  url,
  poster,
  subtitles = [],
  onEnded,
  className,
  referer = 'https://hianime.to/',
}: VidstackPlayerProps) {
  
  // Construct the Cloudflare Edge proxy URL
  // If the URL is already an absolute proxy URL, we don't need to wrap it again.
  // But usually, it's just the raw URL.
  const proxyUrl = url.includes('/api/stream-proxy') 
    ? url 
    : `/api/stream-proxy?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(referer)}`;

  return (
    <div className={className}>
      <MediaPlayer
        title="Anime Stream"
        src={proxyUrl}
        crossOrigin="anonymous"
        onEnded={onEnded}
        playsInline
        aspectRatio="16/9"
        load="play"
        poster={poster}
      >
        <MediaProvider>
          {subtitles.map((sub, idx) => (
            <Track
              key={sub.url}
              src={sub.url}
              kind="subtitles"
              label={sub.label}
              lang={sub.lang}
              default={sub.label.toLowerCase().includes('english') || sub.lang === 'en'}
            />
          ))}
        </MediaProvider>
        <DefaultVideoLayout icons={defaultLayoutIcons} />
      </MediaPlayer>
    </div>
  );
}
