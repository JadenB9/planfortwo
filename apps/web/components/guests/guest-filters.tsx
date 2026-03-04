'use client'

import { useState } from 'react'
import type { GuestTag, RsvpStatus, GuestSide } from '@planfortwo/types'
import type { GuestFilterState } from '@/hooks/use-guests'

interface GuestFiltersProps {
  filters: GuestFilterState
  tags: GuestTag[]
  onFilterChange: (filters: Partial<GuestFilterState>) => void
  onSearchChange: (search: string) => void
}

const RSVP_OPTIONS: { value: RsvpStatus | ''; label: string }[] = [
  { value: '', label: 'All RSVP' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'pending', label: 'Pending' },
  { value: 'declined', label: 'Declined' },
  { value: 'maybe', label: 'Maybe' },
]

const SIDE_OPTIONS: { value: GuestSide | ''; label: string }[] = [
  { value: '', label: 'All Sides' },
  { value: 'bride', label: 'Bride' },
  { value: 'groom', label: 'Groom' },
  { value: 'both', label: 'Both' },
]

export function GuestFilters({ filters, tags, onFilterChange, onSearchChange }: GuestFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search ?? '')

  function handleSearchInput(value: string) {
    setSearchValue(value)
    onSearchChange(value)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder="Search guests..."
          className="w-full rounded-xl border border-gray-300 py-2 pl-9 pr-4 text-sm text-gray-900 shadow-sm transition-colors focus:border-wedding-600 focus:outline-none focus:ring-2 focus:ring-wedding-600/20"
        />
      </div>

      <select
        value={filters.rsvpStatus ?? ''}
        onChange={(e) => onFilterChange({ rsvpStatus: (e.target.value as RsvpStatus) || undefined })}
        className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-wedding-600 focus:outline-none focus:ring-2 focus:ring-wedding-600/20"
      >
        {RSVP_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <select
        value={filters.side ?? ''}
        onChange={(e) => onFilterChange({ side: (e.target.value as GuestSide) || undefined })}
        className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-wedding-600 focus:outline-none focus:ring-2 focus:ring-wedding-600/20"
      >
        {SIDE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {tags.length > 0 && (
        <select
          value={filters.tagId ?? ''}
          onChange={(e) => onFilterChange({ tagId: e.target.value || undefined })}
          className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-wedding-600 focus:outline-none focus:ring-2 focus:ring-wedding-600/20"
        >
          <option value="">All Tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>{tag.name}</option>
          ))}
        </select>
      )}

      <label className="flex items-center gap-1.5 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={filters.isChild ?? false}
          onChange={(e) => onFilterChange({ isChild: e.target.checked || undefined })}
          className="rounded border-gray-300 text-wedding-600 focus:ring-wedding-600"
        />
        Children
      </label>

      <label className="flex items-center gap-1.5 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={filters.isVip ?? false}
          onChange={(e) => onFilterChange({ isVip: e.target.checked || undefined })}
          className="rounded border-gray-300 text-wedding-600 focus:ring-wedding-600"
        />
        VIP
      </label>
    </div>
  )
}
