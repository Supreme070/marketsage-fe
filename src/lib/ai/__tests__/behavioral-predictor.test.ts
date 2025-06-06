// Mock Prisma before imports
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: { findUnique: jest.fn() },
    emailActivity: { findMany: jest.fn() },
    sMSActivity: { findMany: jest.fn() },
    whatsAppActivity: { findMany: jest.fn() }
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
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
  };
});

import { BehavioralPredictor } from '../behavioral-predictor';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';

describe('BehavioralPredictor', () => {
  let predictor: BehavioralPredictor;
  let prisma: any;

  beforeEach(() => {
    prisma = (PrismaClient as jest.Mock)();
    predictor = new BehavioralPredictor();
  });

  describe('predictBehavior', () => {
    it('should predict user behavior correctly', async () => {
      // Mock user data
      const mockUser = {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        emailVerified: null,
        password: null,
        image: null,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        lastLogin: null,
        isActive: true,
        role: 'USER' as const,
        organizationId: null,
        company: null,
        EmailCampaign: [
          {
            id: 'ec1',
            status: 'SENT',
            sentAt: new Date('2023-06-01'),
            metadata: JSON.stringify({ revenue: 100 })
          }
        ],
        SMSCampaign: [
          {
            id: 'sc1',
            status: 'SENT',
            sentAt: new Date('2023-07-01'),
            metadata: JSON.stringify({ revenue: 50 })
          }
        ],
        WhatsAppCampaign: [
          {
            id: 'wc1',
            status: 'SENT',
            sentAt: new Date('2023-08-01'),
            metadata: JSON.stringify({ revenue: 75 })
          }
        ],
        Contact: [],
        List: [],
        Segment: []
      };

      // Mock activities
      const mockEmailActivities = [
        {
          id: 'ea1',
          campaignId: 'ec1',
          contactId: 'contact1',
          type: 'OPENED' as const,
          timestamp: new Date('2023-08-15'),
          metadata: null
        },
        {
          id: 'ea2',
          campaignId: 'ec1',
          contactId: 'contact1',
          type: 'CLICKED' as const,
          timestamp: new Date('2023-08-14'),
          metadata: null
        }
      ];

      const mockSMSActivities = [
        {
          id: 'sa1',
          campaignId: 'sc1',
          contactId: 'contact1',
          type: 'DELIVERED' as const,
          timestamp: new Date('2023-08-13'),
          metadata: null
        }
      ];

      const mockWAActivities = [
        {
          id: 'wa1',
          campaignId: 'wc1',
          contactId: 'contact1',
          type: 'SENT' as const,
          timestamp: new Date('2023-08-12'),
          metadata: null
        }
      ];

      // Setup mock responses
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.emailActivity.findMany.mockResolvedValue(mockEmailActivities);
      prisma.sMSActivity.findMany.mockResolvedValue(mockSMSActivities);
      prisma.whatsAppActivity.findMany.mockResolvedValue(mockWAActivities);

      // Make prediction
      const prediction = await predictor.predictBehavior('test-user-id');

      // Verify predictions
      expect(prediction).toHaveProperty('predictions');
      expect(prediction.predictions).toHaveProperty('nextBestAction');
      expect(prediction.predictions).toHaveProperty('churnRisk');
      expect(prediction.predictions).toHaveProperty('lifetimeValue');
      expect(prediction.predictions).toHaveProperty('engagementScore');

      // Verify segments
      expect(prediction.segments).toContain('MULTI_CHANNEL');
      expect(prediction.segments).toContain('EMAIL_USER');
      expect(prediction.segments).toContain('SMS_USER');
      expect(prediction.segments).toContain('WHATSAPP_USER');

      // Verify confidence scores
      expect(prediction.confidenceScores).toHaveProperty('nextBestAction');
      expect(prediction.confidenceScores).toHaveProperty('churnRisk');
      expect(prediction.confidenceScores).toHaveProperty('lifetimeValue');
      expect(prediction.confidenceScores).toHaveProperty('engagementScore');

      // Verify insights
      expect(prediction.insights).toBeInstanceOf(Array);
      expect(prediction.insights.length).toBeGreaterThan(0);
    });

    it('should handle user not found', async () => {
      // Setup mock
      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(predictor.predictBehavior('non-existent-user'))
        .rejects
        .toThrow('User not found');
    });

    it('should handle empty activities', async () => {
      // Setup mock user with no activities
      const mockUser = {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        emailVerified: null,
        password: null,
        image: null,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        lastLogin: null,
        isActive: true,
        role: 'USER' as const,
        organizationId: null,
        company: null,
        EmailCampaign: [],
        SMSCampaign: [],
        WhatsAppCampaign: [],
        Contact: [],
        List: [],
        Segment: []
      };

      // Setup mocks
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.emailActivity.findMany.mockResolvedValue([]);
      prisma.sMSActivity.findMany.mockResolvedValue([]);
      prisma.whatsAppActivity.findMany.mockResolvedValue([]);

      // Act
      const prediction = await predictor.predictBehavior('test-user-id');

      // Assert
      expect(prediction.predictions.engagementScore).toBe(0);
      expect(prediction.segments).toContain('LOW_VALUE');
      expect(prediction.insights).toContain('Low engagement - consider re-engagement campaign');
    });

    it('should handle database errors', async () => {
      // Setup mock to throw error
      const dbError = new Error('Database connection failed');
      prisma.user.findUnique.mockRejectedValue(dbError);

      // Act & Assert
      await expect(predictor.predictBehavior('test-user-id'))
        .rejects
        .toThrow('Database connection failed');
    });
  });
}); 