/**
 * Jest Test Setup for LeadPulse
 * 
 * Global test configuration and mocks
 */

// Note: @testing-library/jest-dom not available, removed for compatibility

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/test-path',
}));

jest.mock('next/headers', () => ({
  headers: () => new Map(),
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
}));

// Mock Next-Auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      },
    },
    status: 'authenticated',
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Prisma
jest.mock('@/lib/db/prisma', () => ({
  __esModule: true,
  default: {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    contact: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    leadPulseVisitor: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    leadPulseTouchpoint: {
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
    },
    leadPulseForm: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    leadPulseFormSubmission: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    leadPulseSubmissionData: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
    webhookEndpoint: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    webhookDelivery: {
      findMany: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    incomingWebhook: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    leadPulseAuditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    leadPulseConsent: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    leadPulseDataRetention: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    leadPulseSecurityEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    emailCampaign: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    emailActivity: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    workflow: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workflowExecution: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    workflowExecutionStep: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

// Mock Redis/Cache
jest.mock('@/lib/cache/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    ping: jest.fn(),
    flushall: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    incr: jest.fn(),
    decr: jest.fn(),
    lpush: jest.fn(),
    lrange: jest.fn(),
    ltrim: jest.fn(),
    sadd: jest.fn(),
    srem: jest.fn(),
    smembers: jest.fn(),
    hget: jest.fn(),
    hset: jest.fn(),
    hdel: jest.fn(),
    hgetall: jest.fn(),
  },
}));

// Mock WebSocket
jest.mock('@/lib/websocket/leadpulse-realtime', () => ({
  leadPulseRealtime: {
    broadcastNewVisitor: jest.fn(),
    broadcastVisitorActivity: jest.fn(),
    broadcastAnalyticsUpdate: jest.fn(),
    broadcastFormSubmission: jest.fn(),
    getActiveConnections: jest.fn(() => 0),
    initialize: jest.fn(),
    shutdown: jest.fn(),
  },
}));

// Mock Logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock Environment Variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Mock fetch globally
global.fetch = jest.fn();

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
}));

// Mock crypto for browser fingerprinting
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    randomUUID: () => 'test-uuid-1234-5678-9012',
    createHmac: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn(() => 'mocked-hash'),
    })),
    timingSafeEqual: jest.fn(() => true),
  },
});

// Mock canvas for fingerprinting tests
global.HTMLCanvasElement = jest.fn().mockImplementation(() => ({
  getContext: jest.fn(() => ({
    fillText: jest.fn(),
    measureText: jest.fn(() => ({ width: 100 })),
    font: '',
    textBaseline: 'top',
  })),
  toDataURL: jest.fn(() => 'data:image/png;base64,test'),
}));

if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    fillText: jest.fn(),
    measureText: jest.fn(() => ({ width: 100 })),
    font: '',
    textBaseline: 'top',
  }));
  
  HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,test');
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test Browser) LeadPulse/1.0',
    language: 'en-US',
    sendBeacon: jest.fn(() => true),
    geolocation: {
      getCurrentPosition: jest.fn(),
      watchPosition: jest.fn(),
      clearWatch: jest.fn(),
    },
  },
});

// Mock screen
Object.defineProperty(window, 'screen', {
  value: {
    width: 1920,
    height: 1080,
    colorDepth: 24,
  },
});

// Mock Date.now for consistent timestamps in tests
const mockTimestamp = 1640995200000; // 2022-01-01 00:00:00 UTC
Date.now = jest.fn(() => mockTimestamp);

// Mock URL constructor
global.URL = jest.fn().mockImplementation((url) => ({
  href: url,
  origin: 'http://localhost:3000',
  pathname: '/test',
  search: '',
  searchParams: new URLSearchParams(),
  hash: '',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  protocol: 'http:',
}));

// Console spy setup for test debugging
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
});

// Global test utilities
export const testUtils = {
  // Create a mock visitor object
  createMockVisitor: (overrides = {}) => ({
    id: 'visitor_test_123',
    fingerprint: 'fp_test_fingerprint',
    score: 50,
    sessionCount: 1,
    pageViews: 1,
    firstSeen: new Date(),
    lastSeen: new Date(),
    location: {
      country: 'Nigeria',
      city: 'Lagos',
      timezone: 'Africa/Lagos',
    },
    device: 'Desktop',
    browser: 'Chrome',
    isConverted: false,
    metadata: {},
    ...overrides,
  }),

  // Create a mock form object
  createMockForm: (overrides = {}) => ({
    id: 'form_test_123',
    name: 'Test Contact Form',
    description: 'A test form for unit testing',
    status: 'active',
    fields: [
      {
        id: 'email',
        type: 'EMAIL',
        label: 'Email Address',
        required: true,
        placeholder: 'Enter your email',
      },
      {
        id: 'name',
        type: 'TEXT',
        label: 'Full Name',
        required: true,
        placeholder: 'Enter your name',
      },
    ],
    styling: {
      theme: 'light',
      primaryColor: '#007bff',
    },
    settings: {
      successMessage: 'Thank you for your submission!',
      emailNotifications: true,
    },
    userId: 'user_test_123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  // Create a mock contact object
  createMockContact: (overrides = {}) => ({
    id: 'contact_test_123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    company: 'Test Company',
    phone: '+1234567890',
    source: 'LeadPulse',
    leadScore: 75,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  // Create a mock CRM integration config
  createMockCRMConfig: (platform: 'salesforce' | 'hubspot' = 'salesforce', overrides = {}) => ({
    platform,
    credentials: platform === 'salesforce' 
      ? {
          clientId: 'test_client_id',
          clientSecret: 'test_client_secret',
          refreshToken: 'test_refresh_token',
          instanceUrl: 'https://test.salesforce.com',
        }
      : {
          apiKey: 'test_hubspot_api_key',
        },
    mappings: {
      leadSource: 'LeadPulse',
    },
    syncSettings: {
      autoSync: true,
      syncInterval: 60,
      syncDirection: 'to_crm' as const,
      conflictResolution: 'leadpulse_wins' as const,
    },
    ...overrides,
  }),

  // Mock NextRequest helper
  createMockRequest: (url: string, options: RequestInit = {}) => {
    return {
      url,
      method: options.method || 'GET',
      headers: new Headers(options.headers),
      json: async () => options.body ? JSON.parse(options.body as string) : {},
      text: async () => options.body as string || '',
      formData: async () => new FormData(),
      ...options,
    };
  },

  // Wait for async operations in tests
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate test fingerprint
  generateTestFingerprint: () => `fp_test_${Math.random().toString(36).substr(2, 9)}`,

  // Generate test session ID
  generateTestSessionId: () => `lp_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
};

export default testUtils;