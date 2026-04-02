import type { TipSuggestion } from '@planfortwo/types'

interface TipCalculatorProps {
  tips: TipSuggestion[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function TipCalculator({ tips }: TipCalculatorProps) {
  if (tips.length === 0) {
    return (
      <div className="border-border bg-background rounded-2xl border p-6">
        <h3 className="text-foreground text-sm font-semibold">Tip Suggestions</h3>
        <p className="text-muted-foreground mt-2 text-sm">Add vendors to see tip suggestions.</p>
      </div>
    )
  }

  return (
    <div className="border-border bg-background rounded-2xl border p-6">
      <h3 className="text-foreground mb-4 text-sm font-semibold">Tip Suggestions</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-border border-b">
              <th className="text-muted-foreground pb-2 font-medium">Vendor Type</th>
              <th className="text-muted-foreground pb-2 text-right font-medium">Suggested</th>
              <th className="text-muted-foreground pb-2 text-right font-medium">%</th>
              <th className="text-muted-foreground pb-2 text-right font-medium">Range</th>
            </tr>
          </thead>
          <tbody>
            {tips.map((tip) => (
              <tr key={tip.vendorType} className="border-border border-b">
                <td className="text-foreground py-2.5 font-medium">{tip.vendorType}</td>
                <td className="text-foreground py-2.5 text-right">
                  {formatCurrency(tip.suggestedAmount)}
                </td>
                <td className="text-muted-foreground py-2.5 text-right">{tip.suggestedPercent}%</td>
                <td className="text-muted-foreground py-2.5 text-right">
                  {formatCurrency(tip.min)} - {formatCurrency(tip.max)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
