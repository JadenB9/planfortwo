'use client'

import { useRouter } from 'next/navigation'
import { useWedding } from '@/hooks/use-wedding'
import { BudgetSetupWizard } from '@/components/budget/budget-setup-wizard'

export default function BudgetSetupPage() {
  const router = useRouter()
  const { data: weddingData, loading: weddingLoading } = useWedding()
  const weddingId = weddingData?.wedding.id ?? null

  if (weddingLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
      </div>
    )
  }

  if (!weddingId) return null

  return (
    <div className="animate-fade-in mx-auto max-w-4xl">
      <BudgetSetupWizard
        weddingId={weddingId}
        currentBudget={weddingData?.wedding.budgetTotal ?? null}
        onComplete={() => router.push('/budget')}
        onClose={() => router.push('/budget')}
      />
    </div>
  )
}
