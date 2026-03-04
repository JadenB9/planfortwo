'use client'

import { useState } from 'react'
import type { BudgetItemWithCategory, Payer, PaymentStatus } from '@planfortwo/types'

interface ExpenseTableProps {
  items: BudgetItemWithCategory[]
  onEdit: (item: BudgetItemWithCategory) => void
  onDelete: (id: string) => void
}

type SortField = 'vendorName' | 'amount' | 'paidAmount' | 'paymentStatus' | 'payer' | 'dueDate'
type SortDir = 'asc' | 'desc'

const PAYER_LABELS: Record<Payer, string> = {
  couple: 'Couple',
  bride_family: 'Bride\'s Family',
  groom_family: 'Groom\'s Family',
  other: 'Other',
}

const STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  deposit: 'Deposit',
  partial: 'Partial',
  paid: 'Paid',
}

const STATUS_COLORS: Record<PaymentStatus, string> = {
  unpaid: 'bg-gray-100 text-gray-700',
  deposit: 'bg-amber-100 text-amber-700',
  partial: 'bg-blue-100 text-blue-700',
  paid: 'bg-sage-100 text-sage-700',
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(date: Date | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function ExpenseTable({ items, onEdit, onDelete }: ExpenseTableProps) {
  const [sortField, setSortField] = useState<SortField>('vendorName')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sorted = [...items].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1
    switch (sortField) {
      case 'vendorName':
        return mul * (a.vendorName ?? '').localeCompare(b.vendorName ?? '')
      case 'amount':
        return mul * (a.amount - b.amount)
      case 'paidAmount':
        return mul * (a.paidAmount - b.paidAmount)
      case 'paymentStatus':
        return mul * a.paymentStatus.localeCompare(b.paymentStatus)
      case 'payer':
        return mul * a.payer.localeCompare(b.payer)
      case 'dueDate': {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : 0
        const db = b.dueDate ? new Date(b.dueDate).getTime() : 0
        return mul * (da - db)
      }
      default:
        return 0
    }
  })

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="ml-1 text-gray-300">&#8597;</span>
    return <span className="ml-1">{sortDir === 'asc' ? '&#8593;' : '&#8595;'}</span>
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm text-gray-500">No expenses yet. Add your first expense to get started.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th
              className="cursor-pointer px-4 py-3 font-medium text-gray-600"
              onClick={() => handleSort('vendorName')}
            >
              Vendor / Description <SortIcon field="vendorName" />
            </th>
            <th className="px-4 py-3 font-medium text-gray-600">Category</th>
            <th
              className="cursor-pointer px-4 py-3 text-right font-medium text-gray-600"
              onClick={() => handleSort('amount')}
            >
              Amount <SortIcon field="amount" />
            </th>
            <th
              className="cursor-pointer px-4 py-3 text-right font-medium text-gray-600"
              onClick={() => handleSort('paidAmount')}
            >
              Paid <SortIcon field="paidAmount" />
            </th>
            <th
              className="cursor-pointer px-4 py-3 font-medium text-gray-600"
              onClick={() => handleSort('paymentStatus')}
            >
              Status <SortIcon field="paymentStatus" />
            </th>
            <th
              className="cursor-pointer px-4 py-3 font-medium text-gray-600"
              onClick={() => handleSort('payer')}
            >
              Payer <SortIcon field="payer" />
            </th>
            <th
              className="cursor-pointer px-4 py-3 font-medium text-gray-600"
              onClick={() => handleSort('dueDate')}
            >
              Due Date <SortIcon field="dueDate" />
            </th>
            <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => (
            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{item.vendorName ?? item.description}</p>
                {item.vendorName && (
                  <p className="text-xs text-gray-500">{item.description}</p>
                )}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1 text-xs">
                  <span>{item.category.icon}</span>
                  <span className="text-gray-600">{item.category.name}</span>
                </span>
              </td>
              <td className="px-4 py-3 text-right font-medium text-gray-900">
                {formatCurrency(item.amount)}
              </td>
              <td className="px-4 py-3 text-right text-gray-600">
                {formatCurrency(item.paidAmount)}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[item.paymentStatus]}`}>
                  {STATUS_LABELS[item.paymentStatus]}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">{PAYER_LABELS[item.payer]}</td>
              <td className="px-4 py-3 text-gray-600">{formatDate(item.dueDate)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(item)}
                    className="text-xs font-medium text-wedding-600 hover:text-wedding-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
