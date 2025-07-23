// Browser-safe imports
let PrismaClient: any;
let Prisma: any;
let fs: any;
let path: any;
let extractTenantIdFromEnvironment: any;

// Only import server-side modules when not in browser
if (typeof window === 'undefined') {
  const prismaModule = require("@prisma/client");
  PrismaClient = prismaModule.PrismaClient;
  Prisma = prismaModule.Prisma;
  fs = require('fs');
  path = require('path');
  
  // Import tenant context utilities (Edge Runtime compatible)
  try {
    const tenantModule = require('@/lib/tenant/edge-tenant-context');
    extractTenantIdFromEnvironment = tenantModule.extractTenantIdFromEnvironment;
  } catch (error) {
    console.warn('Could not load tenant context utilities:', error);
    extractTenantIdFromEnvironment = () => null;
  }
}

// Add custom methods to PrismaClient
interface CustomPrismaClient {
  $healthCheck: () => Promise<boolean>;
  $reconnect: () => Promise<boolean>;
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
  
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

// Check if we're running in a Docker environment (server-side only)
const isDocker = typeof window === 'undefined' && fs && 
  (fs.existsSync('/.dockerenv') || (process.env.DOCKER_CONTAINER === 'true'));

// Create a new PrismaClient instance
const createPrismaClient = (): CustomPrismaClient => {
  // Return null client if in browser
  if (typeof window !== 'undefined') {
    return {
      $healthCheck: async () => false,
      $reconnect: async () => false,
      $connect: async () => {},
      $disconnect: async () => {},
    } as CustomPrismaClient;
  }

  try {
    // Set up Prisma client with appropriate options
    const clientOptions: any = {
      log: [
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' }
      ]
    };

    // Add database URL if available
    if (process.env.DATABASE_URL) {
      clientOptions.datasources = {
        db: {
          url: process.env.DATABASE_URL
        }
      };
    }

    const client = new PrismaClient(clientOptions) as CustomPrismaClient;

    // Add custom health check method
    client.$healthCheck = async (): Promise<boolean> => {
      try {
        await client.$queryRaw`SELECT 1`;
        return true;
      } catch (error) {
        console.error('Database health check failed:', error);
        return false;
      }
    };

    // Add custom reconnect method
    client.$reconnect = async (): Promise<boolean> => {
      try {
        await client.$disconnect();
        await client.$connect();
        return true;
      } catch (error) {
        console.error('Database reconnect failed:', error);
        return false;
      }
    };

    return client;
  } catch (error) {
    console.error('Error creating Prisma client:', error);
    throw error;
  }
};

// Initialize Prisma client
let prisma: CustomPrismaClient;
let isConnected = false;

// Create the client
if (typeof window !== 'undefined') {
  // Browser environment - use mock client
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
} else {
  try {
    // Use cached client if available (in development)
    if (globalForPrisma.prisma) {
      console.log('Using existing Prisma client instance');
      prisma = globalForPrisma.prisma;
    } else {
      console.log('Creating new Prisma client instance');
      prisma = createPrismaClient();
    }
    
    // Connect to the database only if not in build mode and not in browser
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
      process.env.BUILDING === 'true' ||
      process.argv.includes('build') ||
      (process.argv.includes('next') && process.argv.includes('build')) ||
      process.env.NODE_ENV === 'test' ||
      process.env.CI === 'true';
    
    if (typeof window === 'undefined' && !isBuildTime) {
      prisma.$connect()
        .then(() => {
          console.log('Successfully connected to database');
          isConnected = true;
        
          // Set up periodic health checks in production
          if (process.env.NODE_ENV === 'production') {
            setInterval(async () => {
              const healthy = await prisma.$healthCheck();
              if (!healthy) {
                console.error('Database health check failed');
                isConnected = false;
              }
            }, CONNECTION_CHECK_INTERVAL);
          }
        })
        .catch(e => {
          console.error('Failed to connect to database:', e);
          isConnected = false;
        });
    }
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
}

// Helper function to get current tenant ID from request context
function getCurrentTenantId(): string | null {
  try {
    // Use the tenant context utility
    return extractTenantIdFromEnvironment ? extractTenantIdFromEnvironment() : null;
  } catch (error) {
    console.warn('Could not determine tenant context:', error);
    return null;
  }
}

// Setup proper shutdown for production
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  const gracefulShutdown = async () => {
    console.log('Closing Prisma client connection...');
    await prisma.$disconnect();
    console.log('Prisma client disconnected');
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

// In development, we reuse the same client across requests
if (typeof window === 'undefined' && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
export { prisma };
export { prisma as db };