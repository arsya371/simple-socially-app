import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    errorFormat: 'minimal',
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

// Ensure connection is released on app shutdown
if (process.env.NODE_ENV !== 'production') {
  process.on('beforeExit', () => {
    if (globalThis.prismaGlobal) {
      globalThis.prismaGlobal.$disconnect();
    }
  });
}

// Initialize client with global singleton
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export default prisma;