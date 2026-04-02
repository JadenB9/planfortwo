'use client'

import type { WebsiteAnalyticsSummary } from '@planfortwo/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, Users, BarChart3 } from 'lucide-react'

interface AnalyticsDashboardProps {
  analytics: WebsiteAnalyticsSummary | null
  canAccess: boolean
}

export function AnalyticsDashboard({ analytics, canAccess }: AnalyticsDashboardProps) {
  if (!canAccess) {
    return (
      <div className="border-border bg-muted rounded-xl border border-dashed p-8 text-center">
        <BarChart3 className="text-muted-foreground mx-auto h-8 w-8" />
        <p className="text-foreground mt-2 text-sm font-medium">Website Analytics</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Upgrade to Full Access to see visitor analytics.
        </p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <p className="text-muted-foreground text-sm">
        No analytics data yet. Publish your website to start tracking visitors.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Total Views</CardTitle>
            <Eye className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Unique Visitors
            </CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.uniqueVisitors.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Top Section</CardTitle>
            <BarChart3 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.viewsBySection[0]?.section ?? '—'}</p>
          </CardContent>
        </Card>
      </div>

      {analytics.viewsByDay.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Views by Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-end gap-1">
              {analytics.viewsByDay.slice(-14).map((d) => {
                const max = Math.max(...analytics.viewsByDay.map((v) => v.count), 1)
                return (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="bg-wedding-500 w-full rounded-t"
                      style={{
                        height: `${(d.count / max) * 100}%`,
                        minHeight: d.count > 0 ? 4 : 0,
                      }}
                    />
                    <span className="text-muted-foreground text-[10px]">{d.date.slice(5)}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {analytics.topReferrers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.topReferrers.slice(0, 5).map((r) => (
                <div key={r.referrer} className="flex items-center justify-between text-sm">
                  <span className="text-foreground truncate">{r.referrer || 'Direct'}</span>
                  <span className="text-foreground font-medium">{r.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
