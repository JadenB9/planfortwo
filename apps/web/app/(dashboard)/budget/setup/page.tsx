'use client'

import { useRouter } from 'next/navigation'
import { useWedding } from '@/hooks/use-wedding'
import { useFeatures } from '@/hooks/use-features'
import { BudgetSetupWizard } from '@/components/budget/budget-setup-wizard'
import { UpgradePrompt } from '@/components/checklist/upgrade-prompt'

export default function BudgetSetupPage() {
  const router = useRouter()
  const { data: weddingData, loading: weddingLoading } = useWedding()
  const weddingId = weddingData?.wedding.id ?? null
  const { features, loading: featuresLoading } = useFeatures(weddingId)

  if (weddingLoading || featuresLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-wedding-200 border-t-wedding-600" />
      </div>
    )
  }

  if (features && !features.canBudgetCategories) {
    return (
      <div className="mx-auto max-w-4xl animate-fade-in">
        <h1 className="mb-4 font-serif text-3xl font-bold text-gray-900">Budget Setup</h1>
        <UpgradePrompt message="Upgrade to set up your wedding budget" />
      </div>
    )
  }

  if (!weddingId) return null

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <BudgetSetupWizard
        weddingId={weddingId}
        currentBudget={weddingData?.wedding.budgetTotal ?? null}
        onComplete={() => router.push('/budget')}
        onClose={() => router.push('/budget')}
      />
    </div>
  )
}
