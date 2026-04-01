'use client'

import { useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import type { BudgetAnalytics } from '@planfortwo/types'

interface BudgetOverviewProps {
  analytics: BudgetAnalytics | null
  budgetTotal: number | null
  onEditBudget?: (newAmount: number) => Promise<void>
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function BudgetOverview({ analytics, budgetTotal, onEditBudget }: BudgetOverviewProps) {
  const total = analytics?.totalBudget ?? budgetTotal ?? 0
  const spent = analytics?.totalSpent ?? 0
  const remaining = total - spent
  const percentUsed = total > 0 ? Math.round((spent / total) * 100) : 0
  const isOverBudget = remaining < 0

  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  function startEdit() {
    setEditValue(String(total))
    setEditing(true)
  }

  async function saveEdit() {
    const parsed = parseFloat(editValue)
    if (isNaN(parsed) || parsed < 0 || !onEditBudget) return
    setSaving(true)
    try {
      await onEditBudget(parsed)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-border bg-white p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Total Budget</p>
          {onEditBudget && !editing && (
            <button
              onClick={startEdit}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-muted-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {editing ? (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">$</span>
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="focus:border-wedding-600 focus:ring-wedding-600 w-full rounded-lg border border-border px-2 py-1 text-lg font-bold text-foreground focus:outline-none focus:ring-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') void saveEdit()
                if (e.key === 'Escape') setEditing(false)
              }}
            />
            <button
              onClick={() => void saveEdit()}
              disabled={saving}
              className="text-sage-600 hover:bg-sage-50 rounded-lg p-1"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(total)}</p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-white p-6">
        <p className="text-sm text-muted-foreground">Spent</p>
        <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(spent)}</p>
        {analytics && (
          <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(analytics.totalPaid)} paid</p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-white p-6">
        <p className="text-sm text-muted-foreground">Remaining</p>
        <p className={`mt-2 text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-sage-700'}`}>
          {formatCurrency(remaining)}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6">
        <p className="text-sm text-muted-foreground">Budget Used</p>
        <p
          className={`mt-2 text-2xl font-bold ${percentUsed > 100 ? 'text-red-600' : percentUsed > 80 ? 'text-amber-600' : 'text-sage-700'}`}
        >
          {percentUsed}%
        </p>
        <div className="mt-2 h-2 w-full rounded-full bg-muted">
          <div
            className={`h-2 rounded-full transition-all ${percentUsed > 100 ? 'bg-red-500' : percentUsed > 80 ? 'bg-amber-500' : 'bg-sage-500'}`}
            style={{ width: `${Math.min(percentUsed, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
