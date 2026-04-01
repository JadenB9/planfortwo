'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useState, useRef } from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InteractiveFeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  items: string[]
  index: number
  accent: string
  accentLight: string
}

export function InteractiveFeatureCard({
  icon: Icon,
  title,
  description,
  items,
  index,
  accent,
  accentLight,
}: InteractiveFeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 })
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['6deg', '-6deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-6deg', '6deg'])

  const glowX = useTransform(mouseXSpring, [-0.5, 0.5], ['0%', '100%'])
  const glowY = useTransform(mouseYSpring, [-0.5, 0.5], ['0%', '100%'])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const xPct = (e.clientX - rect.left) / rect.width - 0.5
    const yPct = (e.clientY - rect.top) / rect.height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.4) }}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="group relative cursor-default"
    >
      <motion.div
        className={cn(
          'relative h-full overflow-hidden rounded-2xl border border-border bg-white p-6 transition-shadow duration-300',
          isHovered && 'shadow-xl',
        )}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* Glow effect */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300"
          style={{
            opacity: isHovered ? 0.15 : 0,
            background: `radial-gradient(circle at ${glowX} ${glowY}, ${accent}, transparent 60%)`,
          }}
        />

        {/* Shimmer line on hover */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            opacity: isHovered ? 0.6 : 0,
          }}
        />

        {/* Content */}
        <div style={{ transform: 'translateZ(30px)', transformStyle: 'preserve-3d' }}>
          <div className="flex items-center gap-3">
            <motion.div
              className={cn('flex h-10 w-10 items-center justify-center rounded-xl')}
              style={{ backgroundColor: accentLight }}
              animate={isHovered ? { scale: 1.1, rotate: -5 } : { scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <Icon className="h-5 w-5" style={{ color: accent }} />
            </motion.div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>

          <ul className="mt-4 space-y-1.5">
            {items.map((item, i) => (
              <motion.li
                key={item}
                className="flex items-start gap-2 text-sm text-muted-foreground"
                initial={false}
                animate={
                  isHovered
                    ? { x: 4, opacity: 1, transition: { delay: i * 0.03 } }
                    : { x: 0, opacity: 0.8 }
                }
              >
                <motion.span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: accent }}
                  animate={isHovered ? { scale: 1.3 } : { scale: 1 }}
                />
                {item}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Corner accent */}
        <motion.div
          className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full opacity-0"
          style={{ backgroundColor: accentLight }}
          animate={isHovered ? { opacity: 0.4, scale: 1.2 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </motion.div>
  )
}
