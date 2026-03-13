'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export default function MangaReaderPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()
    const chapterId = params.chapterId as string
    const mangaId = searchParams.get('mangaId')

    const [pages, setPages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showNav, setShowNav] = useState(true)
    const [readingMode, setReadingMode] = useState<'vertical' | 'horizontal'>('vertical')
    const [currentPage, setCurrentPage] = useState(0)

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
                const res = await api.get(`/manga/read/${chapterId}`)
                if (res.data?.pages?.length > 0) {
                    setPages(res.data.pages)
                } else if (res.data?.length > 0) {
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
        if (chapterId) fetchPages()
    }, [chapterId])

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

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 fixed inset-0 z-[100] overflow-y-auto">
            {/* Top Navigation */}
            <AnimatePresence>
                {showNav && (
                    <motion.div
                        initial={{ y: '-100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 p-4"
                    >
                        <div className="max-w-4xl mx-auto flex items-center justify-between">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => mangaId ? router.push(`/manga/${mangaId}`) : router.back()}
                                className="hover:bg-white/10 text-muted-foreground hover:text-white rounded-xl"
                            >
                                <ArrowLeft className="h-5 w-5 mr-2" />
                                Back
                            </Button>
                            
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setReadingMode(m => m === 'vertical' ? 'horizontal' : 'vertical')}
                                    className="bg-white/5 hover:bg-white/10 border-white/10 rounded-xl px-4 font-bold"
                                >
                                    {readingMode === 'vertical' ? 'Scroll Mode' : 'Page Mode'}
                                </Button>
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
                    // Vertical Scroll Mode
                    <div className="max-w-3xl w-full flex flex-col items-center">
                        {pages.map((page, i) => (
                            <div key={i} className="relative w-full min-h-[500px] flex items-center justify-center bg-white/5 mb-1 animate-in fade-in duration-700">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={page.img || page.url || page}
                                    alt={`Page ${page.page || i + 1}`}
                                    className="w-full h-auto object-contain"
                                    loading={i < 3 ? "eager" : "lazy"}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    // Horizontal Single Page Mode
                    <div className="relative w-full h-full flex items-center justify-center bg-black">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
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
