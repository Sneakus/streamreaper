import { PrismaClient } from '@prisma/client';

/**
 * Prisma client singleton.
 *
 * Next.js hot-reloads modules in development, which would create a new
 * PrismaClient on every reload and exhaust database connections.
 * This pattern stores the client on `globalThis` so it persists across reloads.
 *
 * Usage:
 *   import { prisma } from '@/lib/prisma';
 *   const users = await prisma.user.findMany();
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
