import type { Metadata } from 'next'
import { SignUp } from '@clerk/nextjs'
import { clerkAppearance } from '@/lib/clerk-theme'

export const metadata: Metadata = {
  title: 'Sign Up',
}

export default function SignUpPage() {
  return <SignUp appearance={clerkAppearance} />
}
