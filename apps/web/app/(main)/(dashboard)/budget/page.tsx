'use client'

import { useState, useCallback, Suspense } from 'react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { springSmooth } from '@/lib/animations'
import { useWedding } from '@/hooks/use-wedding'
import { useFeatures } from '@/hooks/use-features'
import { useBudget } from '@/hooks/use-budget'
import { api } from '@/lib/api'
import type { BudgetItemWithCategory } from '@planfortwo/types'
import { BudgetOverview } from '@/components/budget/budget-overview'
import { CategoryList } from '@/components/budget/category-list'
import { ExpenseTable } from '@/components/budget/expense-table'
import { ExpenseForm } from '@/components/budget/expense-form'
import { BudgetCharts } from '@/components/budget/budget-charts'
import { PaymentCalendar } from '@/components/budget/payment-calendar'
import { TipCalculator } from '@/components/budget/tip-calculator'
import { SplitCosts } from '@/components/budget/split-costs'
import { BudgetSetupWizard } from '@/components/budget/budget-setup-wizard'
import { useTabParam } from '@/hooks/use-tab-param'

type Tab = 'overview' | 'expenses' | 'payments' | 'analytics' | 'tips'
const VALID_TAB_KEYS: Tab[] = ['overview', 'expenses', 'payments', 'analytics', 'tips']

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'payments', label: 'Payments' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'tips', label: 'Tips & Splits' },
]

export default function BudgetPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
        </div>
      }
    >
      <BudgetPageInner />
    </Suspense>
  )
}

function BudgetPageInner() {
  const { getToken } = useAuth()
  const { data: weddingData, loading: weddingLoading } = useWedding()
  const weddingId = weddingData?.wedding.id ?? null
  const { features, loading: featuresLoading } = useFeatures(weddingId)

  const {
    categories,
    items,
    analytics,
    payments,
    tips,
    splits,
    loading: budgetLoading,
    filters,
    updateFilters,
    refetch,
  } = useBudget({ weddingId })

  const [activeTab, setActiveTab] = useTabParam<Tab>('tab', 'overview', VALID_TAB_KEYS)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editingItem, setEditingItem] = useState<BudgetItemWithCategory | undefined>(undefined)
  const [showSetupWizard, setShowSetupWizard] = useState(false)

  const handleEditBudget = useCallback(
    async (newAmount: number) => {
      if (!weddingId) return
      const token = await getToken()
      if (!token) return
      await api.weddings.update(weddingId, { budgetTotal: newAmount }, token)
      toast.success('Budget updated')
      void refetch()
    },
    [weddingId, getToken, refetch],
  )

  const handleDeleteExpense = useCallback(
    async (id: string) => {
      if (!weddingId) return
      try {
        const token = await getToken()
        if (!token) return
        await api.budgetItems.delete(id, weddingId, token)
        toast.success('Expense deleted')
        void refetch()
      } catch {
        toast.error('Failed to delete expense')
      }
    },
    [weddingId, getToken, refetch],
  )

  const handleMarkPaid = useCallback(
    async (paymentId: string) => {
      if (!weddingId) return
      try {
        const token = await getToken()
        if (!token) return
        await api.paymentSchedule.update(
          paymentId,
          weddingId,
          {
            isPaid: true,
            paidDate: new Date().toISOString(),
          },
          token,
        )
        toast.success('Payment marked as paid')
        void refetch()
      } catch {
        toast.error('Failed to update payment')
      }
    },
    [weddingId, getToken, refetch],
  )

  const handleExportCsv = useCallback(async () => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      const csv = await api.budgetAnalytics.exportCsv(weddingId, token)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'budget-export.csv'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV exported')
    } catch {
      toast.error('Failed to export CSV')
    }
  }, [weddingId, getToken])

  const isLoading = weddingLoading || featuresLoading || budgetLoading

  if (isLoading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
      </div>
    )
  }

  // Show setup wizard prompt if no categories yet
  const needsSetup = categories.length === 0

  return (
    <motion.div
      className="mx-auto max-w-6xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ...springSmooth }}
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Budget</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track every dollar for your wedding.</p>
        </div>

        <div className="flex items-center gap-3">
          {features?.canBudgetExport && (
            <button
              onClick={handleExportCsv}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Export CSV
            </button>
          )}
          {features?.canBudgetExpenses && !needsSetup && (
            <button
              onClick={() => {
                setEditingItem(undefined)
                setShowExpenseForm(true)
              }}
              className="bg-wedding-600 hover:bg-wedding-700 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
            >
              Add Expense
            </button>
          )}
        </div>
      </div>

      {needsSetup ? (
        <div className="rounded-2xl border border-border bg-white p-8 text-center">
          <div className="bg-wedding-50 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <svg
              className="text-wedding-600 h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="font-serif text-xl font-semibold text-foreground">Set Up Your Budget</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Get started by entering your total budget. We will suggest category allocations based on
            common wedding spending patterns.
          </p>
          <button
            onClick={() => setShowSetupWizard(true)}
            className="bg-wedding-600 hover:bg-wedding-700 mt-6 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm"
          >
            Get Started
          </button>
        </div>
      ) : (
        <>
          {/* Budget overview stats */}
          <BudgetOverview
            analytics={analytics}
            budgetTotal={weddingData?.wedding.budgetTotal ?? null}
            onEditBudget={handleEditBudget}
          />

          {/* Tab navigation */}
          <div className="mt-6 border-b border-border">
            <nav className="-mb-px flex gap-6">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'border-wedding-600 text-wedding-600'
                      : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab content */}
          <div className="mt-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <CategoryList
                  categories={categories}
                  breakdown={analytics?.categoryBreakdown ?? []}
                  selectedCategoryId={filters.categoryId ?? null}
                  onSelect={(id) => {
                    updateFilters({ categoryId: id ?? undefined })
                    setActiveTab('expenses')
                  }}
                />
                {payments.length > 0 && (
                  <PaymentCalendar payments={payments} onMarkPaid={handleMarkPaid} />
                )}
              </div>
            )}

            {activeTab === 'expenses' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={filters.categoryId ?? ''}
                    onChange={(e) => updateFilters({ categoryId: e.target.value || undefined })}
                    className="rounded-xl border border-border px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.paymentStatus ?? ''}
                    onChange={(e) => updateFilters({ paymentStatus: e.target.value || undefined })}
                    className="rounded-xl border border-border px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">All Statuses</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="deposit">Deposit</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>

                  <select
                    value={filters.payer ?? ''}
                    onChange={(e) => updateFilters({ payer: e.target.value || undefined })}
                    className="rounded-xl border border-border px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">All Payers</option>
                    <option value="couple">Couple</option>
                    <option value="bride_family">Bride&apos;s Family</option>
                    <option value="groom_family">Groom&apos;s Family</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <ExpenseTable
                  items={items}
                  onEdit={(item) => {
                    setEditingItem(item)
                    setShowExpenseForm(true)
                  }}
                  onDelete={handleDeleteExpense}
                />
              </div>
            )}

            {activeTab === 'payments' && (
              <PaymentCalendar payments={payments} onMarkPaid={handleMarkPaid} />
            )}

            {activeTab === 'analytics' && analytics && (
              <BudgetCharts
                categoryBreakdown={analytics.categoryBreakdown}
                monthlySpending={analytics.monthlySpending}
                splits={splits}
              />
            )}

            {activeTab === 'analytics' && !analytics && (
              <div className="rounded-2xl border border-border bg-white p-8 text-center">
                <p className="text-sm text-muted-foreground">Add some expenses to see analytics.</p>
              </div>
            )}

            {activeTab === 'tips' && (
              <div className="grid gap-6 lg:grid-cols-2">
                <TipCalculator tips={tips} />
                {splits && <SplitCosts splits={splits} />}
              </div>
            )}
          </div>
        </>
      )}

      {/* Expense form modal */}
      {showExpenseForm && weddingId && (
        <ExpenseForm
          weddingId={weddingId}
          categories={categories}
          editingItem={editingItem}
          onClose={() => {
            setShowExpenseForm(false)
            setEditingItem(undefined)
          }}
          onSaved={() => void refetch()}
        />
      )}

      {/* Setup wizard modal */}
      {showSetupWizard && weddingId && (
        <BudgetSetupWizard
          weddingId={weddingId}
          currentBudget={weddingData?.wedding.budgetTotal ?? null}
          onComplete={() => {
            setShowSetupWizard(false)
            void refetch()
          }}
          onClose={() => setShowSetupWizard(false)}
        />
      )}
    </motion.div>
  )
}
