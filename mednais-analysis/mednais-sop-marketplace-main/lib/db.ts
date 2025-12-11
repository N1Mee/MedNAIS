import { PrismaClient } from '@prisma/client'

let instance: PrismaClient | undefined

if (!instance) {
  instance = new PrismaClient()
}

export const prisma = instance
