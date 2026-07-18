'use client'

import React, { useEffect, useRef } from 'react'

interface AdBannerProps {
  zoneId?: string;
  className?: string;
}

export function AdBanner({ zoneId = "11344161", className = "" }: AdBannerProps) {
  const adContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if the script is already appended to prevent duplicates in React strict mode
    if (adContainerRef.current && adContainerRef.current.children.length === 0) {
      const script = document.createElement('script')
      script.src = `https://nap5k.com/tag.min.js`
      script.async = true
      script.setAttribute('data-zone', zoneId)
      script.setAttribute('data-cfasync', 'false')
      
      adContainerRef.current.appendChild(script)
    }
  }, [zoneId])

  return (
    <div className={`w-full flex flex-col items-center justify-center my-8 ${className}`}>
      <div 
        className="w-full max-w-4xl min-h-[90px] md:min-h-[120px] bg-card/30 backdrop-blur-sm border border-white/5 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner relative"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-purple-500/5 z-0" />
        <div ref={adContainerRef} className="relative z-10 w-full flex justify-center" />
      </div>
    </div>
  )
}
