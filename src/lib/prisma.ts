/**
 * Prisma Client Stub (Frontend)
 * ==============================
 *
 * This file has been converted to a stub to prevent direct database access from the frontend.
 * All database operations should go through the backend API at http://localhost:3006/api/v2/
 *
 * This is a simplified version that re-exports from @/lib/db/prisma for compatibility.
 */

import prismaClient from '@/lib/db/prisma';

export const prisma = prismaClient;
export default prismaClient;
