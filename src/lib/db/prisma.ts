/**
 * Prisma Client Stub (Frontend)
 * ==============================
 *
 * This file has been converted to a stub to prevent direct database access from the frontend.
 * All database operations should go through the backend API at http://localhost:3006/api/v2/
 *
 * Importing this file will not cause errors, but attempting to use the Prisma client
 * will throw clear error messages directing developers to use the API instead.
 */

import { PrismaClient } from '@/types/prisma-types';

// Custom Prisma Client interface with helper methods
interface CustomPrismaClient {
  $healthCheck: () => Promise<boolean>;
  $reconnect: () => Promise<boolean>;
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
  $queryRaw: (...args: any[]) => Promise<any>;
  $on: (...args: any[]) => any;
  $use: (...args: any[]) => any;
  $transaction: (...args: any[]) => Promise<any>;

  // Add type for models (using index signature)
  [key: string]: any;
}

// Create a blocked Prisma client that throws errors on use
const createBlockedClient = (): CustomPrismaClient => {
  return {
    $healthCheck: async () => {
      console.warn('⚠️  FRONTEND DATABASE ACCESS BLOCKED: Database health check not available. Check backend API health instead.');
      return false;
    },
    $reconnect: async () => {
      console.warn('⚠️  FRONTEND DATABASE ACCESS BLOCKED: Database reconnect not available.');
      return false;
    },
    $connect: async () => {
      console.warn('⚠️  FRONTEND DATABASE ACCESS BLOCKED: Database connect not available.');
    },
    $disconnect: async () => {
      // Silently succeed for disconnect (no-op)
    },
    $queryRaw: async () => {
      throw new Error('⚠️  FRONTEND DATABASE ACCESS BLOCKED: Direct database queries not allowed. Use backend API endpoints instead.');
    },
    $on: () => {
      throw new Error('⚠️  FRONTEND DATABASE ACCESS BLOCKED: Database event listeners not allowed.');
    },
    $use: () => {
      throw new Error('⚠️  FRONTEND DATABASE ACCESS BLOCKED: Database middleware not allowed.');
    },
    $transaction: async () => {
      throw new Error('⚠️  FRONTEND DATABASE ACCESS BLOCKED: Direct database transactions not allowed. Use backend API endpoints instead.');
    },
    // Block all model operations with dynamic getters
    ...new Proxy({}, {
      get(_target, prop) {
        if (typeof prop === 'string' && !prop.startsWith('$')) {
          // This is likely a model name (user, contact, campaign, etc.)
          return new Proxy({}, {
            get(_modelTarget, operation) {
              throw new Error(`⚠️  FRONTEND DATABASE ACCESS BLOCKED: prisma.${prop}.${String(operation)}() not allowed. Use backend API endpoint /api/v2/${prop}/* instead.`);
            }
          });
        }
        return undefined;
      }
    }),
  } as unknown as CustomPrismaClient;
};

// Export the blocked client
const prisma: CustomPrismaClient = createBlockedClient();

export default prisma;
export { prisma };
export { prisma as db };
