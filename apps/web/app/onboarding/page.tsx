'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import type { OnboardingData } from '@planfortwo/types'
import { onboardingSchema } from '@planfortwo/validators'
import { api } from '@/lib/api'
import { ProgressBar } from '@/components/onboarding/progress-bar'
import { NamesStep } from '@/components/onboarding/names-step'
import { DateStep } from '@/components/onboarding/date-step'
import { GuestCountStep } from '@/components/onboarding/guest-count-step'
import { BudgetStep } from '@/components/onboarding/budget-step'
import { StyleStep } from '@/components/onboarding/style-step'
import { TimelineStep } from '@/components/onboarding/timeline-step'

const TOTAL_STEPS = 6

export default function OnboardingPage() {
  const router = useRouter()
  const { getToken } = useAuth()

  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<Partial<OnboardingData>>({
    partnerFirstName: '',
    partnerLastName: '',
    weddingDate: null,
    guestCountEstimate: null,
    budgetTotal: null,
    style: null,
    timelineTemplate: '12-month',
  })

  const updateData = useCallback((fields: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...fields }))
  }, [])

  function handleNext() {
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1))
  }

  function handleBack() {
    setStep((prev) => Math.max(prev - 1, 0))
  }

  async function handleSubmit() {
    setError(null)
    setIsSubmitting(true)

    try {
      const parsed = onboardingSchema.parse({
        ...data,
        timelineTemplate: data.timelineTemplate ?? '12-month',
      })

      const token = await getToken()
      if (!token) throw new Error('Not authenticated')

      const { data: dashboardData } = await api.weddings.mine(token)
      const onboardingData: OnboardingData = {
        partnerFirstName: parsed.partnerFirstName,
        partnerLastName: parsed.partnerLastName,
        weddingDate: parsed.weddingDate ?? null,
        guestCountEstimate: parsed.guestCountEstimate ?? null,
        budgetTotal: parsed.budgetTotal ?? null,
        style: parsed.style ?? null,
        timelineTemplate: parsed.timelineTemplate,
      }
      await api.weddings.completeOnboarding(dashboardData.wedding.id, onboardingData, token)

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-bold text-gray-900">
          Plan<span className="text-wedding-600">For</span>Two
        </h1>
      </div>

      <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {step === 0 && (
        <NamesStep data={data} onUpdate={updateData} onNext={handleNext} />
      )}
      {step === 1 && (
        <DateStep data={data} onUpdate={updateData} onNext={handleNext} onBack={handleBack} />
      )}
      {step === 2 && (
        <GuestCountStep data={data} onUpdate={updateData} onNext={handleNext} onBack={handleBack} />
      )}
      {step === 3 && (
        <BudgetStep data={data} onUpdate={updateData} onNext={handleNext} onBack={handleBack} />
      )}
      {step === 4 && (
        <StyleStep data={data} onUpdate={updateData} onNext={handleNext} onBack={handleBack} />
      )}
      {step === 5 && (
        <TimelineStep
          data={data}
          onUpdate={updateData}
          onSubmit={handleSubmit}
          onBack={handleBack}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  )
}
