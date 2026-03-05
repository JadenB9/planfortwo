'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import type {
  BudgetCategory,
  BudgetItemWithCategory,
  PaymentStatus,
  Payer,
} from '@planfortwo/types'
import { createBudgetItemSchema, updateBudgetItemSchema } from '@planfortwo/validators'
import { api } from '@/lib/api'

interface ExpenseFormProps {
  weddingId: string
  categories: BudgetCategory[]
  editingItem?: BudgetItemWithCategory
  onClose: () => void
  onSaved: () => void
}

const PAYER_OPTIONS = [
  { value: 'couple', label: 'Couple' },
  { value: 'bride_family', label: "Bride's Family" },
  { value: 'groom_family', label: "Groom's Family" },
  { value: 'other', label: 'Other' },
]

const STATUS_OPTIONS = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
]

export function ExpenseForm({
  weddingId,
  categories,
  editingItem,
  onClose,
  onSaved,
}: ExpenseFormProps) {
  const { getToken } = useAuth()
  const isEditing = !!editingItem

  const [categoryId, setCategoryId] = useState(editingItem?.categoryId ?? categories[0]?.id ?? '')
  const [vendorName, setVendorName] = useState(editingItem?.vendorName ?? '')
  const [description, setDescription] = useState(editingItem?.description ?? '')
  const [amount, setAmount] = useState(editingItem?.amount?.toString() ?? '')
  const [paidAmount, setPaidAmount] = useState(editingItem?.paidAmount?.toString() ?? '0')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    editingItem?.paymentStatus ?? 'unpaid',
  )
  const [payer, setPayer] = useState<Payer>(editingItem?.payer ?? 'couple')
  const [dueDate, setDueDate] = useState(
    editingItem?.dueDate ? new Date(editingItem.dueDate).toISOString().split('T')[0] : '',
  )
  const [notes, setNotes] = useState(editingItem?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')

      const dueDateValue = dueDate ? new Date(dueDate).toISOString() : null

      if (isEditing) {
        const data = updateBudgetItemSchema.parse({
          categoryId,
          vendorName: vendorName || null,
          description,
          amount: Number(amount),
          paidAmount: Number(paidAmount),
          paymentStatus,
          payer,
          dueDate: dueDateValue,
          notes: notes || null,
        })
        await api.budgetItems.update(editingItem.id, weddingId, data, token)
      } else {
        const data = createBudgetItemSchema.parse({
          weddingId,
          categoryId,
          vendorName: vendorName || null,
          description,
          amount: Number(amount),
          paidAmount: Number(paidAmount),
          paymentStatus,
          payer,
          dueDate: dueDateValue,
          notes: notes || null,
        })
        await api.budgetItems.create(data, token)
      }

      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save expense')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Vendor Name</label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="e.g. The Grand Ballroom"
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900"
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Description *</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Venue rental fee"
                required
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Amount *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                required
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Paid Amount</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as typeof paymentStatus)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Payer</label>
              <select
                value={payer}
                onChange={(e) => setPayer(e.target.value as typeof payer)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900"
              >
                {PAYER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900"
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-wedding-600 hover:bg-wedding-700 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEditing ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
