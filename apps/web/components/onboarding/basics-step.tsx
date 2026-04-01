'use client'

import { useState } from 'react'
import type { OnboardingData } from '@planfortwo/types'

interface BasicsStepProps {
  data: Partial<OnboardingData>
  onUpdate: (fields: Partial<OnboardingData>) => void
  onSubmit: () => void
  onBack: () => void
  isSubmitting: boolean
}

const GUEST_OPTIONS = [
  { label: 'Intimate', range: '< 50', value: 30 },
  { label: 'Medium', range: '50 – 100', value: 75 },
  { label: 'Large', range: '100 – 200', value: 150 },
  { label: 'Grand', range: '200+', value: 250 },
] as const

const BUDGET_OPTIONS = [
  { label: 'Under $10k', value: 10000 },
  { label: '$10k – $25k', value: 25000 },
  { label: '$25k – $50k', value: 50000 },
  { label: '$50k+', value: 75000 },
] as const

export function BasicsStep({ data, onUpdate, onSubmit, onBack, isSubmitting }: BasicsStepProps) {
  const [showCustomBudget, setShowCustomBudget] = useState(false)
  const isPreset = BUDGET_OPTIONS.some((o) => o.value === data.budgetTotal)

  const dateValue = data.weddingDate ? new Date(data.weddingDate).toISOString().split('T')[0] : ''

  function handleDateChange(value: string) {
    if (value) {
      onUpdate({ weddingDate: new Date(value).toISOString() })
    } else {
      onUpdate({ weddingDate: null })
    }
  }

  function handleCustomBudgetChange(value: string) {
    const num = parseFloat(value)
    if (!isNaN(num) && num >= 0) {
      onUpdate({ budgetTotal: num })
    } else if (value === '') {
      onUpdate({ budgetTotal: null })
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center">
        <h2 className="font-serif text-3xl font-bold text-foreground">Wedding Basics</h2>
        <p className="mt-2 text-muted-foreground">
          Fill in what you know — everything here is optional and can be changed later.
        </p>
      </div>

      {/* Date */}
      <div>
        <label htmlFor="weddingDate" className="block text-sm font-medium text-foreground">
          Wedding Date
        </label>
        <input
          id="weddingDate"
          type="date"
          value={dateValue}
          onChange={(e) => handleDateChange(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="focus:border-wedding-600 focus:ring-wedding-600/20 mt-1 w-full rounded-xl border border-border px-4 py-3 text-foreground shadow-sm transition-colors focus:outline-none focus:ring-2"
        />
      </div>

      {/* Guest count */}
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">Estimated Guest Count</p>
        <div className="grid grid-cols-4 gap-2">
          {GUEST_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onUpdate({ guestCountEstimate: option.value })}
              className={`rounded-xl border-2 px-2 py-3 text-center transition-all ${
                data.guestCountEstimate === option.value
                  ? 'border-wedding-600 bg-wedding-50 shadow-sm'
                  : 'hover:border-wedding-300 border-border'
              }`}
            >
              <span className="block text-sm font-semibold text-foreground">{option.label}</span>
              <span className="block text-xs text-muted-foreground">{option.range}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">Budget</p>
        <div className="grid grid-cols-4 gap-2">
          {BUDGET_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setShowCustomBudget(false)
                onUpdate({ budgetTotal: option.value })
              }}
              className={`rounded-xl border-2 px-2 py-3 text-center transition-all ${
                data.budgetTotal === option.value && !showCustomBudget
                  ? 'border-wedding-600 bg-wedding-50 shadow-sm'
                  : 'hover:border-wedding-300 border-border'
              }`}
            >
              <span className="block text-sm font-semibold text-foreground">{option.label}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setShowCustomBudget(true)
            if (isPreset) onUpdate({ budgetTotal: null })
          }}
          className="text-wedding-600 hover:text-wedding-700 mt-2 text-xs font-medium transition-colors"
        >
          Enter a custom amount
        </button>
        {showCustomBudget && (
          <div className="relative mt-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <input
              type="number"
              min={0}
              step={1000}
              value={data.budgetTotal && !isPreset ? data.budgetTotal : ''}
              onChange={(e) => handleCustomBudgetChange(e.target.value)}
              className="focus:border-wedding-600 focus:ring-wedding-600/20 w-full rounded-xl border border-border py-3 pl-8 pr-4 text-foreground shadow-sm transition-colors focus:outline-none focus:ring-2"
              placeholder="30000"
            />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="bg-wedding-600 hover:bg-wedding-700 focus-visible:outline-wedding-600 flex-1 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Setting up...' : 'Finish Setup'}
        </button>
      </div>
    </div>
  )
}
