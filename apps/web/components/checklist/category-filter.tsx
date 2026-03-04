'use client'

import type { CategoryWithCount } from '@planfortwo/types'

interface CategoryFilterProps {
  categories: CategoryWithCount[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function CategoryFilter({ categories, selectedId, onSelect }: CategoryFilterProps) {
  const totalTasks = categories.reduce((sum, c) => sum + c.taskCount, 0)
  const totalCompleted = categories.reduce((sum, c) => sum + c.completedCount, 0)

  return (
    <div className="space-y-1">
      <button
        onClick={() => onSelect(null)}
        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
          selectedId === null ? 'bg-wedding-50 text-wedding-700' : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <span>All Tasks</span>
        <span className="text-xs text-gray-500">
          {totalCompleted}/{totalTasks}
        </span>
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
            selectedId === category.id ? 'bg-wedding-50 text-wedding-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span
            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          <span className="flex-1 truncate">{category.name}</span>
          <span className="text-xs text-gray-500">
            {category.completedCount}/{category.taskCount}
          </span>
        </button>
      ))}
    </div>
  )
}
