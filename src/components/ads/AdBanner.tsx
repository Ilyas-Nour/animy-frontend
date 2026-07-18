'use client'

export function AdBanner({ zoneId = "11344161", className = "" }: { zoneId?: string, className?: string }) {
  // In-Page Push ads are floating notifications, not inline banners.
  // We return a hidden div here to remove the empty dark boxes from the UI
  // without causing React.Children errors in Server Components.
  // The actual push script is now injected globally in layout.tsx!
  return <div style={{ display: 'none' }} aria-hidden="true" />;
}
