'use client'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-center text-gray-500">
        We couldn&apos;t load this wedding website. Please try again later.
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-800"
      >
        Try again
      </button>
    </div>
  )
}
