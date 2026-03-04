import type { BudgetAnalytics } from '@planfortwo/types'

interface BudgetOverviewProps {
  analytics: BudgetAnalytics | null
  budgetTotal: number | null
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

export function BudgetOverview({ analytics, budgetTotal }: BudgetOverviewProps) {
  const total = analytics?.totalBudget ?? budgetTotal ?? 0
  const spent = analytics?.totalSpent ?? 0
  const remaining = total - spent
  const percentUsed = total > 0 ? Math.round((spent / total) * 100) : 0
  const isOverBudget = remaining < 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-600">Total Budget</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-600">Spent</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(spent)}</p>
        {analytics && (
          <p className="mt-1 text-xs text-gray-500">
            {formatCurrency(analytics.totalPaid)} paid
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-600">Remaining</p>
        <p className={`mt-2 text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-sage-700'}`}>
          {formatCurrency(remaining)}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-600">Budget Used</p>
        <p className={`mt-2 text-2xl font-bold ${percentUsed > 100 ? 'text-red-600' : percentUsed > 80 ? 'text-amber-600' : 'text-sage-700'}`}>
          {percentUsed}%
        </p>
        <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
          <div
            className={`h-2 rounded-full transition-all ${percentUsed > 100 ? 'bg-red-500' : percentUsed > 80 ? 'bg-amber-500' : 'bg-sage-500'}`}
            style={{ width: `${Math.min(percentUsed, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
