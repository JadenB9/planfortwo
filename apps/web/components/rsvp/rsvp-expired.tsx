'use client'

interface RsvpExpiredProps {
  weddingName: string
  deadline: Date | null
}

export function RsvpExpired({ weddingName, deadline }: RsvpExpiredProps) {
  const formattedDeadline = deadline
    ? new Date(deadline).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <div className="border-border bg-background rounded-2xl border p-8 text-center shadow-sm">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
        <svg
          className="h-8 w-8 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h2 className="text-foreground font-serif text-2xl font-bold">RSVP Deadline Has Passed</h2>

      <p className="text-muted-foreground mt-3">
        The RSVP deadline for <span className="text-wedding-600 font-semibold">{weddingName}</span>{' '}
        has passed.
      </p>

      {formattedDeadline && (
        <p className="text-muted-foreground mt-2 text-sm">The deadline was {formattedDeadline}</p>
      )}

      <div className="mt-8 rounded-xl bg-amber-50 px-6 py-4">
        <p className="text-sm text-amber-800">
          If you still need to respond, please contact the couple directly.
        </p>
      </div>
    </div>
  )
}
