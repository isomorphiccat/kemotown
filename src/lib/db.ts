import { PrismaClient } from '@prisma/client';

const prisma =
  global.prisma ||
  new PrismaClient({
    // log: ['query'], // Uncomment to see Prisma queries in console
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export { prisma };
export default prisma;
