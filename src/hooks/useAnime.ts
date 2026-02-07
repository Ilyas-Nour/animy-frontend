import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { Anime, AnimeSearchResponse } from '@/types/anime'

export function useAnime(id?: number) {
  const [anime, setAnime] = useState<Anime | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchAnime = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/anime/${id}`)
        setAnime(response.data.data)
        setError(null)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch anime')
      } finally {
        setLoading(false)
      }
    }

    fetchAnime()
  }, [id])

  return { anime, loading, error }
}

export function useAnimeSearch(query: string) {
  const [results, setResults] = useState<Anime[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }

    const searchAnime = async () => {
      try {
        setLoading(true)
        const response = await api.get<{ data: AnimeSearchResponse }>(
          '/anime/search',
          { params: { query } }
        )
        setResults(response.data.data.data)
        setError(null)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Search failed')
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchAnime, 500)
    return () => clearTimeout(debounceTimer)
  }, [query])

  return { results, loading, error }
}