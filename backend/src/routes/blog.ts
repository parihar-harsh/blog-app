import { Hono } from 'hono'
import type { AppEnv } from '../types'
import { createPrismaClient } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { writeRateLimit } from '../middleware/rateLimit'
import { createBlogInput, paginationInput, updateBlogInput } from '../validation'

export const blogRouter = new Hono<AppEnv>()

const blogSelection = {
  id: true,
  title: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, name: true } },
} as const

blogRouter.post('/', requireAuth, writeRateLimit, async (c) => {
  const result = createBlogInput.safeParse(await c.req.json().catch(() => null))
  if (!result.success) {
    return c.json({ message: 'Invalid blog post', issues: result.error.flatten().fieldErrors }, 400)
  }

  const prisma = createPrismaClient(c.env.DATABASE_URL)
  const blog = await prisma.blog.create({
    data: {
      ...result.data,
      authorId: c.get('userId'),
      published: true,
    },
    select: blogSelection,
  })

  return c.json({ blog }, 201)
})

blogRouter.put('/', requireAuth, writeRateLimit, async (c) => {
  const result = updateBlogInput.safeParse(await c.req.json().catch(() => null))
  if (!result.success) {
    return c.json({ message: 'Invalid blog post', issues: result.error.flatten().fieldErrors }, 400)
  }

  const prisma = createPrismaClient(c.env.DATABASE_URL)
  const { id, ...data } = result.data
  const update = await prisma.blog.updateMany({
    where: { id, authorId: c.get('userId') },
    data,
  })

  if (update.count === 0) {
    return c.json({ message: 'Blog post not found or not owned by you' }, 404)
  }

  const blog = await prisma.blog.findUnique({ where: { id }, select: blogSelection })
  return c.json({ blog })
})

blogRouter.delete('/:id', requireAuth, writeRateLimit, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ message: 'Invalid blog ID' }, 400)
  }

  const prisma = createPrismaClient(c.env.DATABASE_URL)
  const deletion = await prisma.blog.deleteMany({
    where: { id, authorId: c.get('userId') },
  })
  if (deletion.count === 0) {
    return c.json({ message: 'Blog post not found or not owned by you' }, 404)
  }
  return c.body(null, 204)
})

blogRouter.get('/mine', requireAuth, async (c) => {
  const prisma = createPrismaClient(c.env.DATABASE_URL)
  const blogs = await prisma.blog.findMany({
    where: { authorId: c.get('userId') },
    orderBy: { id: 'desc' },
    select: blogSelection,
  })
  return c.json({ blogs })
})

blogRouter.get('/bulk', async (c) => {
  const query = paginationInput.safeParse({
    limit: c.req.query('limit'),
    cursor: c.req.query('cursor') || undefined,
  })
  if (!query.success) {
    return c.json({ message: 'Invalid pagination parameters' }, 400)
  }

  const prisma = createPrismaClient(c.env.DATABASE_URL)
  const blogs = await prisma.blog.findMany({
    where: { published: true },
    take: query.data.limit + 1,
    ...(query.data.cursor ? { cursor: { id: query.data.cursor }, skip: 1 } : {}),
    orderBy: { id: 'desc' },
    select: blogSelection,
  })
  const hasMore = blogs.length > query.data.limit
  const page = hasMore ? blogs.slice(0, query.data.limit) : blogs

  c.header('Cache-Control', 'public, max-age=15, stale-while-revalidate=60')
  return c.json({
    blogs: page,
    nextCursor: hasMore ? page.at(-1)?.id ?? null : null,
  })
})

blogRouter.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ message: 'Invalid blog ID' }, 400)
  }

  const prisma = createPrismaClient(c.env.DATABASE_URL)
  const blog = await prisma.blog.findFirst({
    where: { id, published: true },
    select: blogSelection,
  })

  if (!blog) {
    return c.json({ message: 'Blog post not found' }, 404)
  }

  c.header('Cache-Control', 'public, max-age=30, stale-while-revalidate=120')
  return c.json({ blog })
})
