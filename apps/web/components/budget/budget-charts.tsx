'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { CategoryBreakdown, MonthlySpending, SplitCostSummary } from '@planfortwo/types'

interface BudgetChartsProps {
  categoryBreakdown: CategoryBreakdown[]
  monthlySpending: MonthlySpending[]
  splits: SplitCostSummary | null
}

const PIE_COLORS = ['#8B7355', '#B5A088', '#C4A882', '#D4C4A8']

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function BudgetCharts({ categoryBreakdown, monthlySpending, splits }: BudgetChartsProps) {
  const barData = categoryBreakdown.map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + '...' : c.name,
    Allocated: c.allocated,
    Spent: c.spent,
    color: c.color,
  }))

  const lineData = monthlySpending.map((m) => ({
    month: m.month,
    Amount: m.amount,
  }))

  const pieData = splits
    ? [
        { name: 'Couple', value: splits.couple.total },
        { name: "Bride's Family", value: splits.brideFamily.total },
        { name: "Groom's Family", value: splits.groomFamily.total },
        { name: 'Other', value: splits.other.total },
      ].filter((d) => d.value > 0)
    : []

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {barData.length > 0 && (
        <div className="border-border bg-background rounded-2xl border p-6">
          <h3 className="text-foreground mb-4 text-sm font-semibold">Allocated vs Spent</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
              />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="Allocated" fill="#D4C4A8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Spent" fill="#8B7355" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {lineData.length > 0 && (
        <div className="border-border bg-background rounded-2xl border p-6">
          <h3 className="text-foreground mb-4 text-sm font-semibold">Monthly Spending</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
              />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Line
                type="monotone"
                dataKey="Amount"
                stroke="#8B7355"
                strokeWidth={2}
                dot={{ fill: '#8B7355', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {pieData.length > 0 && (
        <div className="border-border bg-background rounded-2xl border p-6">
          <h3 className="text-foreground mb-4 text-sm font-semibold">Split by Payer</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
