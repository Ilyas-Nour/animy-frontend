'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Manga, MangaSearchResponse } from '@/types/manga'
import { MangaGrid } from '@/components/manga/MangaGrid'
import { MangaSearch } from '@/components/manga/MangaSearch'
import { MangaFilter, MangaFilterState } from '@/components/manga/MangaFilter'
import { Pagination } from '@/components/common/Pagination'
import { Loading } from '@/components/common/Loading'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { BrandTitle } from '@/components/common/BrandTitle'

function MangaContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [manga, setManga] = useState<Manga[]>([])
    const [pagination, setPagination] = useState<MangaSearchResponse['pagination'] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const currentPage = parseInt(searchParams.get('page') || '1', 10)
    const query = searchParams.get('q') || ''

    useEffect(() => {
        const fetchManga = async () => {
            try {
                setLoading(true)
                const params: any = {
                    page: currentPage,
                    limit: 24,
                }

                if (query) params.query = query

                // Add filter params
                const filterParams = [
                    'type',
                    'status',
                    'rating',
                    'order_by',
                    'sort',
                ]
                filterParams.forEach((param) => {
                    const value = searchParams.get(param)
                    if (value) params[param] = value
                })

                // Use search endpoint if query exists, else use top endpoint (or just search with empty query if API supports it)
                // Jikan /manga endpoint supports filtering. My backend /manga/search calls jikan /manga
                const endpoint = '/manga/search'

                const response = await api.get(endpoint, { params })

                // Check if response has data property and drill down correctly
                // API Interceptor wraps response in 'data' object
                // Service returns { data: [], pagination: {} }
                const responseData = response.data.data

                if (responseData && Array.isArray(responseData.data)) {
                    setManga(responseData.data)
                    setPagination(responseData.pagination)
                } else {
                    // Fallback if structure is different (e.g. direct array or other wrapper)
                    setManga([])
                }

                setError(null)
            } catch (err: any) {
                console.error(err)
                console.error(err)
                let errorMessage = 'Failed to load manga'
                if (err.response?.data) {
                    const { message } = err.response.data
                    if (typeof message === 'string') {
                        errorMessage = message
                    } else if (Array.isArray(message)) {
                        errorMessage = message.join(', ')
                    } else if (typeof message === 'object') {
                        errorMessage = JSON.stringify(message)
                    }
                }
                setError(errorMessage)
            } finally {
                setLoading(false)
            }
        }

        fetchManga()
    }, [searchParams, currentPage, query])

    const handleSearch = (searchQuery: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (searchQuery) {
            params.set('q', searchQuery)
        } else {
            params.delete('q')
        }
        params.set('page', '1')
        router.push(`/manga?${params.toString()}`)
    }

    const handleFilterChange = (filters: MangaFilterState) => {
        const params = new URLSearchParams(searchParams.toString())
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                params.set(key, value)
            } else {
                params.delete(key)
            }
        })
        params.set('page', '1')
        router.push(`/manga?${params.toString()}`)
    }

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', page.toString())
        router.push(`/manga?${params.toString()}`)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div className="container py-12 space-y-8">
            <div className="space-y-4">
                <BrandTitle>Browse Manga</BrandTitle>
                <p className="text-muted-foreground">
                    Discover thousands of manga titles. Search, filter, and find your next favorite series.
                </p>
            </div>

            <div className="space-y-6">
                <MangaSearch onSearch={handleSearch} />
                <MangaFilter onFilterChange={handleFilterChange} />
            </div>

            {loading ? (
                <Loading />
            ) : error ? (
                <ErrorMessage message={error} />
            ) : (
                <>
                    <MangaGrid manga={manga} />
                    {pagination && pagination.last_visible_page > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={pagination.last_visible_page}
                            onPageChange={handlePageChange}
                        />
                    )}
                </>
            )}
        </div>
    )
}
export default function MangaPage() { return <Suspense fallback={<Loading />}><MangaContent /></Suspense> }
