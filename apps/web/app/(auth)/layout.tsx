import { Check, Heart } from 'lucide-react'

const features = [
  'Clean & simple planning tools',
  'Made for couples, by couples',
  'Free to get started',
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding (hidden on mobile) */}
      <div className="from-wedding-50 via-cream-50 to-wedding-100 hidden flex-col items-center justify-center bg-gradient-to-br px-12 md:flex md:w-1/2 lg:px-20">
        <div className="max-w-sm text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Heart className="fill-wedding-600 text-wedding-600 h-6 w-6" />
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">
            <span className="text-gray-900">Plan</span>
            <span className="text-wedding-600">For</span>
            <span className="text-gray-900">Two</span>
          </h1>
          <p className="mt-3 text-base text-gray-500">Plan your perfect day, together.</p>

          <ul className="mt-10 space-y-4 text-left">
            {features.map((text) => (
              <li key={text} className="flex items-center gap-3 text-sm text-gray-600">
                <span className="bg-wedding-600/10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  <Check className="text-wedding-600 h-3.5 w-3.5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right panel — Clerk form */}
      <div className="flex w-full items-center justify-center bg-[#fdf8f6] px-6 md:w-1/2">
        {children}
      </div>
    </div>
  )
}
