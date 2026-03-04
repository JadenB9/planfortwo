import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { AcceptInviteClient } from '@/components/invite/accept-invite-client'

interface InvitePageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params
  const { userId } = await auth()
  const isSignedIn = !!userId

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fdf8f6] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <h1 className="font-serif text-2xl font-bold text-gray-900">
              You&apos;re Invited!
            </h1>
            <p className="mt-2 text-gray-600">
              Someone special wants to plan their wedding with you.
            </p>
          </div>

          <div className="mt-8">
            {isSignedIn ? (
              <AcceptInviteClient token={token} />
            ) : (
              <div className="space-y-4 text-center">
                <p className="text-sm text-gray-600">
                  Create an account or sign in to accept this invitation.
                </p>
                <div className="flex flex-col gap-3">
                  <Link
                    href={`/sign-up?redirect_url=/invite/${token}`}
                    className="block rounded-xl bg-wedding-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-wedding-700"
                  >
                    Create Account to Accept
                  </Link>
                  <Link
                    href={`/sign-in?redirect_url=/invite/${token}`}
                    className="block rounded-xl border border-gray-300 px-6 py-3 text-center text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
