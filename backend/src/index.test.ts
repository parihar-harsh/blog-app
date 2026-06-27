import { describe, expect, it } from 'vitest'
import app from './index'
import { createBlogInput, paginationInput, signinInput, signupInput } from './validation'

const env = {
  DATABASE_URL: 'prisma://unused-in-unit-tests',
  JWT_SECRET: 'unit-test-secret-that-is-long-enough',
}

describe('application', () => {
  it('reports health', async () => {
    const response = await app.request('/health', {}, env)
    expect(response.status).toBe(200)
    const body = await response.json() as { status: string, requestId: string }
    expect(body.status).toBe('ok')
    expect(body.requestId).toBeTruthy()
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
  })

  it('requires authentication when publishing', async () => {
    const response = await app.request('/api/v1/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test', content: 'Test post' }),
    }, env)
    expect(response.status).toBe(401)
  })

  it('requires authentication when deleting', async () => {
    const response = await app.request('/api/v1/blog/1', { method: 'DELETE' }, env)
    expect(response.status).toBe(401)
  })

  it('rejects oversized request bodies', async () => {
    const response = await app.request('/api/v1/user/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 'x'.repeat(129 * 1024) }),
    }, env)
    expect(response.status).toBe(413)
  })
})

describe('request validation', () => {
  it('normalizes valid account input', () => {
    const result = signupInput.parse({
      username: '  AUTHOR@example.com ',
      password: 'password123',
      name: ' Author ',
    })
    expect(result).toEqual({
      username: 'author@example.com',
      password: 'password123',
      name: 'Author',
    })
  })

  it('rejects short passwords and unknown fields', () => {
    expect(signinInput.safeParse({
      username: 'author@example.com',
      password: 'short',
      admin: true,
    }).success).toBe(false)
  })

  it('rejects empty blog posts', () => {
    expect(createBlogInput.safeParse({ title: ' ', content: ' ' }).success).toBe(false)
  })

  it('rejects fractional and excessive page limits', () => {
    expect(paginationInput.safeParse({ limit: '2.5' }).success).toBe(false)
    expect(paginationInput.safeParse({ limit: '25' }).success).toBe(false)
    expect(paginationInput.parse({ limit: undefined })).toEqual({ limit: 12 })
  })

  it('rejects passwords that exceed the bcrypt byte limit', () => {
    expect(signupInput.safeParse({
      username: 'author@example.com',
      password: '🙂'.repeat(20),
    }).success).toBe(false)
  })
})
