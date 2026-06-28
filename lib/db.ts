import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "@/lib/env";
import { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Prisma 7 requires a driver adapter for the runtime client; we use node-postgres.
 * A single client is reused across hot reloads in development to avoid exhausting
 * the connection pool.
 */
const createPrismaClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
    log:
      env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
