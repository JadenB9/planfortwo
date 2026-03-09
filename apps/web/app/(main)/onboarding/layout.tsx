import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Onboarding',
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fdf8f6] px-4 py-12">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  )
}
