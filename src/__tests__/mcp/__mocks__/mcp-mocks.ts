/**
 * Mock implementations for MCP testing
 * 
 * These mocks simulate database and external service behavior while
 * allowing us to test that the MCP servers are correctly integrating
 * with real data sources.
 */

import { jest } from '@jest/globals';

// Mock Prisma client with realistic database interactions
export const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  organization: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  contact: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn()
  },
  campaign: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn()
  },
  segment: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  leadPulseVisitor: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn()
  },
  leadPulseSession: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn()
  },
  $disconnect: jest.fn(),
  $connect: jest.fn(),
  $transaction: jest.fn()
};

// Mock Redis client with rate limiting and caching functionality
export const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  increment: jest.fn(),
  decrement: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  exists: jest.fn(),
  del: jest.fn(),
  flushall: jest.fn(),
  ping: jest.fn(),
  disconnect: jest.fn(),
  client: {
    exists: jest.fn(),
    ttl: jest.fn()
  }
};

// Mock enterprise audit logger
export const mockAuditLogger = {
  logEvent: jest.fn(),
  logSecurityEvent: jest.fn(),
  logMCPActivity: jest.fn()
};

// Mock NextAuth session validation
export const mockNextAuth = {
  getServerSession: jest.fn(),
  validateSession: jest.fn()
};

// Test data factories for realistic test scenarios
export const testDataFactory = {
  createUser: (overrides?: any) => ({
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    organizationId: 'org-456',
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    organization: {
      id: 'org-456',
      name: 'Test Organization',
      slug: 'test-org',
      plan: 'pro'
    },
    ...overrides
  }),

  createOrganization: (overrides?: any) => ({
    id: 'org-456',
    name: 'Test Organization',
    slug: 'test-org',
    plan: 'pro',
    apiKey: 'test-api-key',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  createContact: (overrides?: any) => ({
    id: 'contact-789',
    email: 'contact@example.com',
    firstName: 'John',
    lastName: 'Doe',
    organizationId: 'org-456',
    createdById: 'user-123',
    tags: [],
    customFields: {},
    lastActivity: new Date(),
    engagementScore: 75,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  createCampaign: (overrides?: any) => ({
    id: 'campaign-101',
    name: 'Test Campaign',
    type: 'EMAIL',
    status: 'ACTIVE',
    organizationId: 'org-456',
    createdById: 'user-123',
    subject: 'Test Subject',
    content: '<p>Test content</p>',
    scheduledAt: new Date(),
    sentAt: null,
    stats: {
      sent: 100,
      delivered: 95,
      opened: 45,
      clicked: 12,
      bounced: 5,
      unsubscribed: 2
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  createSegment: (overrides?: any) => ({
    id: 'segment-202',
    name: 'High Engagement Users',
    organizationId: 'org-456',
    description: 'Users with high engagement scores',
    conditions: {
      all: [
        { field: 'engagement_score', operator: 'gt', value: 70 }
      ]
    },
    contactCount: 150,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  createVisitor: (overrides?: any) => ({
    id: 'visitor-303',
    fingerprint: 'fp_abc123',
    organizationId: 'org-456',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 Test Browser',
    country: 'NG',
    city: 'Lagos',
    source: 'organic',
    firstSeen: new Date(),
    lastSeen: new Date(),
    sessionCount: 3,
    pageViews: 15,
    engagementScore: 65,
    isBot: false,
    ...overrides
  }),

  createSession: (overrides?: any) => ({
    id: 'session-404',
    visitorId: 'visitor-303',
    organizationId: 'org-456',
    startedAt: new Date(),
    endedAt: null,
    duration: 0,
    pageViews: 1,
    events: [],
    referrer: 'https://google.com',
    landingPage: '/home',
    exitPage: null,
    ...overrides
  })
};

// Mock rate limiting scenarios
export const mockRateLimitScenarios = {
  withinLimit: () => {
    mockRedisClient.increment.mockResolvedValue(5); // Under limit
    mockRedisClient.ttl.mockResolvedValue(3600); // 1 hour remaining
  },

  approachingLimit: () => {
    mockRedisClient.increment.mockResolvedValue(8); // 80% of limit
    mockRedisClient.ttl.mockResolvedValue(1800); // 30 minutes remaining
  },

  exceedsLimit: () => {
    mockRedisClient.increment.mockResolvedValue(15); // Over limit of 10
    mockRedisClient.ttl.mockResolvedValue(900); // 15 minutes remaining
  },

  redisUnavailable: () => {
    mockRedisClient.increment.mockResolvedValue(null); // Redis error
  }
};

// Mock authentication scenarios
export const mockAuthScenarios = {
  validUser: () => {
    const user = testDataFactory.createUser();
    mockPrismaClient.user.findUnique.mockResolvedValue(user);
    return user;
  },

  adminUser: () => {
    const user = testDataFactory.createUser({ role: 'ADMIN' });
    mockPrismaClient.user.findUnique.mockResolvedValue(user);
    return user;
  },

  superAdminUser: () => {
    const user = testDataFactory.createUser({ role: 'SUPER_ADMIN' });
    mockPrismaClient.user.findUnique.mockResolvedValue(user);
    return user;
  },

  inactiveUser: () => {
    const user = testDataFactory.createUser({ isActive: false });
    mockPrismaClient.user.findUnique.mockResolvedValue(user);
    return user;
  },

  nonexistentUser: () => {
    mockPrismaClient.user.findUnique.mockResolvedValue(null);
  },

  databaseError: () => {
    mockPrismaClient.user.findUnique.mockRejectedValue(new Error('Database connection failed'));
  }
};

// Mock database query scenarios for performance testing
export const mockDatabaseScenarios = {
  fastQuery: (data: any) => {
    return new Promise(resolve => {
      setTimeout(() => resolve(data), 10); // 10ms response
    });
  },

  slowQuery: (data: any) => {
    return new Promise(resolve => {
      setTimeout(() => resolve(data), 1000); // 1s response
    });
  },

  timeoutQuery: () => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout')), 5000);
    });
  },

  largeDataset: () => {
    return Array.from({ length: 1000 }, (_, i) => 
      testDataFactory.createContact({ id: `contact-${i}`, email: `user${i}@example.com` })
    );
  }
};

// Reset all mocks helper
export const resetAllMocks = () => {
  Object.values(mockPrismaClient).forEach(mock => {
    if (typeof mock === 'object') {
      Object.values(mock).forEach(method => {
        if (jest.isMockFunction(method)) {
          method.mockReset();
        }
      });
    }
  });

  Object.values(mockRedisClient).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });

  Object.values(mockAuditLogger).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });

  Object.values(mockNextAuth).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });
};

// Helper to setup default successful mocks
export const setupDefaultMocks = () => {
  // Default user lookup
  mockPrismaClient.user.findUnique.mockResolvedValue(testDataFactory.createUser());
  
  // Default rate limiting
  mockRedisClient.increment.mockResolvedValue(1);
  mockRedisClient.expire.mockResolvedValue(true);
  mockRedisClient.ttl.mockResolvedValue(3600);
  
  // Default audit logging
  mockAuditLogger.logEvent.mockResolvedValue(undefined);
  mockAuditLogger.logSecurityEvent.mockResolvedValue(undefined);
  
  // Default database connection
  mockPrismaClient.$disconnect.mockResolvedValue(undefined);
  mockPrismaClient.$connect.mockResolvedValue(undefined);
  
  // Default Redis connection
  mockRedisClient.ping.mockResolvedValue('PONG');
  mockRedisClient.disconnect.mockResolvedValue(undefined);
};

// Export all mocks
export {
  mockPrismaClient as prisma,
  mockRedisClient as redisCache,
  mockAuditLogger as enterpriseAuditLogger,
  mockNextAuth
};