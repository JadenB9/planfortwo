import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { db, users } from '@planfortwo/db'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
  }
}

const updateNameSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
})

export const usersRoute = new Hono<Env>()

usersRoute.use('*', authMiddleware, resolveUserMiddleware)

usersRoute.get('/me', (c) => {
  const dbUser = c.get('dbUser')
  return c.json({ data: dbUser })
})

// PUT /users/me — update current user's name in DB
usersRoute.put(
  '/me',
  zValidator('json', updateNameSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const dbUserId = c.get('dbUserId')
    const { firstName, lastName } = c.req.valid('json')

    const [updated] = await db
      .update(users)
      .set({ firstName, lastName })
      .where(eq(users.id, dbUserId))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })

    if (!updated) {
      return c.json({ error: 'User not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    }

    return c.json({ data: updated })
  },
)
