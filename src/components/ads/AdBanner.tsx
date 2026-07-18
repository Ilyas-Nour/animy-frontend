'use client'

export function AdBanner({ zoneId = "11344161", className = "" }: { zoneId?: string, className?: string }) {
  // In-Page Push ads are floating notifications, not inline banners.
  // We return null here to remove the empty dark boxes from the UI.
  // The actual push script is now injected globally in layout.tsx!
  return null;
}
