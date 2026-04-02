'use client'

import type { OnboardingData, TimelineTemplate } from '@planfortwo/types'

interface TimelineStepProps {
  data: Partial<OnboardingData>
  onUpdate: (fields: Partial<OnboardingData>) => void
  onSubmit: () => void
  onBack: () => void
  isSubmitting: boolean
}

const TIMELINE_OPTIONS: { value: TimelineTemplate; label: string; description: string }[] = [
  { value: '6-month', label: '6 Months', description: 'Fast-track planning for a closer date' },
  { value: '12-month', label: '12 Months', description: 'The most popular timeline' },
  { value: '18-month', label: '18 Months', description: 'Extra time for every detail' },
  { value: 'elopement', label: 'Elopement', description: 'Just the two of you, simplified' },
]

export function TimelineStep({
  data,
  onUpdate,
  onSubmit,
  onBack,
  isSubmitting,
}: TimelineStepProps) {
  const selected = data.timelineTemplate ?? '12-month'

  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center">
        <h2 className="text-foreground font-serif text-3xl font-bold">Choose your timeline</h2>
        <p className="text-muted-foreground mt-2">
          We&apos;ll build a checklist tailored to your pace.
        </p>
      </div>

      <div className="space-y-3">
        {TIMELINE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onUpdate({ timelineTemplate: option.value })}
            className={`w-full rounded-2xl border-2 px-5 py-4 text-left transition-all ${
              selected === option.value
                ? 'border-wedding-600 bg-wedding-50 shadow-md'
                : 'hover:border-wedding-300 hover:bg-wedding-50/50 border-border'
            }`}
          >
            <span className="text-foreground block text-base font-semibold">{option.label}</span>
            <span className="text-muted-foreground mt-0.5 block text-sm">{option.description}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="border-border text-foreground hover:bg-muted flex-1 rounded-xl border px-6 py-3 text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="bg-wedding-600 hover:bg-wedding-700 focus-visible:outline-wedding-600 flex-1 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Setting up...' : 'Get Started'}
        </button>
      </div>
    </div>
  )
}
