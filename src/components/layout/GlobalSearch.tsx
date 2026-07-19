'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Loader2, Star, Tv, BookOpen } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'

interface SearchResult {
  mal_id: number
  title: string
  title_english?: string
  title_japanese?: string
  type?: string
  score?: number | null
  year?: number | null
  published?: { from?: string }
  images?: {
    jpg?: { image_url?: string }
    webp?: { image_url?: string }
  }
}

export function GlobalSearch() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const [query, setQuery] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [animeResults, setAnimeResults] = useState<SearchResult[]>([])
  const [mangaResults, setMangaResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const debouncedQuery = useDebounce(query, 350)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search both anime and manga in parallel using proven existing endpoints
  useEffect(() => {
    if (!debouncedQuery.trim() || !showDropdown) {
      setAnimeResults([])
      setMangaResults([])
      setIsLoading(false)
      return
    }

    const controller = new AbortController()

    const fetchResults = async () => {
      setIsLoading(true)
      try {
        const q = encodeURIComponent(debouncedQuery.trim())

        const [animeRes, mangaRes] = await Promise.allSettled([
          fetch(`/api/anime/search?q=${q}&limit=4`, { signal: controller.signal }),
          fetch(`/api/manga/search?q=${q}&limit=4`, { signal: controller.signal }),
        ])

        if (animeRes.status === 'fulfilled' && animeRes.value.ok) {
          const json = await animeRes.value.json()
          // Backend returns { data: [...], pagination: {...} }
          const items = json?.data || []
          setAnimeResults(Array.isArray(items) ? items.slice(0, 4) : [])
        } else {
          setAnimeResults([])
        }

        if (mangaRes.status === 'fulfilled' && mangaRes.value.ok) {
          const json = await mangaRes.value.json()
          const items = json?.data || []
          setMangaResults(Array.isArray(items) ? items.slice(0, 4) : [])
        } else {
          setMangaResults([])
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Search error:', error)
          setAnimeResults([])
          setMangaResults([])
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
    return () => controller.abort()
  }, [debouncedQuery, showDropdown])

  const handleSuggestionClick = (item: SearchResult, mediaType: 'anime' | 'manga') => {
    router.push(`/${mediaType}/${item.mal_id}`)
    setIsExpanded(false)
    setShowDropdown(false)
    setQuery('')
  }

  const handleViewAll = (type: 'anime' | 'manga') => {
    router.push(`/${type}?q=${encodeURIComponent(query.trim())}`)
    setIsExpanded(false)
    setShowDropdown(false)
  }

  const hasResults = animeResults.length > 0 || mangaResults.length > 0
  const showResults = showDropdown && query.trim().length > 0

  const getImageUrl = (item: SearchResult) =>
    item.images?.webp?.image_url || item.images?.jpg?.image_url || ''

  const getYear = (item: SearchResult): number | null => {
    if (item.year) return item.year
    if (item.published?.from) {
      const y = new Date(item.published.from).getFullYear()
      return isNaN(y) ? null : y
    }
    return null
  }

  return (
    <>
      {/* Mobile icon */}
      <div className="flex md:hidden items-center justify-center">
        <button
          onClick={() => setIsExpanded(true)}
          className="p-2.5 rounded-full hover:bg-accent/50 transition-colors"
          aria-label="Open search"
        >
          <Search className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Search overlay (mobile) / bar (desktop) */}
      <div className={cn(
        "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:static md:bg-transparent md:backdrop-blur-none transition-all duration-300 flex items-start justify-center pt-24 md:pt-0 md:block md:flex-1 md:max-w-xl mx-auto xl:ml-8",
        isExpanded ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto"
      )}>
        {isExpanded && (
          <button
            className="absolute top-6 right-6 md:hidden p-3 rounded-full hover:bg-accent/50 bg-background border"
            onClick={() => { setIsExpanded(false); setShowDropdown(false) }}
          >
            <X className="w-6 h-6 text-foreground" />
          </button>
        )}

        <form
          ref={formRef}
          onSubmit={(e) => e.preventDefault()}
          className={cn(
            "relative flex flex-col w-11/12 md:w-full transition-all duration-300",
            isExpanded ? "scale-100" : "scale-95 md:scale-100"
          )}
        >
          {/* Input */}
          <div className="relative flex items-center w-full bg-secondary/60 hover:bg-secondary focus-within:bg-secondary border border-transparent focus-within:border-primary/30 rounded-full transition-all duration-300 z-10">
            <Search className="absolute left-4 w-5 h-5 text-muted-foreground stroke-[2.5]" />
            <input
              type="text"
              placeholder="Search anime or manga..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowDropdown(true) }}
              onFocus={() => setShowDropdown(true)}
              className="w-full bg-transparent border-none outline-none py-2.5 pl-12 pr-10 text-sm font-medium placeholder:text-muted-foreground/60 text-foreground"
              autoFocus={isExpanded}
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setAnimeResults([]); setMangaResults([]) }}
                className="absolute right-4 p-1 rounded-full hover:bg-accent transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background/97 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl overflow-hidden z-50">
              {isLoading ? (
                <div className="flex items-center justify-center p-6 gap-3">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">Searching...</span>
                </div>
              ) : hasResults ? (
                <div className="flex flex-col max-h-[70vh] overflow-y-auto">
                  {/* Anime results */}
                  {animeResults.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between px-3 pt-3 pb-1">
                        <div className="flex items-center gap-1.5">
                          <Tv className="w-3.5 h-3.5 text-primary" />
                          <span className="text-[11px] font-black uppercase tracking-widest text-primary">Anime</span>
                        </div>
                        <button type="button" onClick={() => handleViewAll('anime')}
                          className="text-[10px] text-muted-foreground hover:text-primary transition-colors font-bold">
                          See all →
                        </button>
                      </div>
                      <div className="p-2 space-y-0.5">
                        {animeResults.map((item) => (
                          <ResultItem
                            key={`anime-${item.mal_id}`}
                            item={item}
                            mediaType="anime"
                            onClick={() => handleSuggestionClick(item, 'anime')}
                            getImageUrl={getImageUrl}
                            getYear={getYear}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {animeResults.length > 0 && mangaResults.length > 0 && (
                    <div className="mx-3 h-px bg-border/40" />
                  )}

                  {/* Manga results */}
                  {mangaResults.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between px-3 pt-3 pb-1">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                          <span className="text-[11px] font-black uppercase tracking-widest text-purple-500">Manga</span>
                        </div>
                        <button type="button" onClick={() => handleViewAll('manga')}
                          className="text-[10px] text-muted-foreground hover:text-purple-500 transition-colors font-bold">
                          See all →
                        </button>
                      </div>
                      <div className="p-2 space-y-0.5">
                        {mangaResults.map((item) => (
                          <ResultItem
                            key={`manga-${item.mal_id}`}
                            item={item}
                            mediaType="manga"
                            onClick={() => handleSuggestionClick(item, 'manga')}
                            getImageUrl={getImageUrl}
                            getYear={getYear}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="border-t border-border/30 p-2 flex gap-2">
                    <button type="button" onClick={() => handleViewAll('anime')}
                      className="flex-1 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/10 rounded-xl transition-colors">
                      All Anime Results
                    </button>
                    <div className="w-px bg-border/30" />
                    <button type="button" onClick={() => handleViewAll('manga')}
                      className="flex-1 py-2 text-xs font-bold uppercase tracking-wider text-purple-500 hover:bg-purple-500/10 rounded-xl transition-colors">
                      All Manga Results
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm font-semibold text-foreground">No results for &quot;{query}&quot;</p>
                  <p className="text-xs text-muted-foreground mt-1">Try a different title, Japanese name, or keyword</p>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </>
  )
}

function ResultItem({
  item, mediaType, onClick, getImageUrl, getYear,
}: {
  item: SearchResult
  mediaType: 'anime' | 'manga'
  onClick: () => void
  getImageUrl: (item: SearchResult) => string
  getYear: (item: SearchResult) => number | null
}) {
  const year = getYear(item)
  const imgUrl = getImageUrl(item)

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-2 w-full text-left rounded-xl hover:bg-accent/50 transition-colors group",
      )}
    >
      <div className="relative w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-secondary border border-border/30">
        {imgUrl ? (
          <Image src={imgUrl} alt={item.title} fill className="object-cover" sizes="40px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {mediaType === 'anime'
              ? <Tv className="w-4 h-4 text-muted-foreground/40" />
              : <BookOpen className="w-4 h-4 text-muted-foreground/40" />}
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <span className={cn(
          "text-sm font-bold truncate transition-colors",
          mediaType === 'anime' ? "group-hover:text-primary" : "group-hover:text-purple-500"
        )}>
          {item.title}
        </span>
        {item.title_english && item.title_english !== item.title && (
          <span className="text-[11px] text-muted-foreground truncate">{item.title_english}</span>
        )}
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          {item.score ? (
            <div className="flex items-center gap-1 text-yellow-500 font-semibold">
              <Star className="w-3 h-3 fill-yellow-500" />
              {item.score}
            </div>
          ) : null}
          {item.type && (
            <span className="uppercase text-[9px] font-black tracking-wider bg-secondary px-1.5 py-0.5 rounded">
              {item.type}
            </span>
          )}
          {year && <span>{year}</span>}
        </div>
      </div>
    </button>
  )
}
