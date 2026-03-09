import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import { clerkAppearance } from '@/lib/clerk-theme'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      {children}
      <Toaster richColors position="bottom-right" />
    </ClerkProvider>
  )
}
