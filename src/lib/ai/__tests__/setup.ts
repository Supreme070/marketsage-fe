import type { PrismaClient } from '@prisma/client';
import { mockDeep, type DeepMockProxy } from 'jest-mock-extended';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock Prisma with proper enums
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockDeep<PrismaClient>()),
  UserRole: {
    USER: 'USER',
    ADMIN: 'ADMIN',
    IT_ADMIN: 'IT_ADMIN',
    SUPER_ADMIN: 'SUPER_ADMIN'
  },
  ActivityType: {
    SENT: 'SENT',
    DELIVERED: 'DELIVERED',
    OPENED: 'OPENED',
    CLICKED: 'CLICKED',
    BOUNCED: 'BOUNCED',
    UNSUBSCRIBED: 'UNSUBSCRIBED',
    REPLIED: 'REPLIED',
    FAILED: 'FAILED'
  }
}));

declare global {
  // eslint-disable-next-line no-var
  var mockPrisma: DeepMockProxy<PrismaClient>;
}

beforeEach(() => {
  const mockPrisma = mockDeep<PrismaClient>();
  global.mockPrisma = mockPrisma;
}); 