import type { SplitCostSummary } from '@planfortwo/types'

interface SplitCostsProps {
  splits: SplitCostSummary
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

const PAYER_GROUPS = [
  { key: 'couple' as const, label: 'Couple', color: 'bg-wedding-500' },
  { key: 'brideFamily' as const, label: "Bride's Family", color: 'bg-sage-500' },
  { key: 'groomFamily' as const, label: "Groom's Family", color: 'bg-amber-500' },
  { key: 'other' as const, label: 'Other', color: 'bg-gray-400' },
]

export function SplitCosts({ splits }: SplitCostsProps) {
  const grandTotal = splits.couple.total + splits.brideFamily.total + splits.groomFamily.total + splits.other.total

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">Cost Split Summary</h3>

      {grandTotal === 0 ? (
        <p className="text-sm text-gray-500">No expenses recorded yet.</p>
      ) : (
        <div className="space-y-4">
          {/* Stacked bar */}
          <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-200">
            {PAYER_GROUPS.map((group) => {
              const pct = splits[group.key].percentage
              if (pct === 0) return null
              return (
                <div
                  key={group.key}
                  className={`${group.color} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${group.label}: ${pct}%`}
                />
              )
            })}
          </div>

          {/* Detail rows */}
          <div className="space-y-2">
            {PAYER_GROUPS.map((group) => (
              <div key={group.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${group.color}`} />
                  <span className="text-sm text-gray-700">{group.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(splits[group.key].total)}
                  </span>
                  <span className="w-12 text-right text-xs text-gray-500">
                    {splits[group.key].percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Total</span>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
