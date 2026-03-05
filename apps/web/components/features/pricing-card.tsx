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
          highlighted && 'border-wedding-600 relative border-2 shadow-lg',
        )}
      >
        {highlighted && (
          <div className="bg-wedding-600 absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-semibold text-white">
            Most Popular
          </div>
        )}
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{title}</CardTitle>
          <div className="mt-4">
            <span className="font-serif text-4xl font-bold tracking-tight text-gray-900">
              {price}
            </span>
            {price !== 'Free' && <span className="ml-1 text-sm text-gray-500">one-time</span>}
          </div>
          <p className="mt-2 text-sm text-gray-500">{description}</p>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          <ul className="flex-1 space-y-3">
            {features.map((feature) => (
              <li key={feature.label} className="flex items-start gap-3">
                {feature.included ? (
                  <Check className="text-sage-600 mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                )}
                <span
                  className={cn('text-sm', feature.included ? 'text-gray-700' : 'text-gray-400')}
                >
                  {feature.label}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Button
              asChild
              className={cn(
                'w-full rounded-xl',
                highlighted
                  ? 'bg-wedding-600 hover:bg-wedding-700 text-white'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200',
              )}
              size="lg"
            >
              <Link href={href}>{cta}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function PricingCards({ children }: { children: ReactNode }) {
  return <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">{children}</div>
}
