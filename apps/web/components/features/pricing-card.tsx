'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { type ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PricingFeature {
  label: string
  included: boolean
}

interface PricingCardProps {
  title: string
  price: string
  description: string
  features: PricingFeature[]
  cta: string
  href: string
  highlighted?: boolean
  delay?: number
}

export function PricingCard({
  title,
  price,
  description,
  features,
  cta,
  href,
  highlighted = false,
  delay = 0,
}: PricingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay }}
      className="flex"
    >
      <Card
        className={cn(
          'flex w-full flex-col',
          highlighted &&
            'relative border-2 border-orange-400/60 shadow-xl shadow-orange-100/50 dark:shadow-orange-900/20',
        )}
      >
        {highlighted && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-4 py-1 text-xs font-semibold text-white shadow-md">
            Most Popular
          </div>
        )}
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{title}</CardTitle>
          <div className="mt-4">
            <span className="text-foreground font-serif text-4xl font-bold tracking-tight">
              {price}
            </span>
            {price !== 'Free' && (
              <span className="text-muted-foreground ml-1 text-sm">one-time</span>
            )}
          </div>
          <p className="text-muted-foreground mt-2 text-sm">{description}</p>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          <ul className="flex-1 space-y-3">
            {features.map((feature) => (
              <li key={feature.label} className="flex items-start gap-3">
                {feature.included ? (
                  <Check
                    className={cn(
                      'mt-0.5 h-4 w-4 shrink-0',
                      highlighted ? 'text-orange-500' : 'text-sage-600',
                    )}
                  />
                ) : (
                  <X className="text-muted-foreground/50 mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span
                  className={cn(
                    'text-sm',
                    feature.included ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {feature.label}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            {highlighted ? (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  asChild
                  className="w-full rounded-xl bg-orange-500 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
                  size="lg"
                >
                  <Link href={href}>{cta}</Link>
                </Button>
              </motion.div>
            ) : (
              <Button
                asChild
                className="bg-muted text-foreground hover:bg-muted w-full rounded-xl"
                size="lg"
              >
                <Link href={href}>{cta}</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function PricingCards({ children }: { children: ReactNode }) {
  return <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">{children}</div>
}
