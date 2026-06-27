import { z } from 'zod'

const email = z.string().trim().toLowerCase().email().max(254)
const bcryptCompatible = (value: string) => new TextEncoder().encode(value).length <= 72
const signupPassword = z.string()
  .min(8)
  .max(72)
  .refine(bcryptCompatible, 'Password must be at most 72 bytes')
const signinPassword = z.string()
  .min(6)
  .max(72)
  .refine(bcryptCompatible, 'Password must be at most 72 bytes')

export const signupInput = z.object({
  username: email,
  password: signupPassword,
  name: z.string().trim().min(1).max(80).optional(),
}).strict()

export const signinInput = z.object({
  username: email,
  password: signinPassword,
}).strict()

export const createBlogInput = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(100_000),
}).strict()

export const updateBlogInput = createBlogInput.extend({
  id: z.number().int().positive(),
}).strict()

export const paginationInput = z.object({
  limit: z.coerce.number().int().min(1).max(24).default(12),
  cursor: z.coerce.number().int().positive().optional(),
})
