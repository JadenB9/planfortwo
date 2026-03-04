'use client'

import type { OnboardingData } from '@planfortwo/types'

interface NamesStepProps {
  data: Partial<OnboardingData>
  onUpdate: (fields: Partial<OnboardingData>) => void
  onNext: () => void
}

export function NamesStep({ data, onUpdate, onNext }: NamesStepProps) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center">
        <h2 className="font-serif text-3xl font-bold text-gray-900">
          Who are you planning with?
        </h2>
        <p className="mt-2 text-gray-600">
          Tell us your partner&apos;s name to personalize your experience.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="partnerFirstName" className="block text-sm font-medium text-gray-700">
            Partner&apos;s First Name
          </label>
          <input
            id="partnerFirstName"
            type="text"
            value={data.partnerFirstName ?? ''}
            onChange={(e) => onUpdate({ partnerFirstName: e.target.value })}
            className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm transition-colors focus:border-wedding-600 focus:outline-none focus:ring-2 focus:ring-wedding-600/20"
            placeholder="First name"
          />
        </div>

        <div>
          <label htmlFor="partnerLastName" className="block text-sm font-medium text-gray-700">
            Partner&apos;s Last Name
          </label>
          <input
            id="partnerLastName"
            type="text"
            value={data.partnerLastName ?? ''}
            onChange={(e) => onUpdate({ partnerLastName: e.target.value })}
            className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm transition-colors focus:border-wedding-600 focus:outline-none focus:ring-2 focus:ring-wedding-600/20"
            placeholder="Last name"
          />
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!data.partnerFirstName?.trim() || !data.partnerLastName?.trim()}
        className="w-full rounded-xl bg-wedding-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-wedding-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wedding-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  )
}
