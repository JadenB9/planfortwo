import type { TipSuggestion } from '@planfortwo/types'

interface TipCalculatorProps {
  tips: TipSuggestion[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

export function TipCalculator({ tips }: TipCalculatorProps) {
  if (tips.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-900">Tip Suggestions</h3>
        <p className="mt-2 text-sm text-gray-500">Add vendors to see tip suggestions.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">Tip Suggestions</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-2 font-medium text-gray-600">Vendor Type</th>
              <th className="pb-2 text-right font-medium text-gray-600">Suggested</th>
              <th className="pb-2 text-right font-medium text-gray-600">%</th>
              <th className="pb-2 text-right font-medium text-gray-600">Range</th>
            </tr>
          </thead>
          <tbody>
            {tips.map((tip) => (
              <tr key={tip.vendorType} className="border-b border-gray-100">
                <td className="py-2.5 font-medium text-gray-900">{tip.vendorType}</td>
                <td className="py-2.5 text-right text-gray-700">{formatCurrency(tip.suggestedAmount)}</td>
                <td className="py-2.5 text-right text-gray-500">{tip.suggestedPercent}%</td>
                <td className="py-2.5 text-right text-gray-500">
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
