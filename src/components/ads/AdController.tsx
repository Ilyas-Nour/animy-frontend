'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';

export function AdController() {
  const pathname = usePathname();

  // Disable pop-under ads entirely on the manga reader and anime watch pages
  // to prevent interrupting the user experience when scrolling or interacting with the player
  const isReadingManga = pathname?.includes('/manga/read');
  const isWatchingAnime = pathname?.includes('/watch') || pathname?.includes('/anime/watch');

  if (isReadingManga || isWatchingAnime) {
    return null;
  }

  return (
    <>
      {/* Global Monetag Scripts */}
      <Script 
        src="https://al5sm.com/tag.min.js" 
        data-zone="11344223" 
        async 
        data-cfasync="false"
        strategy="afterInteractive"
      />
      <Script 
        src="https://al5sm.com/tag.min.js" 
        data-zone="11343530" 
        async 
        data-cfasync="false"
        strategy="afterInteractive"
      />
      <Script 
        src="https://nap5k.com/tag.min.js" 
        data-zone="11344161" 
        async 
        data-cfasync="false"
        strategy="afterInteractive"
      />
    </>
  );
}
