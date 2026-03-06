'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, Sparkles, ArrowRight } from 'lucide-react'
import { springSmooth } from '@/lib/animations'
import { useWedding } from '@/hooks/use-wedding'

const ALLOWED_FREE_PATHS = ['/dashboard', '/upgrade', '/settings', '/onboarding']

export function Paywall({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data, loading } = useWedding()
  const tier = data?.wedding.tier

  if (loading) return <>{children}</>

  const isAllowed = ALLOWED_FREE_PATHS.some((p) => pathname.startsWith(p))
  if (tier === 'full' || isAllowed) return <>{children}</>

  return (
    <motion.div
      className="mx-auto flex max-w-lg flex-col items-center py-20 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ...springSmooth }}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
        <Lock className="h-8 w-8 text-amber-600" />
      </div>

      <h2 className="mt-6 font-serif text-2xl font-bold text-gray-900">Full Plan Required</h2>
      <p className="mt-3 max-w-sm text-gray-600">
        This feature is available on the Full Plan. Upgrade for a one-time payment of $200 to unlock
        unlimited access to every PlanForTwo feature.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/upgrade"
          className="bg-wedding-600 hover:bg-wedding-700 flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          Upgrade Now
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          Back to Dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.div>
  )
}
