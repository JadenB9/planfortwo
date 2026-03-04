interface EmptyStateProps {
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
      <h3 className="font-serif text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-gray-600">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 rounded-xl bg-wedding-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-wedding-700"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
