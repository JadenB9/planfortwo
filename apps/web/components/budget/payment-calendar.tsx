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
      <div className="border-border bg-background rounded-2xl border p-6">
        <h3 className="text-foreground text-sm font-semibold">Payment Schedule</h3>
        <p className="text-muted-foreground mt-2 text-sm">No payments scheduled yet.</p>
      </div>
    )
  }

  return (
    <div className="border-border bg-background rounded-2xl border p-6">
      <h3 className="text-foreground mb-4 text-sm font-semibold">Upcoming Payments</h3>

      {sorted.length === 0 && (
        <p className="text-muted-foreground text-sm">All payments are up to date.</p>
      )}

      <div className="space-y-2">
        {sorted.map((payment) => {
          const overdue = isOverdue(payment.dueDate)

          return (
            <div
              key={payment.id}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                overdue ? 'border-red-200 bg-red-50' : 'border-border bg-background'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${overdue ? 'text-red-900' : 'text-foreground'}`}
                >
                  {payment.title}
                </p>
                <p className="text-muted-foreground text-xs">
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
                  className="border-border text-foreground hover:bg-muted rounded-lg border px-3 py-1.5 text-xs font-medium"
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
          <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wider">
            Paid ({paidPayments.length})
          </p>
          <div className="space-y-1">
            {paidPayments.slice(0, 5).map((payment) => (
              <div
                key={payment.id}
                className="text-muted-foreground flex items-center justify-between rounded-lg px-4 py-2"
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
