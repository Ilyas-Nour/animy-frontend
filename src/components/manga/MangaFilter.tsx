'use client'

import { useState } from 'react'
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MangaFilterProps {
    onFilterChange: (filters: MangaFilterState) => void
    currentFilters?: MangaFilterState
}

export interface MangaFilterState {
    type?: string
    status?: string
    order_by?: string
    sort?: string
}

const filterOptions = {
    type: {
        label: 'Type',
        options: [
            { value: '', label: 'All Types' },
            { value: 'manga', label: 'Manga' },
            { value: 'novel', label: 'Novel' },
            { value: 'oneshot', label: 'One-shot' },
            { value: 'doujin', label: 'Doujin' },
            { value: 'manhwa', label: 'Manhwa' },
            { value: 'manhua', label: 'Manhua' },
        ],
    },
    status: {
        label: 'Status',
        options: [
            { value: '', label: 'All Status' },
            { value: 'publishing', label: 'Publishing' },
            { value: 'complete', label: 'Completed' },
            { value: 'hiatus', label: 'On Hiatus' },
            { value: 'discontinued', label: 'Discontinued' },
            { value: 'upcoming', label: 'Upcoming' },
        ],
    },
    order_by: {
        label: 'Order By',
        options: [
            { value: 'score', label: 'Score' },
            { value: 'title', label: 'Title' },
            { value: 'start_date', label: 'Start Date' },
            { value: 'popularity', label: 'Popularity' },
            { value: 'rank', label: 'Rank' },
            { value: 'chapters', label: 'Chapters' },
            { value: 'volumes', label: 'Volumes' },
        ],
    },
    sort: {
        label: 'Sort',
        options: [
            { value: 'desc', label: 'Descending' },
            { value: 'asc', label: 'Ascending' },
        ],
    },
}

function FilterDropdown({
    filterKey,
    config,
    value,
    onChange,
}: {
    filterKey: keyof MangaFilterState
    config: (typeof filterOptions)[keyof typeof filterOptions]
    value: string
    onChange: (key: keyof MangaFilterState, val: string) => void
}) {
    const [open, setOpen] = useState(false)
    const selected = config.options.find((o) => o.value === value) ?? config.options[0]
    const isActive = !!value && value !== config.options[0]?.value

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap',
                    'border backdrop-blur-sm',
                    isActive
                        ? 'bg-purple-600/30 border-purple-500/50 text-purple-600 dark:text-purple-200 shadow-[0_0_12px_rgba(139,92,246,0.2)]'
                        : 'bg-card border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
            >
                <span className="text-xs font-semibold uppercase tracking-wider opacity-60">{config.label}:</span>
                <span className={isActive ? 'text-purple-600 dark:text-purple-200' : 'text-foreground/90'}>{selected.label}</span>
                <ChevronDown className={cn('w-3.5 h-3.5 opacity-50 transition-transform duration-200', open && 'rotate-180')} />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 z-50 min-w-[160px] rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-xl overflow-hidden">
                        {config.options.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(filterKey, opt.value)
                                    setOpen(false)
                                }}
                                className={cn(
                                    'w-full text-left px-4 py-2.5 text-sm transition-colors duration-150',
                                    opt.value === value
                                        ? 'bg-purple-600/30 text-purple-600 dark:text-purple-200 font-semibold'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

export function MangaFilter({ onFilterChange, currentFilters = {} }: MangaFilterProps) {
    const [localFilters, setLocalFilters] = useState<MangaFilterState>(currentFilters)
    const [mobileOpen, setMobileOpen] = useState(false)

    const activeCount = Object.entries(localFilters).filter(
        ([k, v]) => v && v !== '' && !(k === 'sort' && v === 'desc') && !(k === 'order_by' && v === 'score')
    ).length

    const handleChange = (key: keyof MangaFilterState, value: string) => {
        const next = { ...localFilters, [key]: value || undefined }
        setLocalFilters(next)
        onFilterChange(next)
    }

    const handleClear = (key: keyof MangaFilterState) => {
        const next = { ...localFilters, [key]: undefined }
        setLocalFilters(next)
        onFilterChange(next)
    }

    const handleClearAll = () => {
        setLocalFilters({})
        onFilterChange({})
    }

    const getValue = (key: keyof MangaFilterState) => localFilters[key] || ''

    return (
        <div className="space-y-3">
            {/* Desktop Filter Row */}
            <div className="hidden lg:flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-muted-foreground mr-1">
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
                </div>

                {(Object.keys(filterOptions) as (keyof MangaFilterState)[]).map((key) => (
                    <FilterDropdown
                        key={key}
                        filterKey={key}
                        config={filterOptions[key]}
                        value={getValue(key)}
                        onChange={handleChange}
                    />
                ))}

                {activeCount > 0 && (
                    <button
                        onClick={handleClearAll}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-colors duration-200"
                    >
                        <X className="w-3 h-3" />
                        Clear all
                    </button>
                )}
            </div>

            {/* Mobile Filter Toggle */}
            <div className="lg:hidden">
                <button
                    type="button"
                    onClick={() => setMobileOpen((p) => !p)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-card border border-border text-muted-foreground hover:bg-accent transition-colors w-full justify-between"
                >
                    <span className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters
                        {activeCount > 0 && (
                            <span className="bg-purple-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                                {activeCount}
                            </span>
                        )}
                    </span>
                    <ChevronDown className={cn('w-4 h-4 opacity-50 transition-transform duration-200', mobileOpen && 'rotate-180')} />
                </button>

                {mobileOpen && (
                    <div className="mt-2 p-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm grid grid-cols-2 gap-3 shadow-md">
                        {(Object.keys(filterOptions) as (keyof MangaFilterState)[]).map((key) => (
                            <div key={key} className="space-y-1">
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    {filterOptions[key].label}
                                </label>
                                <select
                                    value={getValue(key)}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    className="w-full bg-card border border-input rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:border-purple-500/50"
                                >
                                    {filterOptions[key].options.map((opt) => (
                                        <option key={opt.value} value={opt.value} className="bg-card text-foreground">
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Active Filter Chips */}
            {activeCount > 0 && (
                <div className="flex flex-wrap gap-2">
                    {(Object.entries(localFilters) as [keyof MangaFilterState, string][])
                        .filter(([, v]) => v && v !== '')
                        .map(([key, val]) => {
                            const opts = filterOptions[key]?.options
                            const label = opts?.find((o) => o.value === val)?.label ?? val
                            return (
                                <div
                                    key={key}
                                    className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full text-xs font-semibold bg-purple-600/20 border border-purple-500/30 text-purple-700 dark:text-purple-200"
                                >
                                    <span className="opacity-60 capitalize">{filterOptions[key]?.label}:</span>
                                    <span>{label}</span>
                                    <button
                                        onClick={() => handleClear(key)}
                                        className="w-4 h-4 rounded-full bg-purple-500/30 hover:bg-purple-500/60 flex items-center justify-center transition-colors duration-150"
                                    >
                                        <X className="w-2.5 h-2.5" />
                                    </button>
                                </div>
                            )
                        })}
                </div>
            )}
        </div>
    )
}
