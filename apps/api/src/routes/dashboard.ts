import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { checklistService } from '../services/checklist.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const dashboardRoute = new Hono<Env>()

dashboardRoute.use('*', authMiddleware, resolveUserMiddleware)

// GET /dashboard/stats?weddingId=X — returns DashboardStats
dashboardRoute.get('/stats', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const stats = await checklistService.getStats(weddingId)
  return c.json({ data: stats })
})
