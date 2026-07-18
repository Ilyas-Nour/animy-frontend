'use client'

import { useEffect, useRef } from 'react'

export function GlobalAds() {
  const initialized = useRef(false)

  useEffect(() => {
    // Only inject once per session to avoid React strict mode duplicate injections
    if (initialized.current) return
    initialized.current = true

    // Inject Monetag OnClick (Popunder)
    const script = document.createElement('script')
    script.dataset.zone = '11344223'
    script.src = 'https://al5sm.com/tag.min.js'
    script.async = true
    
    // Append to document body or head safely
    const target = document.body || document.documentElement
    if (target) {
      target.appendChild(script)
    }
    
    return () => {
      // Optional: cleanup if component unmounts, though usually we want ads to persist
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  return null
}
