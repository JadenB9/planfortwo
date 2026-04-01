'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { Check, ArrowLeft, Loader2, ChevronDown, Gift } from 'lucide-react'
import { toast } from 'sonner'
import { fadeInUp, staggerContainer, springSmooth } from '@/lib/animations'
import { useWedding, notifyWeddingUpdated } from '@/hooks/use-wedding'
import { api } from '@/lib/api'

const FREE_FEATURES = [
  'Full checklist with custom tasks',
  'Unlimited guests & households',
  'Complete budget tracking & analytics',
  'Vendor management',
  'Events & timeline planning',
  'Registry & gift tracking',
  'Ceremony & vow planning',
  'Honeymoon planning',
  'RSVP tracking & management',
  'CSV & PDF data export',
  'Partner collaboration',
]

const FULL_FEATURES = [
  'Everything in Free',
  'Website builder & customization',
  'All 10 website templates',
  'Website visitor analytics',
  'Custom seating chart builder',
  'Inbox & email system',
  'Spotify music integration',
  'Photo gallery & uploads',
  'Email campaigns & messaging',
  'Custom domain for wedding site',
  'Every future premium feature',
]

export default function UpgradePage() {
  return (
    <Suspense>
      <UpgradePageContent />
    </Suspense>
  )
}

function UpgradePageContent() {
  const { getToken } = useAuth()
  const { data: weddingData, refetch } = useWedding()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const canceled = searchParams.get('canceled') === 'true'
  const tier = weddingData?.wedding.tier

  async function handleRedeemPromo() {
    if (!weddingData?.wedding.id || !promoCode.trim()) return
    setPromoLoading(true)
    setError(null)

    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')
      await api.purchases.redeemPromo(weddingData.wedding.id, promoCode.trim(), token)
      toast.success('Promo code applied! You now have full access.')
      setPromoCode('')
      setPromoOpen(false)
      await refetch()
      notifyWeddingUpdated()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid promo code'
      setError(msg)
    } finally {
      setPromoLoading(false)
    }
  }

  async function handleCheckout() {
    if (!weddingData?.wedding.id) return
    setLoading(true)
    setError(null)

    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')
      const { data } = await api.purchases.checkout(weddingData.wedding.id, token)
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
      setLoading(false)
    }
  }

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

      {canceled && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
          Checkout was canceled. You can try again whenever you&apos;re ready.
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-800">
          {error}
        </div>
      )}

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
            {tier === 'free' ? 'Current Plan' : 'Limited Access'}
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
          className="border-wedding-600 relative rounded-2xl border-2 bg-white p-8 shadow-sm"
        >
          <div className="bg-wedding-600 absolute -top-3 left-6 rounded-full px-3 py-0.5 text-xs font-semibold text-white">
            Best Value
          </div>

          <h2 className="font-serif text-xl font-semibold text-gray-900">Full Plan</h2>
          <p className="mt-1 text-sm text-gray-500">Everything you need, no limits</p>
          <p className="mt-6">
            <span className="font-serif text-4xl font-bold text-gray-900">$10</span>
            <span className="ml-1 text-sm text-gray-500">one-time</span>
          </p>

          {tier === 'full' ? (
            <div className="bg-sage-50 border-sage-200 text-sage-700 mt-6 rounded-xl border px-4 py-2.5 text-center text-sm font-medium">
              Active — Full Access
            </div>
          ) : (
            <button
              onClick={handleCheckout}
              disabled={loading || !weddingData}
              className="bg-wedding-600 hover:bg-wedding-700 mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting to Stripe...
                </>
              ) : (
                <>Purchase Full Plan</>
              )}
            </button>
          )}

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

      {tier !== 'full' && (
        <div className="mt-8">
          <button
            onClick={() => setPromoOpen(!promoOpen)}
            className="mx-auto flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
          >
            <Gift className="h-4 w-4" />
            Have a promo code?
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${promoOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {promoOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 flex items-center justify-center gap-2"
            >
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRedeemPromo()}
                placeholder="Enter code"
                className="focus:border-wedding-300 focus:ring-wedding-100 w-48 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2"
              />
              <button
                onClick={handleRedeemPromo}
                disabled={promoLoading || !promoCode.trim()}
                className="bg-wedding-600 hover:bg-wedding-700 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
              </button>
            </motion.div>
          )}
        </div>
      )}

      <p className="mt-8 text-center text-xs text-gray-400">
        Payment handled securely through Stripe. One-time purchase, no recurring fees.
      </p>
    </motion.div>
  )
}
