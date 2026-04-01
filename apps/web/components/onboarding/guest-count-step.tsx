'use client'

import type { OnboardingData } from '@planfortwo/types'

interface GuestCountStepProps {
  data: Partial<OnboardingData>
  onUpdate: (fields: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

const GUEST_OPTIONS = [
  { label: 'Intimate', range: '< 50', value: 30 },
  { label: 'Medium', range: '50 – 100', value: 75 },
  { label: 'Large', range: '100 – 200', value: 150 },
  { label: 'Grand', range: '200+', value: 250 },
] as const

export function GuestCountStep({ data, onUpdate, onNext, onBack }: GuestCountStepProps) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center">
        <h2 className="font-serif text-3xl font-bold text-foreground">How many guests?</h2>
        <p className="mt-2 text-muted-foreground">A rough estimate helps us tailor your planning tools.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {GUEST_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onUpdate({ guestCountEstimate: option.value })}
            className={`rounded-2xl border-2 px-4 py-5 text-center transition-all ${
              data.guestCountEstimate === option.value
                ? 'border-wedding-600 bg-wedding-50 shadow-md'
                : 'hover:border-wedding-300 hover:bg-wedding-50/50 border-border'
            }`}
          >
            <span className="block text-lg font-semibold text-foreground">{option.label}</span>
            <span className="mt-1 block text-sm text-muted-foreground">{option.range}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="bg-wedding-600 hover:bg-wedding-700 focus-visible:outline-wedding-600 flex-1 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {data.guestCountEstimate ? 'Continue' : 'Skip for Now'}
        </button>
      </div>
    </div>
  )
}
