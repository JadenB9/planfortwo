import { Sidebar } from '@/components/dashboard/sidebar'
import { TopBar } from '@/components/dashboard/top-bar'
import { Paywall } from '@/components/dashboard/paywall'
import { ThemeProvider } from '@/components/theme-provider'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="min-w-0 flex-1 overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
            <Paywall>{children}</Paywall>
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}
