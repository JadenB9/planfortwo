import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { requireFeature } from '../middleware/require-feature.js'
import { budgetAnalyticsService } from '../services/budget-analytics.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const budgetAnalyticsRoute = new Hono<Env>()

budgetAnalyticsRoute.use('*', authMiddleware, resolveUserMiddleware)

// GET /budget/analytics?weddingId=X — full budget analytics
budgetAnalyticsRoute.get(
  '/analytics',
  resolveWeddingMiddleware,
  requireFeature('canBudgetAnalytics'),
  async (c) => {
    const weddingId = c.get('weddingId')
    const analytics = await budgetAnalyticsService.getAnalytics(weddingId)
    return c.json({ data: analytics })
  },
)

// GET /budget/tips?weddingId=X — tip suggestions
budgetAnalyticsRoute.get(
  '/tips',
  resolveWeddingMiddleware,
  requireFeature('canBudgetAnalytics'),
  async (c) => {
    const weddingId = c.get('weddingId')
    const tips = await budgetAnalyticsService.getTipSuggestions(weddingId)
    return c.json({ data: tips })
  },
)

// GET /budget/splits?weddingId=X — cost split summary
budgetAnalyticsRoute.get(
  '/splits',
  resolveWeddingMiddleware,
  requireFeature('canBudgetAnalytics'),
  async (c) => {
    const weddingId = c.get('weddingId')
    const splits = await budgetAnalyticsService.getSplitSummary(weddingId)
    return c.json({ data: splits })
  },
)

// GET /budget/export/csv?weddingId=X — CSV export
budgetAnalyticsRoute.get(
  '/export/csv',
  resolveWeddingMiddleware,
  requireFeature('canBudgetExport'),
  async (c) => {
    const weddingId = c.get('weddingId')
    const csv = await budgetAnalyticsService.exportCsv(weddingId)
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="budget-export.csv"',
      },
    })
  },
)

// GET /budget/export/pdf?weddingId=X — PDF export
budgetAnalyticsRoute.get(
  '/export/pdf',
  resolveWeddingMiddleware,
  requireFeature('canBudgetExport'),
  async (c) => {
    const weddingId = c.get('weddingId')
    const pdfBuffer = await budgetAnalyticsService.exportPdf(weddingId)
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="budget-report.pdf"',
      },
    })
  },
)

// POST /budget/import/csv — CSV import
budgetAnalyticsRoute.post(
  '/import/csv',
  resolveWeddingMiddleware,
  requireFeature('canBudgetExpenses'),
  zValidator(
    'json',
    z.object({
      weddingId: z.string().uuid(),
      csvContent: z.string().min(1).max(500_000),
    }),
    (result, c) => {
      if (!result.success) {
        return c.json(
          { error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 },
          400,
        )
      }
    },
  ),
  async (c) => {
    const { csvContent } = c.req.valid('json')
    const weddingId = c.get('weddingId')
    const dbUserId = c.get('dbUserId')

    const result = await budgetAnalyticsService.importCsv(weddingId, csvContent, dbUserId)
    return c.json({ data: result })
  },
)
