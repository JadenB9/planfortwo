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
            : 'border-border bg-background hover:border-border'
        }`}
      >
        <p className="text-foreground text-sm font-medium">All Categories</p>
        <p className="text-muted-foreground mt-1 text-xs">{categories.length} categories</p>
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
                : 'border-border bg-background hover:border-border'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{cat.icon}</span>
              <p className="text-foreground text-sm font-medium">{cat.name}</p>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <p className="text-muted-foreground text-xs">
                {formatCurrency(spent)} / {formatCurrency(allocated)}
              </p>
              <p
                className={`text-xs font-medium ${percent > 100 ? 'text-red-600' : percent > 80 ? 'text-amber-600' : 'text-muted-foreground'}`}
              >
                {percent}%
              </p>
            </div>
            <div className="bg-muted mt-1.5 h-1.5 w-full rounded-full">
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
