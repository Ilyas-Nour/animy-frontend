'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Script from 'next/script';

// Obfuscate ad domains so adblockers don't block the entire layout chunk!
const atobSafe = (str: string) => typeof window !== 'undefined' ? atob(str) : Buffer.from(str, 'base64').toString('ascii');

const D1 = atobSafe('YWw1c20uY29t'); // al5sm.com
const D2 = atobSafe('bmFwNWsuY29t'); // nap5k.com
const D3 = atobSafe('bjZ3eG0uY29t'); // n6wxm.com

export function AdController() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Disable pop-under ads on auth and discovery pages
  const isAuthPage = pathname?.includes('/auth/login') || pathname?.includes('/auth/register');
  const isDiscoveryPage = pathname?.includes('/discovery');

  useEffect(() => {
    setMounted(true);
    // If we navigate to a no-ad page, but ads are already loaded in memory (SPA navigation),
    // force a hard reload to completely clear them from the browser.
    if (isAuthPage || isDiscoveryPage) {
      const adScriptsExist = document.querySelector(`script[src*="${D1}"]`) || 
                             document.querySelector(`script[src*="${D2}"]`) || 
                             document.querySelector(`script[src*="${D3}"]`);
      
      if (adScriptsExist) {
        window.location.reload();
      }
    }
  }, [isAuthPage, isDiscoveryPage]);

  if (isAuthPage || isDiscoveryPage || !mounted) {
    return null;
  }

  return (
    <>
      {/* Global Monetag Scripts */}
      <Script 
        src={`https://${D1}/tag.min.js`}
        data-zone="11344223" 
        async 
        data-cfasync="false"
        strategy="afterInteractive"
      />
      <Script 
        src={`https://${D1}/tag.min.js`}
        data-zone="11343530" 
        async 
        data-cfasync="false"
        strategy="afterInteractive"
      />
      <Script 
        src={`https://${D2}/tag.min.js`}
        data-zone="11344161" 
        async 
        data-cfasync="false"
        strategy="afterInteractive"
      />
      
      {/* High-paying Vignette Ad */}
      <Script 
        src={`https://${D3}/vignette.min.js`}
        data-zone="11344751" 
        async 
        data-cfasync="false"
        strategy="afterInteractive"
      />
    </>
  );
}
