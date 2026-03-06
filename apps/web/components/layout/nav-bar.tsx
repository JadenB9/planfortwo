'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isSignedIn } = useAuth()

  return (
    <nav className="fixed top-0 z-50 w-full">
      <div className="mx-auto max-w-6xl px-5 py-4 sm:px-8">
        <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-5 py-2.5 shadow-sm backdrop-blur-lg">
          <Link href="/" className="font-serif text-lg font-bold tracking-tight text-gray-900">
            PlanForTwo
          </Link>

          {/* Desktop */}
          <div className="hidden items-center gap-8 sm:flex">
            <Link
              href="/features"
              className="text-[13px] font-medium tracking-wide text-gray-500 transition-colors hover:text-gray-900"
            >
              Features
            </Link>
            <Link
              href="/features#pricing"
              className="text-[13px] font-medium tracking-wide text-gray-500 transition-colors hover:text-gray-900"
            >
              Pricing
            </Link>
            {isSignedIn ? (
              <Button
                asChild
                size="sm"
                className="rounded-lg bg-gray-900 px-4 text-xs font-medium text-white hover:bg-gray-800"
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-[13px] font-medium tracking-wide text-gray-500 transition-colors hover:text-gray-900"
                >
                  Sign in
                </Link>
                <Button
                  asChild
                  size="sm"
                  className="rounded-lg bg-gray-900 px-4 text-xs font-medium text-white hover:bg-gray-800"
                >
                  <Link href="/sign-up">Start planning</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-gray-100 sm:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mt-2 rounded-2xl border border-white/60 bg-white/95 p-4 shadow-lg backdrop-blur-lg sm:hidden"
          >
            <div className="flex flex-col gap-3">
              <Link
                href="/features"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Features
              </Link>
              <Link
                href="/features#pricing"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Pricing
              </Link>
              {isSignedIn ? (
                <Button
                  asChild
                  className="mt-1 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                >
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                    Dashboard
                  </Link>
                </Button>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    Sign in
                  </Link>
                  <Button
                    asChild
                    className="mt-1 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                  >
                    <Link href="/sign-up" onClick={() => setMobileOpen(false)}>
                      Start planning
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  )
}
