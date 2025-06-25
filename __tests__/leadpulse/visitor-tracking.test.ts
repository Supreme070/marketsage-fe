/**
 * LeadPulse Visitor Tracking Tests
 * 
 * Tests for visitor tracking functionality including:
 * - Visitor identification and fingerprinting
 * - Event tracking and analytics
 * - Real-time updates and WebSocket communication
 * - Engagement scoring
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { createMocks } from 'node-mocks-http';
import { POST, GET } from '@/app/api/leadpulse/visitors/route';
import prisma from '@/lib/db/prisma';
import { leadPulseCache } from '@/lib/cache/leadpulse-cache';
import { leadPulseRealtime } from '@/lib/websocket/leadpulse-realtime';

// Mock dependencies
jest.mock('@/lib/db/prisma', () => ({
  leadPulseVisitor: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
  leadPulseTouchpoint: {
    create: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
}));

jest.mock('@/lib/cache/leadpulse-cache', () => ({
  leadPulseCache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    addRecentActivity: jest.fn(),
    incrementCounter: jest.fn(),
    getAnalyticsOverview: jest.fn(),
  },
}));

jest.mock('@/lib/websocket/leadpulse-realtime', () => ({
  leadPulseRealtime: {
    broadcastNewVisitor: jest.fn(),
    broadcastVisitorActivity: jest.fn(),
    broadcastAnalyticsUpdate: jest.fn(),
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({
    user: { id: 'user123', email: 'test@example.com' }
  })),
}));

// Helper function to create NextRequest
function createNextRequest(method: string, url: string, body?: any) {
  const request = new NextRequest(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'X-Forwarded-For': '192.168.1.1',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return request;
}

describe('LeadPulse Visitor Tracking API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/leadpulse/visitors', () => {
    test('should create new visitor with valid data', async () => {
      const visitorData = {
        fingerprint: 'fp_test123456789',
        event: {
          type: 'pageview',
          sessionId: 'lp_session123',
          timestamp: Date.now(),
          data: {
            url: 'https://example.com',
            title: 'Test Page',
            viewport: { width: 1920, height: 1080 },
            referrer: 'https://google.com',
          },
        },
        url: 'https://example.com',
        title: 'Test Page',
        location: 'Africa/Lagos',
        device: 'Desktop',
        browser: 'Chrome',
      };

      const mockVisitor = {
        id: 'visitor123',
        fingerprint: visitorData.fingerprint,
        score: 10,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock Prisma responses
      (prisma.leadPulseVisitor.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.leadPulseVisitor.create as jest.Mock).mockResolvedValue(mockVisitor);
      (prisma.leadPulseTouchpoint.create as jest.Mock).mockResolvedValue({
        id: 'touchpoint123',
        visitorId: 'visitor123',
        type: 'pageview',
        data: visitorData.event.data,
      });

      // Mock cache responses
      (leadPulseCache.set as jest.Mock).mockResolvedValue(true);
      (leadPulseCache.addRecentActivity as jest.Mock).mockResolvedValue(true);

      const request = createNextRequest('POST', 'http://localhost:3000/api/leadpulse/visitors', visitorData);
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.visitorId).toBe('visitor123');
      expect(responseData.score).toBe(10);

      // Verify database calls
      expect(prisma.leadPulseVisitor.findUnique).toHaveBeenCalledWith({
        where: { fingerprint: visitorData.fingerprint },
      });
      expect(prisma.leadPulseVisitor.create).toHaveBeenCalled();
      expect(prisma.leadPulseTouchpoint.create).toHaveBeenCalled();

      // Verify real-time broadcast
      expect(leadPulseRealtime.broadcastNewVisitor).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'visitor123',
          fingerprint: visitorData.fingerprint,
        })
      );
    });

    test('should update existing visitor with new event', async () => {
      const visitorData = {
        fingerprint: 'fp_existing123',
        event: {
          type: 'click',
          sessionId: 'lp_session123',
          timestamp: Date.now(),
          data: {
            element: {
              tagName: 'button',
              text: 'Sign Up',
              id: 'signup-btn',
            },
            x: 100,
            y: 200,
          },
        },
        url: 'https://example.com/signup',
        title: 'Sign Up Page',
        device: 'Mobile',
        browser: 'Safari',
      };

      const existingVisitor = {
        id: 'visitor456',
        fingerprint: visitorData.fingerprint,
        score: 25,
        sessionCount: 2,
        metadata: { device: 'Desktop' },
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        updatedAt: new Date(),
      };

      const updatedVisitor = {
        ...existingVisitor,
        score: 35, // Score increased due to click event
        metadata: { device: 'Mobile' }, // Updated device info
        updatedAt: new Date(),
      };

      // Mock Prisma responses
      (prisma.leadPulseVisitor.findUnique as jest.Mock).mockResolvedValue(existingVisitor);
      (prisma.leadPulseVisitor.update as jest.Mock).mockResolvedValue(updatedVisitor);
      (prisma.leadPulseTouchpoint.create as jest.Mock).mockResolvedValue({
        id: 'touchpoint456',
        visitorId: 'visitor456',
        type: 'click',
        data: visitorData.event.data,
      });

      const request = createNextRequest('POST', 'http://localhost:3000/api/leadpulse/visitors', visitorData);
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.visitorId).toBe('visitor456');
      expect(responseData.score).toBe(35);
      expect(responseData.isNew).toBe(false);

      // Verify visitor was updated, not created
      expect(prisma.leadPulseVisitor.update).toHaveBeenCalledWith({
        where: { id: 'visitor456' },
        data: expect.objectContaining({
          score: 35,
          metadata: expect.objectContaining({
            device: 'Mobile',
          }),
        }),
      });

      // Verify activity broadcast
      expect(leadPulseRealtime.broadcastVisitorActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          visitorId: 'visitor456',
          activity: {
            type: 'click',
            data: visitorData.event.data,
          },
        })
      );
    });

    test('should handle engagement scoring correctly', async () => {
      const testCases = [
        {
          eventType: 'pageview',
          expectedScoreIncrease: 5,
          description: 'basic page view',
        },
        {
          eventType: 'click',
          expectedScoreIncrease: 10,
          description: 'button click',
        },
        {
          eventType: 'form_focus',
          expectedScoreIncrease: 15,
          description: 'form interaction',
        },
        {
          eventType: 'form_submit',
          expectedScoreIncrease: 30,
          description: 'form submission',
        },
        {
          eventType: 'scroll_milestone',
          expectedScoreIncrease: 2,
          description: 'scroll depth milestone',
        },
      ];

      for (const testCase of testCases) {
        const visitorData = {
          fingerprint: `fp_${testCase.eventType}_test`,
          event: {
            type: testCase.eventType,
            sessionId: 'lp_session123',
            timestamp: Date.now(),
            data: {},
          },
          url: 'https://example.com',
          title: 'Test Page',
        };

        const existingVisitor = {
          id: 'visitor_test',
          fingerprint: visitorData.fingerprint,
          score: 20,
          metadata: {},
        };

        (prisma.leadPulseVisitor.findUnique as jest.Mock).mockResolvedValue(existingVisitor);
        (prisma.leadPulseVisitor.update as jest.Mock).mockResolvedValue({
          ...existingVisitor,
          score: 20 + testCase.expectedScoreIncrease,
        });
        (prisma.leadPulseTouchpoint.create as jest.Mock).mockResolvedValue({});

        const request = createNextRequest('POST', 'http://localhost:3000/api/leadpulse/visitors', visitorData);
        const response = await POST(request);
        const responseData = await response.json();

        expect(responseData.score).toBe(20 + testCase.expectedScoreIncrease);
      }
    });

    test('should validate required fields', async () => {
      const invalidRequests = [
        {
          description: 'missing fingerprint',
          data: {
            event: { type: 'pageview', sessionId: 'test', timestamp: Date.now() },
            url: 'https://example.com',
          },
        },
        {
          description: 'missing event',
          data: {
            fingerprint: 'fp_test123',
            url: 'https://example.com',
          },
        },
        {
          description: 'invalid event type',
          data: {
            fingerprint: 'fp_test123',
            event: { type: 'invalid_event', sessionId: 'test', timestamp: Date.now() },
            url: 'https://example.com',
          },
        },
        {
          description: 'missing URL',
          data: {
            fingerprint: 'fp_test123',
            event: { type: 'pageview', sessionId: 'test', timestamp: Date.now() },
          },
        },
      ];

      for (const invalidRequest of invalidRequests) {
        const request = createNextRequest('POST', 'http://localhost:3000/api/leadpulse/visitors', invalidRequest.data);
        const response = await POST(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.success).toBe(false);
        expect(responseData.error).toBeDefined();
      }
    });

    test('should handle rate limiting', async () => {
      // Mock rate limit exceeded scenario
      const visitorData = {
        fingerprint: 'fp_rate_limit_test',
        event: {
          type: 'pageview',
          sessionId: 'lp_session123',
          timestamp: Date.now(),
        },
        url: 'https://example.com',
      };

      // Simulate multiple rapid requests
      const requests = Array(15).fill(null).map(() => 
        createNextRequest('POST', 'http://localhost:3000/api/leadpulse/visitors', visitorData)
      );

      // The rate limiter should kick in after a certain number of requests
      // Note: This test depends on the actual rate limiting implementation
      const responses = await Promise.all(requests.map(req => POST(req)));
      
      // Some requests should be rate limited (status 429)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/leadpulse/visitors', () => {
    test('should return visitor analytics for authenticated user', async () => {
      const mockAnalytics = {
        totalVisitors: 150,
        uniqueVisitors: 120,
        avgEngagementScore: 45.5,
        conversionRate: 3.2,
        topPages: [
          { url: '/home', views: 50, conversionRate: 2.1 },
          { url: '/products', views: 30, conversionRate: 5.5 },
        ],
        deviceBreakdown: {
          desktop: 65.4,
          mobile: 28.7,
          tablet: 5.9,
        },
      };

      const mockVisitors = [
        {
          id: 'visitor1',
          fingerprint: 'fp_123',
          score: 75,
          firstSeen: new Date(),
          lastSeen: new Date(),
          location: { country: 'Nigeria', city: 'Lagos' },
          device: 'Desktop',
          browser: 'Chrome',
          isConverted: false,
        },
        {
          id: 'visitor2',
          fingerprint: 'fp_456',
          score: 25,
          firstSeen: new Date(),
          lastSeen: new Date(),
          location: { country: 'Kenya', city: 'Nairobi' },
          device: 'Mobile',
          browser: 'Safari',
          isConverted: true,
        },
      ];

      // Mock authenticated user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
      });

      // Mock cache response
      (leadPulseCache.getAnalyticsOverview as jest.Mock).mockResolvedValue(mockAnalytics);

      // Mock database response
      (prisma.leadPulseVisitor.findMany as jest.Mock).mockResolvedValue(mockVisitors);

      const request = createNextRequest('GET', 'http://localhost:3000/api/leadpulse/visitors?timeframe=week&limit=50');
      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.visitors).toHaveLength(2);
      expect(responseData.analytics).toEqual(mockAnalytics);
      expect(responseData.pagination).toBeDefined();

      // Verify database query with correct filters
      expect(prisma.leadPulseVisitor.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
          }),
        }),
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
        include: expect.any(Object),
      });
    });

    test('should handle pagination correctly', async () => {
      const request = createNextRequest('GET', 'http://localhost:3000/api/leadpulse/visitors?limit=10&offset=20');
      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.pagination).toEqual({
        limit: 10,
        offset: 20,
        hasNext: expect.any(Boolean),
        hasPrev: true,
      });

      // Verify pagination parameters passed to database
      expect(prisma.leadPulseVisitor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });

    test('should filter by timeframe correctly', async () => {
      const timeframes = ['hour', 'day', 'week', 'month'];

      for (const timeframe of timeframes) {
        const request = createNextRequest('GET', `http://localhost:3000/api/leadpulse/visitors?timeframe=${timeframe}`);
        await GET(request);

        // Verify the correct date filter was applied
        expect(prisma.leadPulseVisitor.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              createdAt: expect.objectContaining({
                gte: expect.any(Date),
              }),
            }),
          })
        );
      }
    });

    test('should require authentication', async () => {
      // Mock unauthenticated request
      jest.doMock('next-auth', () => ({
        getServerSession: jest.fn(() => Promise.resolve(null)),
      }));

      const request = createNextRequest('GET', 'http://localhost:3000/api/leadpulse/visitors');
      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Unauthorized');
    });
  });

  describe('Real-time Features', () => {
    test('should broadcast new visitor events', async () => {
      const visitorData = {
        fingerprint: 'fp_realtime_test',
        event: {
          type: 'pageview',
          sessionId: 'lp_session123',
          timestamp: Date.now(),
        },
        url: 'https://example.com',
        title: 'Test Page',
      };

      const mockVisitor = {
        id: 'visitor_realtime',
        fingerprint: visitorData.fingerprint,
        score: 10,
      };

      (prisma.leadPulseVisitor.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.leadPulseVisitor.create as jest.Mock).mockResolvedValue(mockVisitor);
      (prisma.leadPulseTouchpoint.create as jest.Mock).mockResolvedValue({});

      const request = createNextRequest('POST', 'http://localhost:3000/api/leadpulse/visitors', visitorData);
      await POST(request);

      // Verify real-time broadcast was called
      expect(leadPulseRealtime.broadcastNewVisitor).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'visitor_realtime',
          fingerprint: visitorData.fingerprint,
        })
      );

      expect(leadPulseRealtime.broadcastAnalyticsUpdate).toHaveBeenCalled();
    });

    test('should broadcast visitor activity updates', async () => {
      const visitorData = {
        fingerprint: 'fp_activity_test',
        event: {
          type: 'form_submit',
          sessionId: 'lp_session123',
          timestamp: Date.now(),
          data: {
            formId: 'contact-form',
            fields: ['name', 'email'],
          },
        },
        url: 'https://example.com/contact',
      };

      const existingVisitor = {
        id: 'visitor_activity',
        fingerprint: visitorData.fingerprint,
        score: 30,
      };

      (prisma.leadPulseVisitor.findUnique as jest.Mock).mockResolvedValue(existingVisitor);
      (prisma.leadPulseVisitor.update as jest.Mock).mockResolvedValue({
        ...existingVisitor,
        score: 60,
      });
      (prisma.leadPulseTouchpoint.create as jest.Mock).mockResolvedValue({});

      const request = createNextRequest('POST', 'http://localhost:3000/api/leadpulse/visitors', visitorData);
      await POST(request);

      // Verify activity broadcast
      expect(leadPulseRealtime.broadcastVisitorActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          visitorId: 'visitor_activity',
          activity: expect.objectContaining({
            type: 'form_submit',
          }),
        })
      );
    });
  });

  describe('Caching Behavior', () => {
    test('should cache visitor data correctly', async () => {
      const visitorData = {
        fingerprint: 'fp_cache_test',
        event: {
          type: 'pageview',
          sessionId: 'lp_session123',
          timestamp: Date.now(),
        },
        url: 'https://example.com',
      };

      const mockVisitor = {
        id: 'visitor_cache',
        fingerprint: visitorData.fingerprint,
        score: 15,
      };

      (prisma.leadPulseVisitor.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.leadPulseVisitor.create as jest.Mock).mockResolvedValue(mockVisitor);
      (prisma.leadPulseTouchpoint.create as jest.Mock).mockResolvedValue({});

      const request = createNextRequest('POST', 'http://localhost:3000/api/leadpulse/visitors', visitorData);
      await POST(request);

      // Verify caching operations
      expect(leadPulseCache.set).toHaveBeenCalledWith(
        `visitor:${visitorData.fingerprint}`,
        expect.objectContaining({
          id: 'visitor_cache',
          fingerprint: visitorData.fingerprint,
        }),
        expect.any(Number) // TTL
      );

      expect(leadPulseCache.addRecentActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'visitor_activity',
          visitorId: 'visitor_cache',
        })
      );
    });

    test('should use cached data when available', async () => {
      const fingerprint = 'fp_cached_visitor';
      const cachedVisitor = {
        id: 'cached_visitor',
        fingerprint,
        score: 40,
      };

      // Mock cache hit
      (leadPulseCache.get as jest.Mock).mockResolvedValue(cachedVisitor);

      const visitorData = {
        fingerprint,
        event: {
          type: 'click',
          sessionId: 'lp_session123',
          timestamp: Date.now(),
        },
        url: 'https://example.com',
      };

      const request = createNextRequest('POST', 'http://localhost:3000/api/leadpulse/visitors', visitorData);
      await POST(request);

      // Should use cached data and not query database for visitor lookup
      expect(leadPulseCache.get).toHaveBeenCalledWith(`visitor:${fingerprint}`);
      expect(prisma.leadPulseVisitor.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      const visitorData = {
        fingerprint: 'fp_db_error_test',
        event: {
          type: 'pageview',
          sessionId: 'lp_session123',
          timestamp: Date.now(),
        },
        url: 'https://example.com',
      };

      // Mock database error
      (prisma.leadPulseVisitor.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = createNextRequest('POST', 'http://localhost:3000/api/leadpulse/visitors', visitorData);
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Failed to track visitor');
    });

    test('should handle cache errors gracefully', async () => {
      const visitorData = {
        fingerprint: 'fp_cache_error_test',
        event: {
          type: 'pageview',
          sessionId: 'lp_session123',
          timestamp: Date.now(),
        },
        url: 'https://example.com',
      };

      const mockVisitor = {
        id: 'visitor_cache_error',
        fingerprint: visitorData.fingerprint,
        score: 10,
      };

      // Mock cache error
      (leadPulseCache.set as jest.Mock).mockRejectedValue(
        new Error('Redis connection failed')
      );

      (prisma.leadPulseVisitor.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.leadPulseVisitor.create as jest.Mock).mockResolvedValue(mockVisitor);
      (prisma.leadPulseTouchpoint.create as jest.Mock).mockResolvedValue({});

      const request = createNextRequest('POST', 'http://localhost:3000/api/leadpulse/visitors', visitorData);
      const response = await POST(request);
      const responseData = await response.json();

      // Should still succeed even if cache fails
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.visitorId).toBe('visitor_cache_error');
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});