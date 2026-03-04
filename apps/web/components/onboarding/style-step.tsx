'use client'

import type { OnboardingData, WeddingStyle } from '@planfortwo/types'

interface StyleStepProps {
  data: Partial<OnboardingData>
  onUpdate: (fields: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

const STYLE_OPTIONS: { value: WeddingStyle; label: string; emoji: string }[] = [
  { value: 'classic', label: 'Classic', emoji: '\u{1F3DB}' },
  { value: 'modern', label: 'Modern', emoji: '\u{2728}' },
  { value: 'rustic', label: 'Rustic', emoji: '\u{1F33E}' },
  { value: 'romantic', label: 'Romantic', emoji: '\u{1F339}' },
  { value: 'minimalist', label: 'Minimalist', emoji: '\u{25FB}' },
  { value: 'bohemian', label: 'Bohemian', emoji: '\u{1F33B}' },
  { value: 'garden', label: 'Garden', emoji: '\u{1F33F}' },
  { value: 'beach', label: 'Beach', emoji: '\u{1F3D6}' },
  { value: 'elegant', label: 'Elegant', emoji: '\u{1F451}' },
  { value: 'whimsical', label: 'Whimsical', emoji: '\u{1F98B}' },
]

export function StyleStep({ data, onUpdate, onNext, onBack }: StyleStepProps) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center">
        <h2 className="font-serif text-3xl font-bold text-gray-900">
          What&apos;s your style?
        </h2>
        <p className="mt-2 text-gray-600">
          Pick the vibe that feels most like you two.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {STYLE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onUpdate({ style: option.value })}
            className={`rounded-2xl border-2 px-3 py-4 text-center transition-all ${
              data.style === option.value
                ? 'border-wedding-600 bg-wedding-50 shadow-md'
                : 'border-gray-200 hover:border-wedding-300 hover:bg-wedding-50/50'
            }`}
          >
            <span className="block text-2xl">{option.emoji}</span>
            <span className="mt-1 block text-sm font-semibold text-gray-900">
              {option.label}
            </span>
          </button>
        ))}
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
          {data.style ? 'Continue' : 'Skip for Now'}
        </button>
      </div>
    </div>
  )
}
