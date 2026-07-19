'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Script from 'next/script';

export function AdController() {
  const pathname = usePathname();

  // Disable pop-under ads on auth and discovery pages
  const isAuthPage = pathname?.includes('/auth/login') || pathname?.includes('/auth/register');
  const isDiscoveryPage = pathname?.includes('/discovery');

  useEffect(() => {
    // If we navigate to a no-ad page, but ads are already loaded in memory (SPA navigation),
    // force a hard reload to completely clear them from the browser.
    if (isAuthPage || isDiscoveryPage) {
      const adScriptsExist = document.querySelector('script[src*="al5sm.com"]') || 
                             document.querySelector('script[src*="nap5k.com"]') || 
                             document.querySelector('script[src*="n6wxm.com"]');
      
      if (adScriptsExist) {
        window.location.reload();
      }
    }
  }, [isAuthPage, isDiscoveryPage]);

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
      
      {/* High-paying Vignette Ad */}
      <Script 
        src="https://n6wxm.com/vignette.min.js" 
        data-zone="11344751" 
        async 
        data-cfasync="false"
        strategy="afterInteractive"
      />
    </>
  );
}
