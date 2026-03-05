import { eq, and, gte, sql, desc } from 'drizzle-orm'
import { db, websitePageViews } from '@planfortwo/db'
import type { WebsiteAnalyticsSummary } from '@planfortwo/types'

export const websiteAnalyticsService = {
  async track(
    weddingId: string,
    visitorId: string,
    path: string,
    sectionViewed: string | null,
    referrer: string | null,
    country: string | null,
    userAgent: string | null,
  ) {
    await db.insert(websitePageViews).values({
      weddingId,
      visitorId,
      path,
      sectionViewed,
      referrer,
      country,
      userAgent,
    })
  },

  async getSummary(weddingId: string): Promise<WebsiteAnalyticsSummary> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const baseWhere = and(
      eq(websitePageViews.weddingId, weddingId),
      gte(websitePageViews.createdAt, thirtyDaysAgo),
    )

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(websitePageViews)
      .where(baseWhere)

    const [uniqueResult] = await db
      .select({ count: sql<number>`count(distinct ${websitePageViews.visitorId})::int` })
      .from(websitePageViews)
      .where(baseWhere)

    const viewsByDay = await db
      .select({
        date: sql<string>`to_char(${websitePageViews.createdAt}::date, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(websitePageViews)
      .where(baseWhere)
      .groupBy(sql`${websitePageViews.createdAt}::date`)
      .orderBy(sql`${websitePageViews.createdAt}::date`)

    const viewsBySection = await db
      .select({
        section: websitePageViews.sectionViewed,
        count: sql<number>`count(*)::int`,
      })
      .from(websitePageViews)
      .where(and(baseWhere, sql`${websitePageViews.sectionViewed} IS NOT NULL`))
      .groupBy(websitePageViews.sectionViewed)
      .orderBy(desc(sql`count(*)`))

    const viewsByCountry = await db
      .select({
        country: websitePageViews.country,
        count: sql<number>`count(*)::int`,
      })
      .from(websitePageViews)
      .where(and(baseWhere, sql`${websitePageViews.country} IS NOT NULL`))
      .groupBy(websitePageViews.country)
      .orderBy(desc(sql`count(*)`))
      .limit(10)

    const topReferrers = await db
      .select({
        referrer: websitePageViews.referrer,
        count: sql<number>`count(*)::int`,
      })
      .from(websitePageViews)
      .where(and(baseWhere, sql`${websitePageViews.referrer} IS NOT NULL`))
      .groupBy(websitePageViews.referrer)
      .orderBy(desc(sql`count(*)`))
      .limit(10)

    return {
      totalViews: totalResult?.count ?? 0,
      uniqueVisitors: uniqueResult?.count ?? 0,
      viewsByDay: viewsByDay.map((r) => ({ date: r.date, count: r.count })),
      viewsBySection: viewsBySection
        .filter((r): r is typeof r & { section: string } => r.section !== null)
        .map((r) => ({ section: r.section, count: r.count })),
      viewsByCountry: viewsByCountry
        .filter((r): r is typeof r & { country: string } => r.country !== null)
        .map((r) => ({ country: r.country, count: r.count })),
      topReferrers: topReferrers
        .filter((r): r is typeof r & { referrer: string } => r.referrer !== null)
        .map((r) => ({ referrer: r.referrer, count: r.count })),
    }
  },
}
