import type { PaymentScheduleWithItem } from '@planfortwo/types'

interface PaymentCalendarProps {
  payments: PaymentScheduleWithItem[]
  onMarkPaid: (id: string) => void
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function isOverdue(date: Date): boolean {
  return new Date(date) < new Date()
}

export function PaymentCalendar({ payments, onMarkPaid }: PaymentCalendarProps) {
  const sorted = [...payments]
    .filter((p) => !p.isPaid)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  const paidPayments = payments.filter((p) => p.isPaid)

  if (payments.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6">
        <h3 className="text-sm font-semibold text-foreground">Payment Schedule</h3>
        <p className="mt-2 text-sm text-muted-foreground">No payments scheduled yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Upcoming Payments</h3>

      {sorted.length === 0 && <p className="text-sm text-muted-foreground">All payments are up to date.</p>}

      <div className="space-y-2">
        {sorted.map((payment) => {
          const overdue = isOverdue(payment.dueDate)

          return (
            <div
              key={payment.id}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                overdue ? 'border-red-200 bg-red-50' : 'border-border bg-white'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${overdue ? 'text-red-900' : 'text-foreground'}`}>
                  {payment.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {payment.budgetItem.vendorName ?? payment.budgetItem.description}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p
                    className={`text-sm font-medium ${overdue ? 'text-red-700' : 'text-foreground'}`}
                  >
                    {formatCurrency(payment.amount)}
                  </p>
                  <p
                    className={`text-xs ${overdue ? 'font-medium text-red-600' : 'text-muted-foreground'}`}
                  >
                    {overdue ? 'Overdue' : ''} {formatDate(payment.dueDate)}
                  </p>
                </div>
                <button
                  onClick={() => onMarkPaid(payment.id)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Mark Paid
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {paidPayments.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Paid ({paidPayments.length})
          </p>
          <div className="space-y-1">
            {paidPayments.slice(0, 5).map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-lg px-4 py-2 text-muted-foreground"
              >
                <p className="text-sm line-through">{payment.title}</p>
                <p className="text-sm">{formatCurrency(payment.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
