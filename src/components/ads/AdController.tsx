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
  const isAuthPage = pathname?.includes('/auth/') || pathname?.endsWith('/login') || pathname?.endsWith('/register');
  const isDiscoveryPage = pathname?.includes('/discovery');

  useEffect(() => {
    setMounted(true);
    // If we navigate to a no-ad page, safely clean up any ad scripts and iframes
    // without triggering a disruptive hard window reload.
    if (isAuthPage || isDiscoveryPage) {
      try {
        const adElements = document.querySelectorAll(
          `script[src*="${D1}"], script[src*="${D2}"], script[src*="${D3}"], iframe[src*="${D1}"], iframe[src*="${D2}"], iframe[src*="${D3}"]`
        );
        adElements.forEach((el) => el.remove());
      } catch (e) {
        // Safe fallback if DOM query fails
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
