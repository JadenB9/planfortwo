import type { Metadata } from 'next'
import { SignIn } from '@clerk/nextjs'
import { clerkAppearance } from '@/lib/clerk-theme'

export const metadata: Metadata = {
  title: 'Sign In',
}

export default function SignInPage() {
  return <SignIn appearance={clerkAppearance} />
}
