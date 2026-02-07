import { useState } from 'react'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MangaFilterProps {
    onFilterChange: (filters: MangaFilterState) => void
}

export interface MangaFilterState {
    type?: string
    status?: string
    rating?: string
    order_by?: string
    sort?: string
}

export function MangaFilter({ onFilterChange }: MangaFilterProps) {
    const [isOpen, setIsOpen] = useState(false)

    const handleChange = (key: keyof MangaFilterState, value: string) => {
        onFilterChange({ [key]: value || undefined })
    }

    return (
        <div className="space-y-4">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden">
                <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filters
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {isOpen ? 'Hide' : 'Show'}
                    </span>
                </Button>
            </div>

            {/* Filter Grid */}
            <div className={cn(
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4",
                !isOpen && "hidden lg:grid"
            )}>
                <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                        id="type"
                        onChange={(e) => handleChange('type', e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="manga">Manga</option>
                        <option value="novel">Novel</option>
                        <option value="oneshot">One-shot</option>
                        <option value="doujin">Doujin</option>
                        <option value="manhwa">Manhwa</option>
                        <option value="manhua">Manhua</option>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                        id="status"
                        onChange={(e) => handleChange('status', e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="publishing">Publishing</option>
                        <option value="complete">Completed</option>
                        <option value="hiatus">On Hiatus</option>
                        <option value="discontinued">Discontinued</option>
                        <option value="upcoming">Upcoming</option>
                    </Select>
                </div>

                {/* Note: Manga doesn't usually have rating filter in Jikan, check if needed. Keeping if it was there. */}
                {/* Actually previous implementation didn't have rating filter but interface did? */}
                {/* Wait, my view_file showed rating in interface but not in JSX? Let me check line 56 of previous file */}
                {/* Previous file HAD 4 items in JSX? */}
                {/* Let's re-verify previous file content from view_file output. 
                   It had type, status, order_by, sort. Rating was in interface but NOT in JSX.
                   But wait, lines 56-69 in previous file was "space-y-2... Label Order By".
                   Wait, lines 84-93 was "Sort".
                   So it had 4 filters.
                   Line 13 in interface had `rating?: string`.
                   So rating was unused. I will NOT add rating if it wasn't there, or I'll check if needed.
                   Wait, I should stick to what was there.
                */}

                <div className="space-y-2">
                    <Label htmlFor="order_by">Order By</Label>
                    <Select
                        id="order_by"
                        onChange={(e) => handleChange('order_by', e.target.value)}
                    >
                        <option value="score">Score</option>
                        <option value="title">Title</option>
                        <option value="start_date">Start Date</option>
                        <option value="end_date">End Date</option>
                        <option value="popularity">Popularity</option>
                        <option value="rank">Rank</option>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="sort">Sort</Label>
                    <Select
                        id="sort"
                        onChange={(e) => handleChange('sort', e.target.value)}
                    >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                    </Select>
                </div>
            </div>
        </div>
    )
}
