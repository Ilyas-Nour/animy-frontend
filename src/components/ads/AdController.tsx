'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';

export function AdController() {
  const pathname = usePathname();

  // Disable pop-under ads on auth and discovery pages
  const isAuthPage = pathname?.includes('/auth/login') || pathname?.includes('/auth/register');
  const isDiscoveryPage = pathname?.includes('/discovery');

  if (isAuthPage || isDiscoveryPage) {
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
