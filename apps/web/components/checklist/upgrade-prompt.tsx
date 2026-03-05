interface UpgradePromptProps {
  message: string
  className?: string
}

export function UpgradePrompt({ message, className = '' }: UpgradePromptProps) {
  return (
    <div
      className={`border-wedding-200 bg-wedding-100 text-wedding-700 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${className}`}
    >
      <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
      <span>{message}</span>
      <span className="ml-auto font-semibold underline">Upgrade to unlock</span>
    </div>
  )
}
