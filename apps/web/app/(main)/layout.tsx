import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import { clerkAppearance } from '@/lib/clerk-theme'
import { WeddingProvider } from '@/hooks/use-wedding'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={clerkAppearance} dynamic>
      <WeddingProvider>{children}</WeddingProvider>
      <Toaster richColors position="bottom-right" />
    </ClerkProvider>
  )
}
