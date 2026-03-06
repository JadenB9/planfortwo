'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { springSmooth } from '@/lib/animations'

export default function UpgradeSuccessPage() {
  return (
    <motion.div
      className="mx-auto flex max-w-lg flex-col items-center py-16 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ...springSmooth }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
      >
        <CheckCircle className="text-wedding-600 h-16 w-16" />
      </motion.div>

      <h1 className="mt-6 font-serif text-3xl font-bold text-gray-900">You&apos;re all set!</h1>
      <p className="mt-3 text-gray-600">
        Your payment was successful. You now have full access to every PlanForTwo feature. Start
        planning your perfect wedding!
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/dashboard"
          className="bg-wedding-600 hover:bg-wedding-700 flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors"
        >
          Go to Dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/checklist"
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          Start Your Checklist
        </Link>
      </div>
    </motion.div>
  )
}
