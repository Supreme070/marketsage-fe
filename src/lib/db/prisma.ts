import { PrismaClient, Prisma } from "@prisma/client";
import * as fs from 'fs';
import * as path from 'path';

// Add custom methods to PrismaClient
interface CustomPrismaClient extends PrismaClient {
  $healthCheck: () => Promise<boolean>;
  $reconnect: () => Promise<boolean>;
  
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
const CONNECTION_CHECK_INTERVAL = 60000; // 1 minute

// Check if we're running in a Docker environment
const isDocker = fs.existsSync('/.dockerenv') || (process.env.DOCKER_CONTAINER === 'true');

// Create a new PrismaClient instance
const createPrismaClient = (): CustomPrismaClient => {
  try {
    // Set up Prisma client with appropriate options
    const clientOptions: Prisma.PrismaClientOptions = {
      log: [
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' }
      ],
      errorFormat: 'pretty',
    };

    // Initialize the client
    const client = new PrismaClient(clientOptions) as CustomPrismaClient;
    
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
    
    // Add reconnect method
    client.$reconnect = async (): Promise<boolean> => {
      try {
        await client.$disconnect();
        await client.$connect();
        return await client.$healthCheck();
      } catch (error) {
        console.error('Database reconnection failed:', error);
        return false;
      }
    };

    return client;
  } catch (error) {
    console.error('Failed to initialize Prisma client:', error);
    throw error;
  }
};

// Initialize Prisma client with error handling
let prisma: CustomPrismaClient;
let isConnected = false;

try {
  // Use cached client if available (in development)
  if (globalForPrisma.prisma) {
    console.log('Using existing Prisma client instance');
    prisma = globalForPrisma.prisma;
  } else {
    console.log('Creating new Prisma client instance');
    prisma = createPrismaClient();
  }
  
  // Connect to the database
  prisma.$connect()
    .then(() => {
      console.log('Successfully connected to database');
      isConnected = true;
      
      // Set up periodic health checks in production
      if (process.env.NODE_ENV === 'production') {
        setInterval(async () => {
          const isHealthy = await prisma.$healthCheck();
          if (!isHealthy && isConnected) {
            console.warn('Database connection lost, attempting to reconnect...');
            isConnected = await prisma.$reconnect();
            console.log(isConnected ? 'Reconnection successful' : 'Reconnection failed');
          }
        }, CONNECTION_CHECK_INTERVAL);
      }
    })
    .catch(e => {
      console.error('Failed to connect to database:', e);
      isConnected = false;
    });
} catch (error) {
  console.error('Critical error initializing Prisma client:', error);
  
  // Provide a mock client as fallback for non-critical routes
  prisma = {
    $connect: async () => Promise.resolve(),
    $disconnect: async () => Promise.resolve(),
    $healthCheck: async () => Promise.resolve(false),
    $reconnect: async () => Promise.resolve(false),
    $queryRaw: async () => Promise.resolve([]),
    $on: () => ({ mock: true }),
    $use: () => ({ mock: true }),
    $transaction: async (arg: any) => arg instanceof Function ? arg([]) : [],
  } as unknown as CustomPrismaClient;
}

// Add middleware for query timeout and retry
prisma.$use(async (params: any, next: any) => {
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
      
      // Update connection status
      if (!isConnected) {
        isConnected = true;
        console.log('Database connection restored');
      }
      
      return result;
    } catch (error) {
      const isConnectionError =
        error instanceof Error &&
        (error.message.includes('Connection refused') ||
         error.message.includes('connection timeout') ||
         error.message.includes('Connection terminated unexpectedly') ||
         error.message.includes('pool is draining') ||
         error.message.includes('pool overflow') ||
         error.message.includes('Can\'t reach database server'));

      // Handle schema mismatch errors
      if (error instanceof Error && 
         (error.message.includes('does not exist in the current database') ||
          error.message.includes('Unknown field') ||
          error.message.includes('column') && error.message.includes('does not exist') ||
          error.message.includes('Invalid `prisma') && error.message.includes('invocation'))) {
        
        console.warn(`Schema mismatch error detected: ${error.message}`);
        
        // Check for specific errors like organizationId column missing
        if (error.message.includes('organizationId') && params.model === 'user') {
          console.log('Handling missing organizationId column in User model');
          
          // Remove the problematic field from the query
          if (params.args?.select?.organizationId) {
            delete params.args.select.organizationId;
          }
          
          if (params.args?.include?.organization) {
            delete params.args.include.organization;
          }
          
          if (params.args?.where?.organizationId) {
            delete params.args.where.organizationId;
          }
          
          if (params.args?.data?.organizationId) {
            delete params.args.data.organizationId;
          }
          
          // Try again with modified params
          return next(params);
        }
        
        // Automatic handling for unknown field errors
        if (error.message.includes('Unknown field')) {
          // Extract the field name from the error message
          const matches = error.message.match(/Unknown field `([^`]+)`/);
          if (matches && matches[1]) {
            const fieldName = matches[1];
            console.log(`Automatically removing unknown field: ${fieldName}`);
            
            // Remove the field from the appropriate location in params
            if (params.args?.select && params.args.select[fieldName] !== undefined) {
              delete params.args.select[fieldName];
            }
            
            if (params.args?.include && params.args.include[fieldName] !== undefined) {
              delete params.args.include[fieldName];
            }
            
            if (params.args?.where && params.args.where[fieldName] !== undefined) {
              delete params.args.where[fieldName];
            }
            
            if (params.args?.data && params.args.data[fieldName] !== undefined) {
              delete params.args.data[fieldName];
            }
            
            // Try again with modified params
            return next(params);
          }
        }
      }

      // Retry logic for connection issues
      if (isConnectionError && attempts < MAX_RETRIES) {
        console.warn(`Database connection error, retrying (${attempts}/${MAX_RETRIES})...`);
        
        // Mark connection as down
        if (isConnected) {
          isConnected = false;
          console.error('Database connection lost');
        }
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, attempts - 1)));
        
        // Attempt to reconnect before retry
        if (attempts === MAX_RETRIES - 1) {
          await prisma.$reconnect().catch(() => {});
        }
        
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
