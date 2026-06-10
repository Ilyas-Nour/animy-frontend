'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function GlobalSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const isManga = pathname.startsWith('/manga')
  const defaultPlaceholder = isManga ? 'Search manga' : 'Search anime'
  const targetRoute = isManga ? '/manga' : '/anime'

  const [query, setQuery] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (pathname === targetRoute) {
      setQuery(searchParams.get('q') || '')
    } else {
      setQuery('')
    }
  }, [pathname, searchParams, targetRoute])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) {
      router.push(targetRoute)
      return
    }
    const params = new URLSearchParams()
    params.set('q', query.trim())
    router.push(`${targetRoute}?${params.toString()}`)
    setIsExpanded(false)
  }

  const handleFilterClick = () => {
    router.push(targetRoute)
    setIsExpanded(false)
  }

  return (
    <>
      {/* Mobile Expand Icon */}
      <div className="flex md:hidden items-center justify-center">
        <button 
          onClick={() => setIsExpanded(true)}
          className="p-2.5 rounded-full hover:bg-accent/50 transition-colors"
          aria-label="Open search"
        >
          <Search className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Expanded Overlay for Mobile / Static Bar for Desktop */}
      <div className={cn(
        "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:static md:bg-transparent md:backdrop-blur-none transition-all duration-300 flex items-start justify-center pt-24 md:pt-0 md:block md:flex-1 md:max-w-xl mx-auto xl:ml-8",
        isExpanded ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto"
      )}>
        {isExpanded && (
          <button 
            className="absolute top-6 right-6 md:hidden p-3 rounded-full hover:bg-accent/50 bg-background border"
            onClick={() => setIsExpanded(false)}
          >
            <X className="w-6 h-6 text-foreground" />
          </button>
        )}
        
        <form 
          onSubmit={handleSubmit} 
          className={cn(
            "relative flex items-center w-11/12 md:w-full bg-secondary/60 hover:bg-secondary focus-within:bg-secondary border border-transparent focus-within:border-primary/30 rounded-full transition-all duration-300",
            isExpanded ? "scale-100" : "scale-95 md:scale-100"
          )}
        >
          <Search className="absolute left-4 w-5 h-5 text-muted-foreground stroke-[2.5]" />
          <input
            type="text"
            placeholder={defaultPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none py-2.5 pl-12 pr-[100px] text-sm font-medium placeholder:text-muted-foreground/60 text-foreground"
            autoFocus={isExpanded}
          />
          <button 
            type="button"
            onClick={handleFilterClick}
            className="absolute right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-background/40 transition-colors group"
          >
            <Filter className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors fill-muted-foreground group-hover:fill-foreground" />
            <span className="text-[11px] font-black tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">FILTER</span>
          </button>
        </form>
      </div>
    </>
  )
}
