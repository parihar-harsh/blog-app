import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { compare, hash } from 'bcryptjs'
import type { AppEnv } from '../types'
import { createPrismaClient } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { authRateLimit } from '../middleware/rateLimit'
import { signinInput, signupInput } from '../validation'

export const userRouter = new Hono<AppEnv>()
const DUMMY_PASSWORD_HASH = '$2b$10$Xeu0TKJJfdDOAQsWuVHY9.NFRQ3djrIkitiCwMHHh3p8zB1dfM1sK'

const createToken = (userId: number, secret: string) => {
  const now = Math.floor(Date.now() / 1000)
  return sign({
    sub: String(userId),
    iat: now,
    exp: now + 60 * 60 * 24 * 7,
    iss: 'medium-blogapp',
    aud: 'medium-blogapp-web',
  }, secret, 'HS256')
}

userRouter.post('/signup', authRateLimit, async (c) => {
  const result = signupInput.safeParse(await c.req.json().catch(() => null))
  if (!result.success) {
    return c.json({ message: 'Invalid signup details', issues: result.error.flatten().fieldErrors }, 400)
  }

  const prisma = createPrismaClient(c.env.DATABASE_URL)
  const existingUser = await prisma.user.findUnique({
    where: { username: result.data.username },
    select: { id: true },
  })

  if (existingUser) {
    return c.json({ message: 'An account with this email already exists' }, 409)
  }

  let user
  try {
    user = await prisma.user.create({
      data: {
        username: result.data.username,
        password: await hash(result.data.password, 10),
        name: result.data.name,
      },
      select: { id: true, name: true, username: true },
    })
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
      return c.json({ message: 'An account with this email already exists' }, 409)
    }
    throw error
  }

  return c.json({
    token: await createToken(user.id, c.env.JWT_SECRET),
    user,
  }, 201)
})

userRouter.post('/signin', authRateLimit, async (c) => {
  const result = signinInput.safeParse(await c.req.json().catch(() => null))
  if (!result.success) {
    return c.json({ message: 'Invalid signin details' }, 400)
  }

  const prisma = createPrismaClient(c.env.DATABASE_URL)
  const user = await prisma.user.findUnique({
    where: { username: result.data.username },
  })

  if (!user) {
    await compare(result.data.password, DUMMY_PASSWORD_HASH)
    return c.json({ message: 'Incorrect email or password' }, 401)
  }

  const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(user.password)
  const passwordMatches = isBcryptHash
    ? await compare(result.data.password, user.password)
    : result.data.password === user.password

  if (!passwordMatches) {
    return c.json({ message: 'Incorrect email or password' }, 401)
  }

  // Transparently migrate accounts created before password hashing was added.
  if (!isBcryptHash) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hash(result.data.password, 10) },
    })
  }

  return c.json({
    token: await createToken(user.id, c.env.JWT_SECRET),
    user: { id: user.id, name: user.name, username: user.username },
  })
})

userRouter.get('/me', requireAuth, async (c) => {
  const prisma = createPrismaClient(c.env.DATABASE_URL)
  const user = await prisma.user.findUnique({
    where: { id: c.get('userId') },
    select: { id: true, name: true, username: true, createdAt: true },
  })
  if (!user) {
    return c.json({ message: 'User not found' }, 404)
  }
  return c.json({ user })
})
