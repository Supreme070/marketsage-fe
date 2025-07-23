import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

/**
 * Database seeder for E2E tests
 * Creates realistic test data for comprehensive testing
 */

export class DatabaseSeeder {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async seedAll() {
    console.log('🌱 Seeding database for E2E tests...');

    try {
      // Clear existing data
      await this.clearDatabase();
      
      // Seed in order due to foreign key constraints
      const user = await this.seedUser();
      await this.seedContacts(user.id);
      await this.seedCampaigns(user.id);
      await this.seedWorkflows(user.id);
      await this.seedVisitorData();
      await this.seedMCPData();
      
      console.log('✅ Database seeding completed');
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private async clearDatabase() {
    console.log('🧹 Clearing existing test data...');
    
    // Clear in reverse dependency order
    await this.prisma.mcpMonitoringMetric.deleteMany({});
    await this.prisma.mcpVisitorSession.deleteMany({});
    await this.prisma.mcpCustomerPrediction.deleteMany({});
    await this.prisma.mcpCampaignAnalytic.deleteMany({});
    await this.prisma.workflowExecution.deleteMany({});
    await this.prisma.workflowNode.deleteMany({});
    await this.prisma.workflow.deleteMany({});
    await this.prisma.campaignAnalytics.deleteMany({});
    await this.prisma.campaign.deleteMany({});
    await this.prisma.contactSegment.deleteMany({});
    await this.prisma.segment.deleteMany({});
    await this.prisma.contact.deleteMany({});
    // Don't delete user as it's needed for authentication
  }

  private async seedUser() {
    console.log('👤 Seeding test user...');
    
    const user = await this.prisma.user.findUnique({
      where: { email: 'test@marketsage.com' }
    });

    if (!user) {
      throw new Error('Test user not found. Run auth setup first.');
    }

    return user;
  }

  private async seedContacts(userId: string) {
    console.log('📇 Seeding contacts...');
    
    const contacts = [];
    
    // Create diverse contact profiles
    for (let i = 0; i < 50; i++) {
      const contact = await this.prisma.contact.create({
        data: {
          email: faker.internet.email(),
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          phone: faker.phone.number(),
          company: faker.company.name(),
          jobTitle: faker.person.jobTitle(),
          country: faker.location.country(),
          city: faker.location.city(),
          leadScore: faker.number.int({ min: 0, max: 100 }),
          totalPurchases: faker.number.float({ min: 0, max: 10000, fractionDigits: 2 }),
          lastActivity: faker.date.recent({ days: 30 }),
          source: faker.helpers.arrayElement(['Website', 'Social Media', 'Email', 'Referral']),
          status: faker.helpers.arrayElement(['ACTIVE', 'INACTIVE', 'UNSUBSCRIBED']),
          userId: userId,
          tags: faker.helpers.arrayElements(['VIP', 'High Value', 'New Lead', 'Engaged'], { min: 0, max: 3 }),
          customFields: {
            industry: faker.company.buzzNoun(),
            website: faker.internet.url(),
            employees: faker.number.int({ min: 1, max: 1000 })
          }
        }
      });
      contacts.push(contact);
    }

    // Create segments
    await this.seedSegments(userId, contacts);
    
    return contacts;
  }

  private async seedSegments(userId: string, contacts: any[]) {
    console.log('🎯 Seeding segments...');
    
    const segments = [
      {
        name: 'High-Value Customers',
        description: 'Customers with high purchase value',
        criteria: { totalPurchases: { gte: 1000 } }
      },
      {
        name: 'Recent Signups',
        description: 'Contacts added in the last 30 days',
        criteria: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
      },
      {
        name: 'Nigerian Customers',
        description: 'Customers based in Nigeria',
        criteria: { country: 'Nigeria' }
      }
    ];

    for (const segmentData of segments) {
      const segment = await this.prisma.segment.create({
        data: {
          ...segmentData,
          userId: userId,
          contactCount: faker.number.int({ min: 5, max: 20 })
        }
      });

      // Assign random contacts to segment
      const randomContacts = faker.helpers.arrayElements(contacts, { min: 5, max: 15 });
      for (const contact of randomContacts) {
        await this.prisma.contactSegment.create({
          data: {
            contactId: contact.id,
            segmentId: segment.id
          }
        });
      }
    }
  }

  private async seedCampaigns(userId: string) {
    console.log('📧 Seeding campaigns...');
    
    const campaignTypes = ['EMAIL', 'SMS', 'WHATSAPP'];
    const campaigns = [];

    for (let i = 0; i < 15; i++) {
      const type = faker.helpers.arrayElement(campaignTypes);
      const campaign = await this.prisma.campaign.create({
        data: {
          name: faker.company.catchPhrase(),
          type: type,
          subject: type === 'EMAIL' ? faker.lorem.sentence() : undefined,
          content: faker.lorem.paragraphs(3),
          status: faker.helpers.arrayElement(['DRAFT', 'SCHEDULED', 'SENT', 'COMPLETED']),
          scheduledAt: faker.date.future(),
          userId: userId,
          settings: {
            trackOpens: true,
            trackClicks: true,
            timezone: 'UTC'
          }
        }
      });

      // Create analytics for completed campaigns
      if (campaign.status === 'COMPLETED') {
        await this.prisma.campaignAnalytics.create({
          data: {
            campaignId: campaign.id,
            sent: faker.number.int({ min: 100, max: 1000 }),
            delivered: faker.number.int({ min: 90, max: 950 }),
            opened: faker.number.int({ min: 20, max: 400 }),
            clicked: faker.number.int({ min: 5, max: 100 }),
            bounced: faker.number.int({ min: 0, max: 20 }),
            unsubscribed: faker.number.int({ min: 0, max: 5 }),
            revenue: faker.number.float({ min: 0, max: 5000, fractionDigits: 2 })
          }
        });
      }

      campaigns.push(campaign);
    }

    return campaigns;
  }

  private async seedWorkflows(userId: string) {
    console.log('⚙️ Seeding workflows...');
    
    const workflows = [];

    for (let i = 0; i < 10; i++) {
      const workflow = await this.prisma.workflow.create({
        data: {
          name: faker.hacker.phrase(),
          description: faker.lorem.paragraph(),
          isActive: faker.datatype.boolean(),
          userId: userId,
          trigger: {
            type: faker.helpers.arrayElement(['CONTACT_CREATED', 'FORM_SUBMITTED', 'EMAIL_OPENED']),
            conditions: {}
          }
        }
      });

      // Create workflow nodes
      const nodeCount = faker.number.int({ min: 3, max: 8 });
      for (let j = 0; j < nodeCount; j++) {
        await this.prisma.workflowNode.create({
          data: {
            workflowId: workflow.id,
            type: faker.helpers.arrayElement(['EMAIL', 'SMS', 'DELAY', 'CONDITION']),
            position: { x: j * 200, y: 100 },
            config: {
              delay: faker.number.int({ min: 1, max: 24 }),
              template: faker.lorem.sentence()
            }
          }
        });
      }

      // Create execution records
      const executionCount = faker.number.int({ min: 0, max: 50 });
      for (let k = 0; k < executionCount; k++) {
        await this.prisma.workflowExecution.create({
          data: {
            workflowId: workflow.id,
            status: faker.helpers.arrayElement(['COMPLETED', 'FAILED', 'RUNNING']),
            startedAt: faker.date.recent({ days: 30 }),
            completedAt: faker.date.recent({ days: 25 }),
            executionData: {
              steps: faker.number.int({ min: 1, max: 5 }),
              success: faker.datatype.boolean()
            }
          }
        });
      }

      workflows.push(workflow);
    }

    return workflows;
  }

  private async seedVisitorData() {
    console.log('👥 Seeding visitor data...');
    
    // Create visitor sessions for LeadPulse
    for (let i = 0; i < 100; i++) {
      const sessionStart = faker.date.recent({ days: 7 });
      const sessionEnd = new Date(sessionStart.getTime() + faker.number.int({ min: 30000, max: 1800000 }));

      await this.prisma.visitorSession.create({
        data: {
          sessionId: faker.string.uuid(),
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
          country: faker.location.country(),
          city: faker.location.city(),
          device: faker.helpers.arrayElement(['Desktop', 'Mobile', 'Tablet']),
          browser: faker.helpers.arrayElement(['Chrome', 'Firefox', 'Safari', 'Edge']),
          source: faker.helpers.arrayElement(['Google', 'Direct', 'Social', 'Email']),
          landingPage: faker.internet.url(),
          pageViews: faker.number.int({ min: 1, max: 10 }),
          duration: Math.floor((sessionEnd.getTime() - sessionStart.getTime()) / 1000),
          startTime: sessionStart,
          endTime: sessionEnd,
          isActive: faker.datatype.boolean(0.2), // 20% active sessions
          events: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
            type: faker.helpers.arrayElement(['page_view', 'click', 'form_submit', 'download']),
            timestamp: faker.date.between({ from: sessionStart, to: sessionEnd }),
            data: { element: faker.lorem.word() }
          }))
        }
      });
    }
  }

  private async seedMCPData() {
    console.log('🔗 Seeding MCP test data...');
    
    // MCP Campaign Analytics
    for (let i = 0; i < 25; i++) {
      await this.prisma.mcpCampaignAnalytic.create({
        data: {
          campaignId: faker.string.uuid(),
          campaignName: faker.company.catchPhrase(),
          channel: faker.helpers.arrayElement(['email', 'sms', 'whatsapp']),
          sent: faker.number.int({ min: 100, max: 5000 }),
          delivered: faker.number.int({ min: 90, max: 4500 }),
          opened: faker.number.int({ min: 20, max: 2000 }),
          clicked: faker.number.int({ min: 5, max: 500 }),
          conversions: faker.number.int({ min: 1, max: 100 }),
          revenue: faker.number.float({ min: 100, max: 10000, fractionDigits: 2 }),
          timestamp: faker.date.recent({ days: 30 })
        }
      });
    }

    // MCP Customer Predictions
    for (let i = 0; i < 30; i++) {
      await this.prisma.mcpCustomerPrediction.create({
        data: {
          customerId: faker.string.uuid(),
          customerEmail: faker.internet.email(),
          churnProbability: faker.number.float({ min: 0, max: 1, fractionDigits: 3 }),
          lifetimeValue: faker.number.float({ min: 100, max: 5000, fractionDigits: 2 }),
          nextPurchaseDate: faker.date.future(),
          recommendedActions: faker.helpers.arrayElements([
            'send_discount',
            'premium_upgrade',
            'retention_campaign',
            'personalized_content'
          ], { min: 1, max: 3 }),
          confidence: faker.number.float({ min: 0.5, max: 1, fractionDigits: 3 }),
          lastUpdated: faker.date.recent({ days: 1 })
        }
      });
    }

    // MCP Visitor Sessions
    for (let i = 0; i < 75; i++) {
      await this.prisma.mcpVisitorSession.create({
        data: {
          sessionId: faker.string.uuid(),
          visitorId: faker.string.uuid(),
          pageViews: faker.number.int({ min: 1, max: 15 }),
          duration: faker.number.int({ min: 30, max: 3600 }),
          bounceRate: faker.number.float({ min: 0, max: 1, fractionDigits: 3 }),
          conversionEvents: faker.number.int({ min: 0, max: 5 }),
          source: faker.helpers.arrayElement(['organic', 'paid', 'social', 'direct', 'email']),
          device: faker.helpers.arrayElement(['desktop', 'mobile', 'tablet']),
          location: {
            country: faker.location.country(),
            city: faker.location.city(),
            coordinates: {
              lat: faker.location.latitude(),
              lng: faker.location.longitude()
            }
          },
          timestamp: faker.date.recent({ days: 7 })
        }
      });
    }

    // MCP Monitoring Metrics
    for (let i = 0; i < 50; i++) {
      await this.prisma.mcpMonitoringMetric.create({
        data: {
          metricName: faker.helpers.arrayElement([
            'api_response_time',
            'database_connections',
            'memory_usage',
            'cpu_utilization',
            'error_rate'
          ]),
          value: faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
          unit: faker.helpers.arrayElement(['ms', '%', 'MB', 'count']),
          tags: {
            service: faker.helpers.arrayElement(['api', 'database', 'cache', 'queue']),
            environment: 'test'
          },
          timestamp: faker.date.recent({ days: 1 })
        }
      });
    }
  }

  async cleanup() {
    await this.clearDatabase();
    await this.prisma.$disconnect();
  }
}

// Export for use in tests
export const databaseSeeder = new DatabaseSeeder();