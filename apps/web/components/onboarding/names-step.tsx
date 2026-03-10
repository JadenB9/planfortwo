'use client'

import type { OnboardingData } from '@planfortwo/types'

interface NamesStepProps {
  data: Partial<OnboardingData>
  onUpdate: (fields: Partial<OnboardingData>) => void
  onNext: () => void
}

export function NamesStep({ data, onUpdate, onNext }: NamesStepProps) {
  const hasSomething =
    data.yourFirstName?.trim() ||
    data.yourLastName?.trim() ||
    data.partnerFirstName?.trim() ||
    data.partnerLastName?.trim()

  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center">
        <h2 className="font-serif text-3xl font-bold text-gray-900">Let&apos;s get started</h2>
        <p className="mt-2 text-gray-600">
          Tell us a little about you and your partner. You can always update this later.
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Your Name</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              id="yourFirstName"
              type="text"
              value={data.yourFirstName ?? ''}
              onChange={(e) => onUpdate({ yourFirstName: e.target.value })}
              className="focus:border-wedding-600 focus:ring-wedding-600/20 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2"
              placeholder="First name"
            />
          </div>
          <div>
            <input
              id="yourLastName"
              type="text"
              value={data.yourLastName ?? ''}
              onChange={(e) => onUpdate({ yourLastName: e.target.value })}
              className="focus:border-wedding-600 focus:ring-wedding-600/20 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2"
              placeholder="Last name"
            />
          </div>
        </div>

        <p className="pt-2 text-sm font-medium uppercase tracking-wide text-gray-500">
          Partner&apos;s Name
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              id="partnerFirstName"
              type="text"
              value={data.partnerFirstName ?? ''}
              onChange={(e) => onUpdate({ partnerFirstName: e.target.value })}
              className="focus:border-wedding-600 focus:ring-wedding-600/20 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2"
              placeholder="First name"
            />
          </div>
          <div>
            <input
              id="partnerLastName"
              type="text"
              value={data.partnerLastName ?? ''}
              onChange={(e) => onUpdate({ partnerLastName: e.target.value })}
              className="focus:border-wedding-600 focus:ring-wedding-600/20 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2"
              placeholder="Last name"
            />
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        className="bg-wedding-600 hover:bg-wedding-700 focus-visible:outline-wedding-600 w-full rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {hasSomething ? 'Continue' : 'Skip for Now'}
      </button>
    </div>
  )
}
