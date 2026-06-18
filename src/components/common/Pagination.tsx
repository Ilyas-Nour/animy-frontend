'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages: number[] = []
  const showPages = 5
  let startPage = Math.max(1, currentPage - Math.floor(showPages / 2))
  let endPage = Math.min(totalPages, startPage + showPages - 1)

  if (endPage - startPage + 1 < showPages) {
    startPage = Math.max(1, endPage - showPages + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  const btnBase =
    'flex items-center justify-center h-9 min-w-[36px] px-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border'

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10 flex-wrap">
      {/* First */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className={cn(
          btnBase,
          'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
        )}
        title="First page"
      >
        <ChevronsLeft className="h-3.5 w-3.5" />
      </button>

      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          btnBase,
          'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
        )}
        title="Previous page"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>

      {/* Ellipsis left */}
      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className={cn(btnBase, 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white')}
          >
            1
          </button>
          {startPage > 2 && (
            <span className="flex items-center justify-center h-9 px-1 text-white/20 text-sm select-none">…</span>
          )}
        </>
      )}

      {/* Page Numbers */}
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={cn(
            btnBase,
            page === currentPage
              ? 'bg-gradient-to-r from-purple-600 to-violet-600 border-purple-500/50 text-white shadow-[0_0_16px_rgba(139,92,246,0.4)]'
              : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
          )}
        >
          {page}
        </button>
      ))}

      {/* Ellipsis right */}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="flex items-center justify-center h-9 px-1 text-white/20 text-sm select-none">…</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className={cn(btnBase, 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white')}
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          btnBase,
          'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
        )}
        title="Next page"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>

      {/* Last */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className={cn(
          btnBase,
          'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
        )}
        title="Last page"
      >
        <ChevronsRight className="h-3.5 w-3.5" />
      </button>

      {/* Page info */}
      <span className="text-white/25 text-xs font-medium ml-2 hidden sm:block">
        Page {currentPage} of {totalPages}
      </span>
    </div>
  )
}