import { Sidebar } from '@/components/dashboard/sidebar'
import { TopBar } from '@/components/dashboard/top-bar'
import { Paywall } from '@/components/dashboard/paywall'
import { ThemeProvider } from '@/components/theme-provider'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="bg-muted flex min-h-screen dark:bg-gray-900">
        <Sidebar />
        <div className="flex h-screen min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
            <Paywall>{children}</Paywall>
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}
