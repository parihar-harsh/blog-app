import type { MiddlewareHandler } from 'hono'
import { verify } from 'hono/jwt'
import type { AppEnv } from '../types'

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const authorization = c.req.header('Authorization')
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : undefined

  if (!token) {
    return c.json({ message: 'Authentication required' }, 401)
  }

  try {
    const payload = await verify(token, c.env.JWT_SECRET, {
      alg: 'HS256',
      iss: 'medium-blogapp',
      aud: 'medium-blogapp-web',
    })
    const userId = Number(payload.sub)

    if (!Number.isInteger(userId) || userId <= 0) {
      return c.json({ message: 'Invalid authentication token' }, 401)
    }

    c.set('userId', userId)
    await next()
  } catch {
    return c.json({ message: 'Invalid or expired authentication token' }, 401)
  }
}
