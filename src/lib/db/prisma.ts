import { PrismaClient } from "@/generated/prisma";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Connection retry logic to handle temporary database disconnects
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

export const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    // Enable connection pooling in production
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Enable query engine metrics (helpful for monitoring)
    __internal: {
      engine: {
        // For production configuration
        metrics: process.env.NODE_ENV === "production",
      },
    },
  });
};

// Initialize Prisma client with automatic retries
export const prisma = globalForPrisma.prisma || createPrismaClient();

// Add middleware for query timeout and retry
prisma.$use(async (params, next) => {
  let attempts = 0;

  async function runWithRetry() {
    try {
      attempts++;
      return await next(params);
    } catch (error) {
      const isConnectionError =
        error instanceof Error &&
        (error.message.includes('Connection refused') ||
         error.message.includes('connection timeout') ||
         error.message.includes('Connection terminated unexpectedly'));

      // Retry logic for connection issues
      if (isConnectionError && attempts < MAX_RETRIES) {
        console.warn(`Database connection error, retrying (${attempts}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempts));
        return runWithRetry();
      }
      throw error;
    }
  }

  return runWithRetry();
});

// In development, we reuse the same client across requests
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
