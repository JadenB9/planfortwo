import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { ScrollLockGuard } from '@/components/scroll-lock-guard'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'PlanForTwo — Wedding Planning Made Simple',
    template: '%s | PlanForTwo',
  },
  description:
    'Pay once, plan your wedding without ads or upsells. Everything you need from engagement to "I do."',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen font-sans">
        <ScrollLockGuard />
        {children}
      </body>
    </html>
  )
}
