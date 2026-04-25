'use client'

import React, { useState, useEffect, Suspense, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

// Optimized Manga Page Component with Virtualization
const MangaPage = ({ 
    page, 
    index, 
    readingMode, 
    isCurrentPage 
}: { 
    page: any, 
    index: number, 
    readingMode: 'vertical' | 'horizontal',
    isCurrentPage?: boolean
}) => {
    const [loaded, setLoaded] = useState(false)
    const [inView, setInView] = useState(false)
    const ref = React.useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (readingMode === 'horizontal') {
            if (isCurrentPage) setInView(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true)
                    observer.disconnect()
                }
            },
            { rootMargin: '1200px' } // Load images when within ~2 screens of viewport
        )

        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [readingMode, isCurrentPage])

    return (
        <div 
            ref={ref} 
            className={cn(
                "relative flex items-center justify-center bg-white/5 overflow-hidden transition-all duration-500",
                readingMode === 'vertical' ? "w-full min-h-[400px] mb-1" : "w-full h-full"
            )}
        >
            {(inView || isCurrentPage) && (
                <>
                    <img
                        src={page.img || page.url || page}
                        alt={`Page ${page.page || index + 1}`}
                        className={cn(
                            "w-full h-auto object-contain z-10 transition-all duration-700",
                            loaded ? "opacity-100 scale-100" : "opacity-0 scale-95",
                            readingMode === 'horizontal' && "max-h-full"
                        )}
                        onLoad={() => setLoaded(true)}
                        referrerPolicy="no-referrer"
                    />
                    {!loaded && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center -z-0 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/10">Loading Scroll {index + 1}</span>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

function MangaReaderContent() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()
    const chapterId = params.chapterId as string
    const mangaId = searchParams.get('mangaId')
    const mangaType = searchParams.get('type')
    const [pages, setPages] = useState<any[]>([])
    const [chapters, setChapters] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [fetchingChapters, setFetchingChapters] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showNav, setShowNav] = useState(true)
    
    // Initialize reading mode from localStorage or based on manga type
    const [readingMode, setReadingMode] = useState<'vertical' | 'horizontal'>('vertical')
    const [currentPage, setCurrentPage] = useState(0)
    const [selectedChapter, setSelectedChapter] = useState<string>(chapterId)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        
        // Set initial mode from localStorage or type
        const savedMode = localStorage.getItem('manga_reading_mode')
        if (savedMode === 'vertical' || savedMode === 'horizontal') {
            setReadingMode(savedMode as 'vertical' | 'horizontal')
        } else if (mangaType) {
            const lowerType = mangaType.toLowerCase()
            if (lowerType === 'manhwa' || lowerType === 'manhua' || lowerType === 'webtoon') {
                setReadingMode('vertical')
            }
        }
    }, [mangaType])

    // Save mode preference when it changes
    useEffect(() => {
        if (isMounted) {
            localStorage.setItem('manga_reading_mode', readingMode)
        }
    }, [readingMode, isMounted])

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
                // Use our internal proxy to bypass CORS and improve reliability
                const res = await fetch(`/api/proxy?url=/manga/read/${chapterId}&t=${timestamp}`)
                
                if (!res.ok) {
                    throw new Error(`Server returned ${res.status}`)
                }
                
                const json = await res.json()
                const pagesData = json.data?.pages || json.pages
                const rawData = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : [])
                
                if (pagesData && pagesData.length > 0) {
                    setPages(pagesData)
                } else if (rawData.length > 0) {
                    setPages(rawData) 
                } else {
                    setError('No pages found for this chapter.')
                }
            } catch (err) {
                console.error(err)
                setError('Failed to load chapter pages. The provider might be unavailable or the backend is crashing.')
            } finally {
                setLoading(false)
            }
        }

        const fetchChapters = async () => {
            if (!mangaId) return
            try {
                setFetchingChapters(true)
                const timestamp = new Date().getTime()
                const res = await fetch(`/api/proxy?url=/manga/${mangaId}/read-chapters&t=${timestamp}`)
                
                if (!res.ok) return

                const json = await res.json()
                const chaptersData = json.data?.chapters || json.chapters
                if (chaptersData) {
                    setChapters(chaptersData)
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

    const nextChapter = useCallback(() => {
        const currentIndex = chapters.findIndex(c => c.id === chapterId)
        if (currentIndex > 0) {
            const nextId = chapters[currentIndex - 1].id
            router.push(`/manga/read/${nextId}?mangaId=${mangaId}`)
        }
    }, [chapters, chapterId, mangaId, router])

    const prevChapter = useCallback(() => {
        const currentIndex = chapters.findIndex(c => c.id === chapterId)
        if (currentIndex !== -1 && currentIndex < chapters.length - 1) {
            const prevId = chapters[currentIndex + 1].id
            router.push(`/manga/read/${prevId}?mangaId=${mangaId}`)
        }
    }, [chapters, chapterId, mangaId, router])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Handle Escape key
            if (e.key === 'Escape') {
                if (mangaId) {
                    router.push(`/manga/${mangaId}`)
                } else {
                    router.back()
                }
                return
            }

            // Handle Arrow keys for paging (only in horizontal mode)
            if (readingMode === 'horizontal') {
                if (e.key === 'ArrowRight') {
                    if (currentPage < pages.length - 1) {
                        setCurrentPage(p => p + 1)
                    } else {
                        nextChapter()
                    }
                } else if (e.key === 'ArrowLeft') {
                    if (currentPage > 0) {
                        setCurrentPage(p => p - 1)
                    } else {
                        prevChapter()
                    }
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [readingMode, currentPage, pages.length, mangaId, router, nextChapter, prevChapter])

    const toggleNav = () => setShowNav(!showNav)

    if (loading && pages.length === 0) {
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
        <div className={cn(
            "min-h-screen bg-[#050505] text-white selection:bg-primary/30 fixed inset-0 z-[100]",
            readingMode === 'vertical' ? "overflow-y-auto" : "overflow-hidden"
        )}>
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
                            <MangaPage 
                                key={`${chapterId}-p${i}`}
                                page={page}
                                index={i}
                                readingMode="vertical"
                            />
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
                    <div className={cn(
                        "relative w-full h-full flex items-center justify-center bg-black transition-all duration-300",
                        showNav ? "py-16 px-4" : "p-2"
                    )}>
                        <MangaPage 
                            page={pages[currentPage]}
                            index={currentPage}
                            readingMode="horizontal"
                            isCurrentPage={true}
                        />
                        
                        {/* Page Navigation Zones */}
                        <div 
                            className="absolute left-0 top-0 bottom-0 w-1/4 cursor-pointer group z-10" 
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
                            className="absolute right-0 top-0 bottom-0 w-1/4 cursor-pointer group z-10" 
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

export default MangaReaderContent
