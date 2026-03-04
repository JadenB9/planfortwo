'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { api } from '@/lib/api'

interface BudgetSetupWizardProps {
  weddingId: string
  currentBudget: number | null
  onComplete: () => void
  onClose: () => void
}

interface CategoryAllocation {
  name: string
  icon: string
  color: string
  percentage: number
  amount: number
}

const DEFAULT_ALLOCATIONS: Omit<CategoryAllocation, 'amount'>[] = [
  { name: 'Venue', icon: '🏛️', color: '#8B7355', percentage: 40 },
  { name: 'Catering', icon: '🍽️', color: '#B5A088', percentage: 15 },
  { name: 'Photography', icon: '📸', color: '#C4A882', percentage: 10 },
  { name: 'Flowers & Decor', icon: '💐', color: '#7B9E87', percentage: 8 },
  { name: 'Music & Entertainment', icon: '🎵', color: '#9B8EC0', percentage: 7 },
  { name: 'Attire', icon: '👗', color: '#C08B8B', percentage: 5 },
  { name: 'Stationery', icon: '💌', color: '#A0C4B8', percentage: 3 },
  { name: 'Transportation', icon: '🚗', color: '#B0B0B0', percentage: 2 },
  { name: 'Favors & Gifts', icon: '🎁', color: '#D4A574', percentage: 3 },
  { name: 'Miscellaneous', icon: '✨', color: '#C0C0C0', percentage: 7 },
]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

export function BudgetSetupWizard({ weddingId, currentBudget, onComplete, onClose }: BudgetSetupWizardProps) {
  const { getToken } = useAuth()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [totalBudget, setTotalBudget] = useState(currentBudget?.toString() ?? '')
  const [allocations, setAllocations] = useState<CategoryAllocation[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSetBudget() {
    const budget = Number(totalBudget)
    if (!budget || budget <= 0) return

    const allocs: CategoryAllocation[] = DEFAULT_ALLOCATIONS.map((a) => ({
      name: a.name,
      icon: a.icon,
      color: a.color,
      percentage: a.percentage,
      amount: Math.round((a.percentage / 100) * budget),
    }))
    setAllocations(allocs)
    setStep(2)
  }

  function handleAllocationChange(index: number, newAmount: string) {
    setAllocations((prev) =>
      prev.map((item, i) => i === index ? { ...item, amount: Number(newAmount) || 0 } : item),
    )
  }

  function getAllocatedTotal(): number {
    return allocations.reduce((sum, a) => sum + a.amount, 0)
  }

  async function handleConfirm() {
    setError(null)
    setSaving(true)

    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')

      await api.budgetCategories.seedDefaults(weddingId, Number(totalBudget), token)
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-gray-900">Set Up Your Budget</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step indicators */}
        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-wedding-600' : 'bg-gray-200'}`}
            />
          ))}
        </div>

        {/* Step 1: Enter total budget */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              What is your total wedding budget? We will suggest category allocations based on common wedding spending patterns.
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Total Budget</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  placeholder="30,000"
                  min="0"
                  className="w-full rounded-xl border border-gray-300 py-2.5 pl-7 pr-3 text-sm text-gray-900"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSetBudget}
                disabled={!totalBudget || Number(totalBudget) <= 0}
                className="rounded-xl bg-wedding-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-wedding-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Adjust allocations */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Adjust allocations to fit your priorities.</p>
              <p className={`text-sm font-medium ${getAllocatedTotal() > Number(totalBudget) ? 'text-red-600' : 'text-gray-600'}`}>
                {formatCurrency(getAllocatedTotal())} / {formatCurrency(Number(totalBudget))}
              </p>
            </div>

            <div className="max-h-72 space-y-2 overflow-y-auto">
              {allocations.map((alloc, i) => (
                <div key={alloc.name} className="flex items-center gap-3">
                  <span className="w-6 text-center">{alloc.icon}</span>
                  <span className="w-36 text-sm text-gray-700">{alloc.name}</span>
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                    <input
                      type="number"
                      value={alloc.amount}
                      onChange={(e) => handleAllocationChange(i, e.target.value)}
                      min="0"
                      className="w-full rounded-lg border border-gray-300 py-1.5 pl-6 pr-2 text-sm text-gray-900"
                    />
                  </div>
                  <span className="w-10 text-right text-xs text-gray-500">
                    {Number(totalBudget) > 0 ? Math.round((alloc.amount / Number(totalBudget)) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="rounded-xl bg-wedding-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-wedding-700"
              >
                Review
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Review your budget setup before confirming.</p>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Total Budget</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(Number(totalBudget))}</span>
              </div>
              <div className="space-y-1.5">
                {allocations.map((alloc) => (
                  <div key={alloc.name} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {alloc.icon} {alloc.name}
                    </span>
                    <span className="font-medium text-gray-900">{formatCurrency(alloc.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="rounded-xl bg-wedding-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-wedding-700 disabled:opacity-50"
              >
                {saving ? 'Setting up...' : 'Confirm & Create'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
