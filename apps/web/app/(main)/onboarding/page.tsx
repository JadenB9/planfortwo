'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import type { OnboardingData } from '@planfortwo/types'
import { onboardingSchema } from '@planfortwo/validators'
import { api } from '@/lib/api'
import { springSmooth } from '@/lib/animations'
import { ProgressBar } from '@/components/onboarding/progress-bar'
import { NamesStep } from '@/components/onboarding/names-step'
import { DateStep } from '@/components/onboarding/date-step'
import { GuestCountStep } from '@/components/onboarding/guest-count-step'
import { BudgetStep } from '@/components/onboarding/budget-step'
import { StyleStep } from '@/components/onboarding/style-step'
import { TimelineStep } from '@/components/onboarding/timeline-step'

const TOTAL_STEPS = 6

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
}

export default function OnboardingPage() {
  const router = useRouter()
  const { getToken } = useAuth()

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
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
    setDirection(1)
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1))
  }

  function handleBack() {
    setDirection(-1)
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

      let dashboardData: Awaited<ReturnType<typeof api.weddings.mine>>['data'] | null = null
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const res = await api.weddings.mine(token)
          dashboardData = res.data
          break
        } catch (err) {
          const msg = err instanceof Error ? err.message : ''
          if (attempt < 4 && (msg.includes('not found') || msg.includes('Not Found'))) {
            await new Promise((r) => setTimeout(r, 1000))
            continue
          }
          throw err
        }
      }
      if (!dashboardData) throw new Error('Unable to load your wedding. Please try again.')

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

  const steps = [
    <NamesStep key="names" data={data} onUpdate={updateData} onNext={handleNext} />,
    <DateStep
      key="date"
      data={data}
      onUpdate={updateData}
      onNext={handleNext}
      onBack={handleBack}
    />,
    <GuestCountStep
      key="guests"
      data={data}
      onUpdate={updateData}
      onNext={handleNext}
      onBack={handleBack}
    />,
    <BudgetStep
      key="budget"
      data={data}
      onUpdate={updateData}
      onNext={handleNext}
      onBack={handleBack}
    />,
    <StyleStep
      key="style"
      data={data}
      onUpdate={updateData}
      onNext={handleNext}
      onBack={handleBack}
    />,
    <TimelineStep
      key="timeline"
      data={data}
      onUpdate={updateData}
      onSubmit={handleSubmit}
      onBack={handleBack}
      isSubmitting={isSubmitting}
    />,
  ]

  return (
    <>
      <motion.div
        className="mb-6 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-serif text-2xl font-bold text-gray-900">
          Plan<span className="text-wedding-600">For</span>Two
        </h1>
      </motion.div>

      <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />

      {error && (
        <motion.div
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ...springSmooth }}
        >
          {steps[step]}
        </motion.div>
      </AnimatePresence>
    </>
  )
}
