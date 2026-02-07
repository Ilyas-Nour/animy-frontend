import { useState } from 'react'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnimeFilterProps {
  onFilterChange: (filters: FilterState) => void
}

export interface FilterState {
  type?: string
  status?: string
  rating?: string
  order_by?: string
  sort?: string
}

export function AnimeFilter({ onFilterChange }: AnimeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleChange = (key: keyof FilterState, value: string) => {
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

      {/* Filter Grid - Hidden on mobile unless open, always visible on desktop */}
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
            <option value="tv">TV</option>
            <option value="movie">Movie</option>
            <option value="ova">OVA</option>
            <option value="special">Special</option>
            <option value="ona">ONA</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            onChange={(e) => handleChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="airing">Airing</option>
            <option value="complete">Completed</option>
            <option value="upcoming">Upcoming</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rating">Rating</Label>
          <Select
            id="rating"
            onChange={(e) => handleChange('rating', e.target.value)}
          >
            <option value="">All Ratings</option>
            <option value="g">G - All Ages</option>
            <option value="pg">PG - Children</option>
            <option value="pg13">PG-13 - Teens 13+</option>
            <option value="r17">R - 17+</option>
            <option value="r">R+ - Mild Nudity</option>
            <option value="rx">Rx - Hentai</option>
          </Select>
        </div>

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