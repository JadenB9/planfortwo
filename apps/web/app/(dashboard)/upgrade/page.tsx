'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, ArrowLeft, Sparkles } from 'lucide-react'
import { fadeInUp, staggerContainer, springSmooth } from '@/lib/animations'

const FREE_FEATURES = [
  'Checklist with default tasks',
  'Up to 15 guests',
  '1 website template',
  'Basic budget tracking',
  'Partner collaboration',
]

const FULL_FEATURES = [
  'Everything in Free',
  'Unlimited guests & households',
  'All 10 website templates',
  'Full budget analytics & reports',
  'CSV & PDF export',
  'Receipt uploads (Cloudflare R2)',
  'Seating chart builder',
  'Vendor management',
  'Music & photo management',
  'Registry integration',
  'Custom domain for wedding site',
  'Priority email support',
]

export default function UpgradePage() {
  return (
    <motion.div
      className="mx-auto max-w-4xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ...springSmooth }}
    >
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-10 text-center">
        <h1 className="font-serif text-3xl font-bold text-gray-900">Choose Your Plan</h1>
        <p className="mt-2 text-gray-600">
          Unlock every feature and plan your perfect day without limits.
        </p>
      </div>

      <motion.div
        className="grid gap-8 md:grid-cols-2"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Free Plan */}
        <motion.div
          variants={fadeInUp}
          transition={{ duration: 0.4, ...springSmooth }}
          className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
        >
          <h2 className="font-serif text-xl font-semibold text-gray-900">Free</h2>
          <p className="mt-1 text-sm text-gray-500">Get started with the basics</p>
          <p className="mt-6">
            <span className="font-serif text-4xl font-bold text-gray-900">$0</span>
            <span className="ml-1 text-sm text-gray-500">forever</span>
          </p>

          <div className="mt-6 rounded-xl bg-gray-50 px-4 py-2.5 text-center text-sm font-medium text-gray-500">
            Current Plan
          </div>

          <ul className="mt-8 space-y-3">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-700">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                {feature}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Full Plan */}
        <motion.div
          variants={fadeInUp}
          transition={{ duration: 0.4, ...springSmooth }}
          className="border-wedding-600 relative rounded-2xl border-2 bg-white p-8 shadow-md"
        >
          <div className="bg-wedding-600 absolute -top-3 left-6 rounded-full px-3 py-0.5 text-xs font-semibold text-white">
            Recommended
          </div>

          <h2 className="font-serif text-xl font-semibold text-gray-900">Full Plan</h2>
          <p className="mt-1 text-sm text-gray-500">Everything you need, no limits</p>
          <p className="mt-6">
            <span className="font-serif text-4xl font-bold text-gray-900">$200</span>
            <span className="ml-1 text-sm text-gray-500">one-time</span>
          </p>

          <button className="bg-wedding-600 hover:bg-wedding-700 mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors">
            <Sparkles className="h-4 w-4" />
            Purchase Full Plan
          </button>

          <ul className="mt-8 space-y-3">
            {FULL_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-700">
                <Check className="text-wedding-600 mt-0.5 h-4 w-4 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </motion.div>
      </motion.div>

      <p className="mt-8 text-center text-xs text-gray-400">
        Payment handled securely through Stripe. One-time purchase, no recurring fees.
      </p>
    </motion.div>
  )
}
