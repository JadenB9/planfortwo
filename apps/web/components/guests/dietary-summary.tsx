'use client'

import type { DietarySummary } from '@planfortwo/types'

interface DietarySummaryCardProps {
  summary: DietarySummary | undefined
}

export function DietarySummaryCard({ summary }: DietarySummaryCardProps) {
  if (!summary) return null

  const items = [
    { label: 'Vegetarian', count: summary.vegetarian },
    { label: 'Vegan', count: summary.vegan },
    { label: 'Gluten-Free', count: summary.glutenFree },
    { label: 'Kosher', count: summary.kosher },
    { label: 'Halal', count: summary.halal },
    { label: 'Allergies', count: summary.withAllergies },
  ].filter((item) => item.count > 0)

  if (items.length === 0) {
    return (
      <div className="border-border bg-background rounded-2xl border p-4">
        <h3 className="text-foreground font-serif text-sm font-semibold">Dietary Restrictions</h3>
        <p className="text-muted-foreground mt-1 text-sm">No dietary restrictions reported yet.</p>
      </div>
    )
  }

  return (
    <div className="border-border bg-background rounded-2xl border p-4">
      <h3 className="text-foreground font-serif text-sm font-semibold">Dietary Restrictions</h3>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="bg-wedding-50 text-wedding-700 rounded-full px-2 py-0.5 text-xs font-semibold">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
