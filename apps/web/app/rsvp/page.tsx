import type { Metadata } from 'next'
import { RsvpEntry } from '@/components/rsvp/rsvp-entry'

export const metadata: Metadata = {
  title: 'RSVP | PlanForTwo',
  description: 'Respond to your wedding invitation',
}

export default function RsvpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-cream-50 to-white px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-serif text-4xl font-bold text-gray-900">RSVP</h1>
          <p className="mt-3 text-gray-600">
            Please let us know if you can make it
          </p>
        </div>

        {/* Entry Form */}
        <RsvpEntry />

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-400">
          Powered by PlanForTwo
        </p>
      </div>
    </main>
  )
}
