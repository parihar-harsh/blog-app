import type { MiddlewareHandler } from 'hono'
import type { AppEnv } from '../types'

export const authRateLimit: MiddlewareHandler<AppEnv> = async (c, next) => {
  const limiter = c.env.AUTH_RATE_LIMITER
  if (!limiter) {
    await next()
    return
  }

  const clientAddress = c.req.header('CF-Connecting-IP') || 'unknown'
  const result = await limiter.limit({ key: `auth:${clientAddress}` })
  if (!result.success) {
    c.header('Retry-After', '60')
    return c.json({ message: 'Too many authentication attempts. Try again shortly.' }, 429)
  }
  await next()
}

export const writeRateLimit: MiddlewareHandler<AppEnv> = async (c, next) => {
  const limiter = c.env.WRITE_RATE_LIMITER
  if (!limiter) {
    await next()
    return
  }

  const result = await limiter.limit({ key: `write:${c.get('userId')}` })
  if (!result.success) {
    c.header('Retry-After', '60')
    return c.json({ message: 'You are publishing too quickly. Try again shortly.' }, 429)
  }
  await next()
}
