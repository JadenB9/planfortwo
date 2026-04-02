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
    <div className="border-border bg-background flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center">
      <h3 className="text-foreground font-serif text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-wedding-600 hover:bg-wedding-700 mt-6 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
