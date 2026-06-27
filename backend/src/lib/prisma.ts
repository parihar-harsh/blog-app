import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

export const createPrismaClient = (databaseUrl: string) =>
  new PrismaClient({ datasourceUrl: databaseUrl }).$extends(withAccelerate())
