'use client'

import dynamic from 'next/dynamic'

const InboxPage = dynamic(() => import('./inbox-client'), { ssr: false })

export default function Page() {
  return <InboxPage />
}
