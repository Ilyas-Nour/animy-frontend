import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (date: string | Date): string => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export const getSeasonYear = (): { season: string; year: number } => {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  let season = 'winter'
  if (month >= 3 && month <= 5) season = 'spring'
  else if (month >= 6 && month <= 8) season = 'summer'
  else if (month >= 9 && month <= 11) season = 'fall'

  return { season, year }
}

export const getAnimeScore = (score: number | null): string => {
  if (!score) return 'N/A'
  return score.toFixed(2)
}

export const getAnimeStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'Currently Airing': 'Airing',
    'Finished Airing': 'Completed',
    'Not yet aired': 'Upcoming',
  }
  return statusMap[status] || status
}



export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const getAvatarUrl = (url?: string | null) => {
  if (!url) return undefined
  if (url.startsWith('http') || url.startsWith('data:')) return url

  const cleanUrl = url.replace(/\\/g, '/')
  let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  // Strip /api/v1 suffix for static assets as they are served from root
  if (apiUrl.endsWith('/api/v1')) {
    apiUrl = apiUrl.replace('/api/v1', '')
  }

  // Remove trailing slash if present
  if (apiUrl.endsWith('/')) {
    apiUrl = apiUrl.slice(0, -1)
  }

  // Ensure we don't have double slashes
  const finalUrl = `${apiUrl}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`
  // console.log(`[getAvatarUrl] Resolved: ${url} -> ${finalUrl}`)
  return finalUrl
}

export const getInitials = (name?: string) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}