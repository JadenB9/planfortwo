import { createMiddleware } from 'hono/factory'
import { userService } from '../services/users.js'

type ResolveUserEnv = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
  }
}

export const resolveUserMiddleware = createMiddleware<ResolveUserEnv>(
  async (c, next) => {
    const clerkUserId = c.get('clerkUserId')

    const user = await userService.findByClerkId(clerkUserId)

    if (!user) {
      return c.json(
        { error: 'User not found', code: 'USER_NOT_FOUND', statusCode: 404 },
        404,
      )
    }

    c.set('dbUserId', user.id)
    c.set('dbUser', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    })

    await next()
  },
)
