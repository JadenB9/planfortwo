'use client'

import { useState } from 'react'
import type { OnboardingData } from '@planfortwo/types'

interface BudgetStepProps {
  data: Partial<OnboardingData>
  onUpdate: (fields: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

const BUDGET_OPTIONS = [
  { label: 'Under $10k', value: 10000 },
  { label: '$10k – $25k', value: 25000 },
  { label: '$25k – $50k', value: 50000 },
  { label: '$50k+', value: 75000 },
] as const

export function BudgetStep({ data, onUpdate, onNext, onBack }: BudgetStepProps) {
  const [showCustom, setShowCustom] = useState(false)
  const isPreset = BUDGET_OPTIONS.some((o) => o.value === data.budgetTotal)

  function handleCustomChange(value: string) {
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
        <h2 className="font-serif text-3xl font-bold text-gray-900">
          What&apos;s your budget?
        </h2>
        <p className="mt-2 text-gray-600">
          This helps us set up your budget tracker with realistic categories.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {BUDGET_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              setShowCustom(false)
              onUpdate({ budgetTotal: option.value })
            }}
            className={`rounded-2xl border-2 px-4 py-5 text-center transition-all ${
              data.budgetTotal === option.value && !showCustom
                ? 'border-wedding-600 bg-wedding-50 shadow-md'
                : 'border-gray-200 hover:border-wedding-300 hover:bg-wedding-50/50'
            }`}
          >
            <span className="block text-lg font-semibold text-gray-900">{option.label}</span>
          </button>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={() => {
            setShowCustom(true)
            if (isPreset) onUpdate({ budgetTotal: null })
          }}
          className="text-sm font-medium text-wedding-600 transition-colors hover:text-wedding-700"
        >
          Enter a custom amount
        </button>
      </div>

      {showCustom && (
        <div>
          <label htmlFor="customBudget" className="block text-sm font-medium text-gray-700">
            Custom Budget
          </label>
          <div className="relative mt-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              id="customBudget"
              type="number"
              min={0}
              step={1000}
              value={data.budgetTotal && !isPreset ? data.budgetTotal : ''}
              onChange={(e) => handleCustomChange(e.target.value)}
              className="w-full rounded-xl border border-gray-300 py-3 pl-8 pr-4 text-gray-900 shadow-sm transition-colors focus:border-wedding-600 focus:outline-none focus:ring-2 focus:ring-wedding-600/20"
              placeholder="30000"
            />
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 rounded-xl bg-wedding-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-wedding-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wedding-600"
        >
          {data.budgetTotal ? 'Continue' : 'Skip for Now'}
        </button>
      </div>
    </div>
  )
}
