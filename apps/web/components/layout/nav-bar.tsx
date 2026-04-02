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
        <div className="border-border/60 bg-background/70 flex items-center justify-between rounded-2xl border px-5 py-2.5 shadow-sm backdrop-blur-lg">
          <Link href="/" className="text-foreground font-serif text-lg font-bold tracking-tight">
            PlanForTwo
          </Link>

          {/* Desktop */}
          <div className="hidden items-center gap-8 sm:flex">
            <Link
              href="/features"
              className="text-muted-foreground hover:text-foreground text-[13px] font-medium tracking-wide transition-colors"
            >
              Features
            </Link>
            <Link
              href="/features#pricing"
              className="text-muted-foreground hover:text-foreground text-[13px] font-medium tracking-wide transition-colors"
            >
              Pricing
            </Link>
            {isSignedIn ? (
              <Button
                asChild
                size="sm"
                className="bg-foreground text-background hover:bg-foreground/90 rounded-lg px-4 text-xs font-medium"
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-muted-foreground hover:text-foreground text-[13px] font-medium tracking-wide transition-colors"
                >
                  Sign in
                </Link>
                <Button
                  asChild
                  size="sm"
                  className="bg-foreground text-background hover:bg-foreground/90 rounded-lg px-4 text-xs font-medium"
                >
                  <Link href="/sign-up">Start planning</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-muted-foreground hover:bg-muted rounded-lg p-1.5 transition-colors sm:hidden"
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
            className="border-border/60 bg-background/95 mt-2 rounded-2xl border p-4 shadow-lg backdrop-blur-lg sm:hidden"
          >
            <div className="flex flex-col gap-3">
              <Link
                href="/features"
                onClick={() => setMobileOpen(false)}
                className="text-muted-foreground hover:bg-muted rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              >
                Features
              </Link>
              <Link
                href="/features#pricing"
                onClick={() => setMobileOpen(false)}
                className="text-muted-foreground hover:bg-muted rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              >
                Pricing
              </Link>
              {isSignedIn ? (
                <Button
                  asChild
                  className="bg-foreground text-background hover:bg-foreground/90 mt-1 rounded-lg"
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
                    className="text-muted-foreground hover:bg-muted rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Sign in
                  </Link>
                  <Button
                    asChild
                    className="bg-foreground text-background hover:bg-foreground/90 mt-1 rounded-lg"
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
