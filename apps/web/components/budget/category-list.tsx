import type { BudgetCategory, CategoryBreakdown } from '@planfortwo/types'

interface CategoryListProps {
  categories: BudgetCategory[]
  breakdown: CategoryBreakdown[]
  selectedCategoryId: string | null
  onSelect: (categoryId: string | null) => void
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function CategoryList({
  categories,
  breakdown,
  selectedCategoryId,
  onSelect,
}: CategoryListProps) {
  const breakdownMap = new Map(breakdown.map((b) => [b.categoryId, b]))

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {/* All categories button */}
      <button
        onClick={() => onSelect(null)}
        className={`rounded-2xl border p-4 text-left transition-colors ${
          selectedCategoryId === null
            ? 'border-wedding-300 bg-wedding-50'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        <p className="text-sm font-medium text-gray-900">All Categories</p>
        <p className="mt-1 text-xs text-gray-500">{categories.length} categories</p>
      </button>

      {categories.map((cat) => {
        const stats = breakdownMap.get(cat.id)
        const spent = stats?.spent ?? 0
        const allocated = cat.allocatedAmount
        const percent = allocated > 0 ? Math.round((spent / allocated) * 100) : 0
        const isActive = selectedCategoryId === cat.id

        return (
          <button
            key={cat.id}
            onClick={() => onSelect(isActive ? null : cat.id)}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              isActive
                ? 'border-wedding-300 bg-wedding-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{cat.icon}</span>
              <p className="text-sm font-medium text-gray-900">{cat.name}</p>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <p className="text-xs text-gray-500">
                {formatCurrency(spent)} / {formatCurrency(allocated)}
              </p>
              <p
                className={`text-xs font-medium ${percent > 100 ? 'text-red-600' : percent > 80 ? 'text-amber-600' : 'text-gray-600'}`}
              >
                {percent}%
              </p>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-200">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: `${Math.min(percent, 100)}%`,
                  backgroundColor: cat.color,
                }}
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}
