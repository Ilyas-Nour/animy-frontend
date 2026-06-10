'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, Filter, X, Loader2, Star } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'

export function GlobalSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const formRef = useRef<HTMLFormElement>(null)
  
  const isManga = pathname.startsWith('/manga')
  const defaultPlaceholder = isManga ? 'Search manga' : 'Search anime'
  const targetRoute = isManga ? '/manga' : '/anime'

  const [query, setQuery] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const debouncedQuery = useDebounce(query, 400)

  // Handle URL sync
  useEffect(() => {
    if (pathname === targetRoute) {
      const q = searchParams.get('q')
      if (q && !query) {
        setQuery(q)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams, targetRoute])

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch suggestions
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    const fetchSuggestions = async () => {
      setIsLoading(true)
      try {
        const endpoint = isManga ? '/api/manga/search' : '/api/anime/search'
        const res = await fetch(`${endpoint}?q=${encodeURIComponent(debouncedQuery)}&limit=5`)
        if (res.ok) {
          const data = await res.json()
          setSuggestions(Array.isArray(data) ? data : data?.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch search suggestions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (showDropdown) {
      fetchSuggestions()
    }
  }, [debouncedQuery, isManga, showDropdown])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // User requested to NOT navigate on enter, just let them click suggestions.
  }

  const handleFilterClick = () => {
    router.push(targetRoute)
    setIsExpanded(false)
    setShowDropdown(false)
  }

  const handleSuggestionClick = (item: any) => {
    const path = isManga ? `/manga/${item.mal_id}` : `/anime/${item.mal_id}`
    router.push(path)
    setIsExpanded(false)
    setShowDropdown(false)
    setQuery('') // Clear after selection or keep it? User might want it cleared.
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
            onClick={() => {
              setIsExpanded(false)
              setShowDropdown(false)
            }}
          >
            <X className="w-6 h-6 text-foreground" />
          </button>
        )}
        
        <form 
          ref={formRef}
          onSubmit={handleSubmit} 
          className={cn(
            "relative flex flex-col w-11/12 md:w-full transition-all duration-300",
            isExpanded ? "scale-100" : "scale-95 md:scale-100"
          )}
        >
          <div className="relative flex items-center w-full bg-secondary/60 hover:bg-secondary focus-within:bg-secondary border border-transparent focus-within:border-primary/30 rounded-full transition-all duration-300 z-10">
            <Search className="absolute left-4 w-5 h-5 text-muted-foreground stroke-[2.5]" />
            <input
              type="text"
              placeholder={defaultPlaceholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
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
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && (query.trim().length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl overflow-hidden z-50">
              {isLoading ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : suggestions.length > 0 ? (
                <div className="flex flex-col max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                  {suggestions.map((item) => (
                    <button
                      key={item.mal_id}
                      type="button"
                      onClick={() => handleSuggestionClick(item)}
                      className="flex items-center gap-4 p-2 w-full text-left rounded-xl hover:bg-accent/50 transition-colors group"
                    >
                      <div className="relative w-12 h-16 rounded-md overflow-hidden shrink-0 bg-secondary">
                        <Image
                          src={item.images?.webp?.image_url || item.images?.jpg?.image_url || ''}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                          {item.title}
                        </span>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {item.score ? (
                            <div className="flex items-center gap-1 text-yellow-500 font-medium">
                              <Star className="w-3 h-3 fill-yellow-500" />
                              {item.score}
                            </div>
                          ) : null}
                          <span className="uppercase text-[10px] font-bold tracking-wider">{item.type}</span>
                          {(item.year || item.published?.from) ? (
                            <span>{item.year || new Date(item.published?.from).getFullYear()}</span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      router.push(`${targetRoute}?q=${encodeURIComponent(query.trim())}`)
                      setIsExpanded(false)
                      setShowDropdown(false)
                    }}
                    className="mt-2 w-full p-2.5 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/10 rounded-xl transition-colors"
                  >
                    View all results for &quot;{query}&quot;
                  </button>
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No results found for &quot;{query}&quot;
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </>
  )
}
