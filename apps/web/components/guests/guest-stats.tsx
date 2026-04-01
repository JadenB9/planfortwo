'use client'

import type { GuestStats } from '@planfortwo/types'

interface GuestStatsBarProps {
  stats: GuestStats | null
}

export function GuestStatsBar({ stats }: GuestStatsBarProps) {
  if (!stats) return null

  const primary = [
    { label: 'Accepted', value: stats.rsvpAccepted, color: 'text-green-700' },
    { label: 'Maybe', value: stats.rsvpMaybe, color: 'text-amber-600' },
    { label: 'Declined', value: stats.rsvpDeclined, color: 'text-red-600' },
  ]

  const secondary = [
    { label: 'Total', value: stats.totalGuests },
    { label: 'Pending', value: stats.rsvpPending },
    { label: 'Plus-Ones', value: stats.confirmedPlusOnes },
  ]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-6">
        {primary.map((item) => (
          <div key={item.label} className="text-center">
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className={`text-xs font-medium ${item.color}`}>{item.label}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-5">
        {secondary.map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-base font-semibold text-foreground">{item.value}</p>
            <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
