'use client'

import { Mail } from 'lucide-react'
import type { OnboardingData } from '@planfortwo/types'

interface InviteStepProps {
  data: Partial<OnboardingData>
  onUpdate: (fields: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

export function InviteStep({ data, onUpdate, onNext, onBack }: InviteStepProps) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center">
        <div className="bg-wedding-50 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          <Mail className="text-wedding-600 h-6 w-6" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-foreground">Invite Your Partner</h2>
        <p className="mt-2 text-muted-foreground">
          Planning is better together. We&apos;ll send them an invite to join your wedding plan.
        </p>
      </div>

      <div>
        <label htmlFor="partnerEmail" className="block text-sm font-medium text-foreground">
          Partner&apos;s Email
        </label>
        <input
          id="partnerEmail"
          type="email"
          value={data.partnerEmail ?? ''}
          onChange={(e) => onUpdate({ partnerEmail: e.target.value || null })}
          className="focus:border-wedding-600 focus:ring-wedding-600/20 mt-1 w-full rounded-xl border border-border px-4 py-3 text-foreground shadow-sm transition-colors focus:outline-none focus:ring-2"
          placeholder="partner@email.com"
        />
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
          {data.partnerEmail?.trim() ? 'Continue' : 'Skip for Now'}
        </button>
      </div>
    </div>
  )
}
