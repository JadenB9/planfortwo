import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Plan<span className="text-wedding-600">For</span>Two
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Pay once, plan your wedding without ads or upsells. Everything you need from engagement to
          &ldquo;I do.&rdquo;
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/sign-up"
            className="rounded-xl bg-wedding-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-wedding-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wedding-600"
          >
            Get Started Free
          </Link>
          <a
            href="#features"
            className="text-sm font-semibold leading-6 text-gray-900 transition-colors hover:text-wedding-600"
          >
            See Features <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </main>
  )
}
