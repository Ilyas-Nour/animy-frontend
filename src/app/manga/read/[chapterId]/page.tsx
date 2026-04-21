'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

function MangaReaderContent() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()
    const chapterId = params.chapterId as string
    const mangaId = searchParams.get('mangaId')

    const [pages, setPages] = useState<any[]>([])
    const [chapters, setChapters] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [fetchingChapters, setFetchingChapters] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showNav, setShowNav] = useState(true)
    const [readingMode, setReadingMode] = useState<'vertical' | 'horizontal'>('vertical')
    const [currentPage, setCurrentPage] = useState(0)
    const [selectedChapter, setSelectedChapter] = useState<string>(chapterId)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Reset current page when chapter changes
    useEffect(() => {
        setCurrentPage(0)
        setSelectedChapter(chapterId)
        window.scrollTo(0, 0)
    }, [chapterId])

    useEffect(() => {
        let lastScrollY = window.scrollY
        const handleScroll = () => {
            if (readingMode !== 'vertical') return
            const currentScrollY = window.scrollY
            if (currentScrollY > lastScrollY + 10) {
                setShowNav(false)
            } else if (currentScrollY < lastScrollY - 10) {
                setShowNav(true)
            }
            lastScrollY = currentScrollY
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [readingMode])

    useEffect(() => {
        const fetchPages = async () => {
            try {
                setLoading(true)
                const timestamp = new Date().getTime()
                const res = await api.get(`/manga/read/${chapterId}?t=${timestamp}`)
                if (res.data?.pages?.length > 0) {
                    setPages(res.data.pages)
                } else if (Array.isArray(res.data) && res.data.length > 0) {
                    setPages(res.data) 
                } else {
                    setError('No pages found for this chapter.')
                }
            } catch (err) {
                console.error(err)
                setError('Failed to load chapter pages. The provider might be unavailable.')
            } finally {
                setLoading(false)
            }
        }

        const fetchChapters = async () => {
            if (!mangaId) return
            try {
                setFetchingChapters(true)
                const timestamp = new Date().getTime()
                const res = await api.get(`/manga/${mangaId}/read-chapters?t=${timestamp}`)
                if (res.data?.chapters) {
                    setChapters(res.data.chapters)
                }
            } catch (err) {
                console.error('Failed to fetch chapters:', err)
            } finally {
                setFetchingChapters(false)
            }
        }

        if (isMounted) {
            if (chapterId) fetchPages()
            if (mangaId && chapters.length === 0) fetchChapters()
        }
    }, [chapterId, mangaId, chapters.length, isMounted])

    const nextChapter = () => {
        const currentIndex = chapters.findIndex(c => c.id === chapterId)
        if (currentIndex > 0) {
            const nextId = chapters[currentIndex - 1].id
            router.push(`/manga/read/${nextId}?mangaId=${mangaId}`)
        }
    }

    const prevChapter = () => {
        const currentIndex = chapters.findIndex(c => c.id === chapterId)
        if (currentIndex !== -1 && currentIndex < chapters.length - 1) {
            const prevId = chapters[currentIndex + 1].id
            router.push(`/manga/read/${prevId}?mangaId=${mangaId}`)
        }
    }

    const toggleNav = () => setShowNav(!showNav)

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white fixed inset-0 z-[100]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="font-medium animate-pulse text-muted-foreground tracking-widest uppercase text-xs">Loading Scrolls...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white px-4 text-center fixed inset-0 z-[100]">
                <div className="bg-red-500/5 border border-red-500/10 p-8 rounded-3xl max-w-md shadow-2xl backdrop-blur-xl">
                    <h2 className="text-2xl font-black text-red-500 mb-2">Failed to Load</h2>
                    <p className="text-muted-foreground mb-8 text-sm">{error}</p>
                    <Button onClick={() => mangaId ? router.push(`/manga/${mangaId}`) : router.back()} variant="outline" className="w-full h-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 font-bold">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Return to Manga
                    </Button>
                </div>
            </div>
        )
    }

    if (!isMounted) return null

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 fixed inset-0 z-[100] overflow-y-auto">
            {/* Top Navigation */}
            <AnimatePresence>
                {showNav && (
                    <motion.div
                        initial={{ y: '-100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '-100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 right-0 z-[60] bg-black/40 backdrop-blur-3xl border-b border-white/5 px-4 py-3"
                    >
                        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => mangaId ? router.push(`/manga/${mangaId}`) : router.back()}
                                    className="hover:bg-white/10 text-muted-foreground hover:text-white rounded-xl transition-all"
                                >
                                    <ArrowLeft className="h-5 w-5 md:mr-2" />
                                    <span className="hidden md:inline">Back to Manga</span>
                                </Button>

                                <div className="h-4 w-[1px] bg-white/10 hidden md:block" />

                                {chapters.length > 0 && (
                                    <select
                                        value={chapterId}
                                        onChange={(e) => router.push(`/manga/read/${e.target.value}?mangaId=${mangaId}`)}
                                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary/50 max-w-[150px] md:max-w-[200px]"
                                    >
                                        {chapters.map((c) => (
                                            <option key={c.id} value={c.id} className="bg-[#111]">
                                                {c.title || `Chapter ${c.chapterNumber || ''}`}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setReadingMode('vertical')}
                                        className={cn(
                                            "rounded-lg px-3 h-8 text-[10px] uppercase tracking-widest font-black transition-all",
                                            readingMode === 'vertical' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
                                        )}
                                    >
                                        Scroll
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setReadingMode('horizontal')}
                                        className={cn(
                                            "rounded-lg px-3 h-8 text-[10px] uppercase tracking-widest font-black transition-all",
                                            readingMode === 'horizontal' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
                                        )}
                                    >
                                        Page
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reader Content */}
            <div 
                className={cn(
                    "w-full h-full min-h-screen flex",
                    readingMode === 'vertical' ? "flex-col items-center pt-20 pb-20" : "items-center justify-center overflow-hidden h-screen fixed inset-0"
                )}
                onClick={toggleNav}
            >
                {readingMode === 'vertical' ? (
                    <div className="max-w-3xl w-full flex flex-col items-center">
                        {pages.map((page, i) => (
                            <div key={i} className="relative w-full min-h-[500px] flex items-center justify-center bg-white/5 mb-1 animate-in fade-in duration-700 overflow-hidden">
                                <img
                                    src={page.img || page.url || page}
                                    alt={`Page ${page.page || i + 1}`}
                                    className="w-full h-auto object-contain z-10"
                                    loading={i < 3 ? "eager" : "lazy"}
                                />
                                <div className="absolute inset-0 flex items-center justify-center -z-0">
                                    <Loader2 className="h-8 w-8 animate-spin text-white/10" />
                                </div>
                            </div>
                        ))}

                        {/* End of Chapter Navigation */}
                        <div className="w-full py-20 px-4 flex flex-col items-center gap-8 border-t border-white/5 mt-10">
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-white/50 italic capitalize tracking-tighter">You&apos;ve reached the end of the scroll</h3>
                                <p className="text-sm text-muted-foreground font-medium">Continue your journey to the next chapter</p>
                            </div>
                            
                            <div className="flex items-center gap-4 w-full max-w-md">
                                <Button 
                                    variant="outline" 
                                    className="flex-1 h-16 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 font-black text-xs uppercase tracking-[0.2em]"
                                    onClick={prevChapter}
                                    disabled={chapters.findIndex(c => c.id === chapterId) === chapters.length - 1}
                                >
                                    Previous
                                </Button>
                                <Button 
                                    className="flex-[2] h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20"
                                    onClick={nextChapter}
                                    disabled={chapters.findIndex(c => c.id === chapterId) === 0}
                                >
                                    Next Chapter
                                </Button>
                            </div>
                            
                            <Button 
                                variant="ghost" 
                                onClick={() => router.push(`/manga/${mangaId}`)}
                                className="text-muted-foreground hover:text-white uppercase text-[10px] font-bold tracking-[0.3em]"
                            >
                                Back to Details
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Horizontal Single Page Mode
                    <div className="relative w-full h-full flex items-center justify-center bg-black">
                        <img
                            src={pages[currentPage]?.img || pages[currentPage]?.url || pages[currentPage]}
                            alt={`Page ${currentPage + 1}`}
                            className="max-w-full max-h-screen object-contain animate-in fade-in duration-300"
                            key={currentPage} 
                        />
                        
                        {/* Page Navigation Zones */}
                        <div 
                            className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer group" 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (currentPage > 0) setCurrentPage(p => p - 1);
                            }}
                        >
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-2 rounded-full">
                                <ChevronLeft className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <div 
                            className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer group" 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (currentPage < pages.length - 1) setCurrentPage(p => p + 1);
                            }}
                        >
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-2 rounded-full">
                                <ChevronRight className="h-8 w-8 text-white" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Bottom Progress Bar (Horizontal Mode) */}
            <AnimatePresence>
                {showNav && readingMode === 'horizontal' && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/5 p-4"
                    >
                        <div className="max-w-4xl mx-auto flex items-center justify-center gap-6">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 rounded-full hover:bg-white/10"
                                disabled={currentPage === 0}
                                onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p - 1) }}
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                            <div className="font-bold text-sm bg-white/10 px-4 py-2 rounded-xl">
                                {currentPage + 1} <span className="text-muted-foreground mx-1">/</span> {pages.length}
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 rounded-full hover:bg-white/10"
                                disabled={currentPage === pages.length - 1}
                                onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p + 1) }}
                            >
                                <ChevronRight className="h-6 w-6" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default function MangaReaderPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white fixed inset-0 z-[100]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="font-medium animate-pulse text-muted-foreground tracking-widest uppercase text-xs">Loading Scrolls...</p>
            </div>
        }>
            <MangaReaderContent />
        </Suspense>
    )
}
