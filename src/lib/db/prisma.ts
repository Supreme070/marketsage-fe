import { PrismaClient } from "@prisma/client";

// Add custom methods to PrismaClient
interface CustomPrismaClient extends PrismaClient {
  $healthCheck: () => Promise<boolean>;
  
  // Add type for models (using index signature)
  [key: string]: any;
}

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: CustomPrismaClient | undefined;
};

// Configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

// Create a new PrismaClient instance
const createPrismaClient = (): CustomPrismaClient => {
  const client = new PrismaClient({
    log: [
      'error',
      'warn',
    ],
    errorFormat: 'pretty',
  }) as CustomPrismaClient;

  // Add health check method
  client.$healthCheck = async (): Promise<boolean> => {
    try {
      // Simple query to check if connection is alive
      await client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  };

  return client;
};

// Initialize Prisma client 
const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Add middleware for query timeout and retry
prisma.$use(async (params, next) => {
  let attempts = 0;

  async function runWithRetry() {
    try {
      attempts++;
      const startTime = Date.now();
      const result = await next(params);
      const duration = Date.now() - startTime;
      
      // Log slow queries (only in development)
      if (process.env.NODE_ENV !== 'production' && duration > 500) {
        console.warn(`Slow database operation: ${params.model}.${params.action} (${duration}ms)`);
      }
      
      return result;
    } catch (error) {
      const isConnectionError =
        error instanceof Error &&
        (error.message.includes('Connection refused') ||
         error.message.includes('connection timeout') ||
         error.message.includes('Connection terminated unexpectedly') ||
         error.message.includes('pool is draining') ||
         error.message.includes('pool overflow'));

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

// Setup proper shutdown for production
if (process.env.NODE_ENV === 'production') {
  const gracefulShutdown = async () => {
    console.log('Closing Prisma client connection...');
    await prisma.$disconnect();
    console.log('Prisma client disconnected');
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

// In development, we reuse the same client across requests
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
