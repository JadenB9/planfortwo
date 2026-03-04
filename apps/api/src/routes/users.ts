import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
  }
}

export const usersRoute = new Hono<Env>()

usersRoute.use('*', authMiddleware, resolveUserMiddleware)

usersRoute.get('/me', (c) => {
  const dbUser = c.get('dbUser')
  return c.json({ data: dbUser })
})
