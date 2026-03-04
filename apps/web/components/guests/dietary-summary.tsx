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
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <h3 className="font-serif text-sm font-semibold text-gray-900">Dietary Restrictions</h3>
        <p className="mt-1 text-sm text-gray-500">No dietary restrictions reported yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <h3 className="font-serif text-sm font-semibold text-gray-900">Dietary Restrictions</h3>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{item.label}</span>
            <span className="rounded-full bg-wedding-50 px-2 py-0.5 text-xs font-semibold text-wedding-700">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
