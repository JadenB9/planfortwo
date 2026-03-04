'use client'

import type { GuestStats } from '@planfortwo/types'

interface GuestStatsBarProps {
  stats: GuestStats | null
}

export function GuestStatsBar({ stats }: GuestStatsBarProps) {
  if (!stats) return null

  const items = [
    { label: 'Total', value: stats.totalGuests, color: 'bg-gray-100 text-gray-800' },
    { label: 'Accepted', value: stats.rsvpAccepted, color: 'bg-green-50 text-green-700' },
    { label: 'Pending', value: stats.rsvpPending, color: 'bg-amber-50 text-amber-700' },
    { label: 'Declined', value: stats.rsvpDeclined, color: 'bg-red-50 text-red-700' },
    { label: 'Maybe', value: stats.rsvpMaybe, color: 'bg-blue-50 text-blue-700' },
    { label: 'Plus-Ones', value: stats.confirmedPlusOnes, color: 'bg-purple-50 text-purple-700' },
  ]

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-xl px-3 py-2 text-center ${item.color}`}
        >
          <p className="text-lg font-bold">{item.value}</p>
          <p className="text-xs font-medium">{item.label}</p>
        </div>
      ))}
    </div>
  )
}
