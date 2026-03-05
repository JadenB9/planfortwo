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
        <h2 className="font-serif text-3xl font-bold text-gray-900">Choose your timeline</h2>
        <p className="mt-2 text-gray-600">We&apos;ll build a checklist tailored to your pace.</p>
      </div>

      <div className="space-y-3">
        {TIMELINE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onUpdate({ timelineTemplate: option.value })}
            className={`w-full rounded-2xl border-2 px-5 py-4 text-left transition-all ${
              selected === option.value
                ? 'border-wedding-600 bg-wedding-50 shadow-md'
                : 'hover:border-wedding-300 hover:bg-wedding-50/50 border-gray-200'
            }`}
          >
            <span className="block text-base font-semibold text-gray-900">{option.label}</span>
            <span className="mt-0.5 block text-sm text-gray-500">{option.description}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
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
