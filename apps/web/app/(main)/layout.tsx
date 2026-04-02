import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import { clerkAppearance } from '@/lib/clerk-theme'
import { SignOutCleanup } from '@/components/sign-out-cleanup'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <SignOutCleanup />
      {children}
      <Toaster richColors position="bottom-right" />
    </ClerkProvider>
  )
}
