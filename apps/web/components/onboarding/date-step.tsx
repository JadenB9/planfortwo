'use client'

import type { OnboardingData } from '@planfortwo/types'

interface DateStepProps {
  data: Partial<OnboardingData>
  onUpdate: (fields: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

export function DateStep({ data, onUpdate, onNext, onBack }: DateStepProps) {
  const dateValue = data.weddingDate
    ? new Date(data.weddingDate).toISOString().split('T')[0]
    : ''

  function handleDateChange(value: string) {
    if (value) {
      onUpdate({ weddingDate: new Date(value).toISOString() })
    } else {
      onUpdate({ weddingDate: null })
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center">
        <h2 className="font-serif text-3xl font-bold text-gray-900">
          When&apos;s the big day?
        </h2>
        <p className="mt-2 text-gray-600">
          Don&apos;t worry if you haven&apos;t decided yet — you can always set this later.
        </p>
      </div>

      <div>
        <label htmlFor="weddingDate" className="block text-sm font-medium text-gray-700">
          Wedding Date
        </label>
        <input
          id="weddingDate"
          type="date"
          value={dateValue}
          onChange={(e) => handleDateChange(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm transition-colors focus:border-wedding-600 focus:outline-none focus:ring-2 focus:ring-wedding-600/20"
        />
      </div>

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
          {data.weddingDate ? 'Continue' : 'Skip for Now'}
        </button>
      </div>
    </div>
  )
}
