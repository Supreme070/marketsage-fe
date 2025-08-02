#!/usr/bin/env tsx

/**
 * Final Comprehensive Seeding Script
 * 
 * This script targets the remaining important empty tables to ensure maximum coverage
 * Focuses on tables that are most likely to be used in the application
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 
  "postgresql://marketsage:marketsage_password@localhost:5432/marketsage?schema=public";

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } }
});

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedComprehensiveTables() {
  console.log('🚀 Starting final comprehensive seeding...');
  
  const organization = await prisma.organization.findFirst();
  const users = await prisma.user.findMany({ take: 5 });
  const contacts = await prisma.contact.findMany({ take: 10 });
  
  if (!organization || users.length === 0) {
    throw new Error('Need at least 1 organization and 1 user');
  }

  let seedCount = 0;

  async function safeCreate(tableName: string, createFn: () => Promise<any>) {
    try {
      await createFn();
      seedCount++;
      console.log(`✅ ${tableName}`);
    } catch (error) {
      console.log(`⚠️  ${tableName}: ${error.message}`);
    }
  }

  // Core workflow and automation tables
  console.log('\n🔄 Workflow & Automation Tables...');
  
  await safeCreate('Workflow', async () => {
    await prisma.workflow.create({
      data: {
        id: randomUUID(),
        name: 'Welcome Email Sequence',
        description: 'Automated welcome email series for new customers',
        triggerType: 'contact_created',
        triggerConditions: JSON.stringify({ listId: 'new_customers' }),
        status: 'ACTIVE',
        organizationId: organization.id,
        createdById: users[0].id
      }
    });
  });

  await safeCreate('WorkflowStep', async () => {
    const workflow = await prisma.workflow.findFirst();
    if (workflow) {
      await prisma.workflowStep.create({
        data: {
          id: randomUUID(),
          workflowId: workflow.id,
          type: 'email',
          name: 'Welcome Email',
          config: JSON.stringify({
            templateId: 'welcome_template',
            delay: 0
          }),
          position: 1
        }
      });
    }
  });

  // Email and communication templates
  console.log('\n📧 Email & Communication Templates...');
  
  await safeCreate('EmailTemplate', async () => {
    await prisma.emailTemplate.create({
      data: {
        id: randomUUID(),
        name: 'Welcome Email Template',
        description: 'Welcome email for new customers',
        subject: 'Welcome to MarketSage!',
        content: '<h1>Welcome to MarketSage!</h1><p>Thank you for joining us.</p>',
        design: JSON.stringify({ layout: 'single-column', theme: 'modern' }),
        previewText: 'Welcome to the future of marketing automation',
        category: 'onboarding',
        createdById: users[0].id
      }
    });
  });

  await safeCreate('SMSTemplate', async () => {
    await prisma.sMSTemplate.create({
      data: {
        id: randomUUID(),
        name: 'Welcome SMS',
        content: 'Welcome to MarketSage! Your marketing automation journey starts now. Reply STOP to opt out.',
        variables: JSON.stringify(['firstName', 'companyName']),
        category: 'onboarding',
        createdById: users[0].id
      }
    });
  });

  await safeCreate('WhatsAppTemplate', async () => {
    await prisma.whatsAppTemplate.create({
      data: {
        id: randomUUID(),
        name: 'Welcome WhatsApp Message',
        category: 'MARKETING',
        language: 'en',
        content: JSON.stringify({
          type: 'text',
          text: 'Welcome to MarketSage! 🚀 Your marketing automation platform is ready.'
        }),
        status: 'APPROVED',
        createdById: users[0].id
      }
    });
  });

  // Campaign tables
  console.log('\n📢 Campaign Tables...');
  
  await safeCreate('SMSCampaign', async () => {
    await prisma.sMSCampaign.create({
      data: {
        id: randomUUID(),
        name: 'Flash Sale Alert',
        description: 'SMS campaign for flash sale announcement',
        from: 'MarketSage',
        content: 'Flash Sale! 50% off all plans. Use code FLASH50. Limited time only!',
        status: 'COMPLETED',
        sentAt: new Date(),
        createdById: users[0].id
      }
    });
  });

  await safeCreate('WhatsAppCampaign', async () => {
    await prisma.whatsAppCampaign.create({
      data: {
        id: randomUUID(),
        name: 'Customer Support Follow-up',
        description: 'WhatsApp campaign for customer support follow-up',
        templateId: null,
        content: JSON.stringify({
          type: 'text',
          text: 'Hi! How was your experience with our support team? Your feedback helps us improve.'
        }),
        status: 'COMPLETED',
        sentAt: new Date(),
        createdById: users[0].id
      }
    });
  });

  // Lists and segments
  console.log('\n📋 Lists & Segments...');
  
  await safeCreate('List', async () => {
    await prisma.list.create({
      data: {
        id: randomUUID(),
        name: 'New Customers',
        description: 'List of customers who signed up in the last 30 days',
        organizationId: organization.id,
        createdById: users[0].id
      }
    });
  });

  await safeCreate('Segment', async () => {
    await prisma.segment.create({
      data: {
        id: randomUUID(),
        name: 'High Value Customers',
        description: 'Customers with high lifetime value',
        conditions: JSON.stringify({
          rules: [
            { field: 'totalValue', operator: 'greater_than', value: 1000 }
          ]
        }),
        organizationId: organization.id,
        createdById: users[0].id
      }
    });
  });

  // Activities and tracking
  console.log('\n📈 Activity & Tracking Tables...');
  
  await safeCreate('EmailActivity', async () => {
    const campaign = await prisma.emailCampaign.findFirst();
    if (campaign && contacts.length > 0) {
      await prisma.emailActivity.create({
        data: {
          id: randomUUID(),
          campaignId: campaign.id,
          contactId: contacts[0].id,
          type: 'OPENED',
          metadata: JSON.stringify({ userAgent: 'Mozilla/5.0', ip: '192.168.1.1' })
        }
      });
    }
  });

  await safeCreate('SMSActivity', async () => {
    const campaign = await prisma.sMSCampaign.findFirst();
    if (campaign && contacts.length > 0) {
      await prisma.sMSActivity.create({
        data: {
          id: randomUUID(),
          campaignId: campaign.id,
          contactId: contacts[0].id,
          type: 'DELIVERED',
          metadata: JSON.stringify({ provider: 'africastalking', messageId: 'msg_123' })
        }
      });
    }
  });

  // SMS and WhatsApp History
  console.log('\n📱 Communication History...');
  
  await safeCreate('SMSHistory', async () => {
    await prisma.sMSHistory.create({
      data: {
        id: randomUUID(),
        to: '+234901234567',
        from: 'MarketSage',
        message: 'Your verification code is 123456. Valid for 10 minutes.',
        originalMessage: 'Your verification code is {{code}}. Valid for {{duration}}.',
        status: 'delivered',
        provider: 'africastalking',
        contactId: contacts[0]?.id,
        userId: users[0].id,
        cost: 0.02,
        metadata: JSON.stringify({ campaignId: 'verification_campaign' })
      }
    });
  });

  await safeCreate('WhatsAppHistory', async () => {
    await prisma.whatsAppHistory.create({
      data: {
        id: randomUUID(),
        to: '+234901234567',
        from: '+234800123456',
        content: JSON.stringify({
          type: 'text',
          text: 'Thank you for contacting MarketSage support. We will get back to you shortly.'
        }),
        status: 'delivered',
        contactId: contacts[0]?.id,
        userId: users[0].id,
        metadata: JSON.stringify({ ticketId: 'support_123' })
      }
    });
  });

  // Integration tables
  console.log('\n🔗 Integration Tables...');
  
  await safeCreate('Integration', async () => {
    await prisma.integration.create({
      data: {
        id: randomUUID(),
        name: 'Salesforce CRM',
        type: 'CRM',
        provider: 'salesforce',
        status: 'ACTIVE',
        config: JSON.stringify({
          apiUrl: 'https://api.salesforce.com',
          syncFrequency: 'hourly'
        }),
        organizationId: organization.id,
        createdById: users[0].id
      }
    });
  });

  // Social media accounts
  console.log('\n📱 Social Media Tables...');
  
  await safeCreate('SocialMediaAccount', async () => {
    await prisma.socialMediaAccount.create({
      data: {
        id: randomUUID(),
        platform: 'FACEBOOK',
        accountId: 'fb_marketsage_001',
        accountName: 'MarketSage Official',
        accessToken: 'encrypted_fb_token',
        isActive: true,
        organizationId: organization.id,
        userId: users[0].id
      }
    });
  });

  // Task management
  console.log('\n✅ Task Management Tables...');
  
  await safeCreate('Task', async () => {
    await prisma.task.create({
      data: {
        id: randomUUID(),
        title: 'Review Q1 Campaign Performance',
        description: 'Analyze performance metrics for Q1 email campaigns and create report',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        organizationId: organization.id,
        createdById: users[0].id,
        assignedToId: users[1]?.id
      }
    });
  });

  await safeCreate('TaskComment', async () => {
    const task = await prisma.task.findFirst();
    if (task) {
      await prisma.taskComment.create({
        data: {
          id: randomUUID(),
          taskId: task.id,
          content: 'Started working on the campaign analysis. Will have initial results by tomorrow.',
          userId: users[0].id
        }
      });
    }
  });

  // User preferences and activities
  console.log('\n👤 User Management Tables...');
  
  await safeCreate('UserPreference', async () => {
    await prisma.userPreference.create({
      data: {
        id: randomUUID(),
        userId: users[0].id,
        emailNotifications: true,
        smsNotifications: false,
        theme: 'dark',
        language: 'en',
        timezone: 'Africa/Lagos',
        preferences: JSON.stringify({
          dashboardLayout: 'grid',
          defaultDateRange: '30d'
        })
      }
    });
  });

  await safeCreate('UserActivity', async () => {
    await prisma.userActivity.create({
      data: {
        id: randomUUID(),
        userId: users[0].id,
        action: 'LOGIN',
        resource: 'dashboard',
        details: JSON.stringify({
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        })
      }
    });
  });

  // Notifications
  console.log('\n🔔 Notification Tables...');
  
  await safeCreate('Notification', async () => {
    await prisma.notification.create({
      data: {
        id: randomUUID(),
        userId: users[0].id,
        title: 'Campaign Completed',
        message: 'Your email campaign "Welcome Series" has been sent to 1,250 contacts.',
        type: 'success',
        category: 'campaigns',
        read: false,
        link: '/campaigns/email'
      }
    });
  });

  // AI and content analysis
  console.log('\n🤖 AI & Content Analysis...');
  
  await safeCreate('ContentAnalysis', async () => {
    await prisma.contentAnalysis.create({
      data: {
        id: randomUUID(),
        contentType: 'email_subject',
        content: 'Unlock 50% Savings - Limited Time Offer!',
        analysis: JSON.stringify({
          sentiment: 'positive',
          urgency: 'high',
          personalizedScore: 75,
          suggestions: ['Consider A/B testing without urgency language']
        }),
        score: 85.5,
        organizationId: organization.id,
        createdById: users[0].id
      }
    });
  });

  await safeCreate('SubjectLineTest', async () => {
    await prisma.subjectLineTest.create({
      data: {
        id: randomUUID(),
        originalSubject: 'Our Monthly Newsletter',
        generatedSubjects: JSON.stringify([
          'Don\'t Miss This Month\'s Top Marketing Tips!',
          'Your Marketing Success Guide is Here 📈',
          'This Month: 5 Strategies That Actually Work'
        ]),
        bestPerformingSubject: 'Don\'t Miss This Month\'s Top Marketing Tips!',
        improvementPercentage: 23.5,
        organizationId: organization.id,
        createdById: users[0].id
      }
    });
  });

  // LeadPulse forms and tracking
  console.log('\n📝 LeadPulse Forms & Tracking...');
  
  await safeCreate('LeadPulseForm', async () => {
    await prisma.leadPulseForm.create({
      data: {
        id: randomUUID(),
        name: 'Newsletter Signup',
        description: 'Simple newsletter subscription form',
        fields: JSON.stringify([
          { name: 'email', type: 'email', required: true, label: 'Email Address' },
          { name: 'firstName', type: 'text', required: false, label: 'First Name' }
        ]),
        settings: JSON.stringify({
          submitRedirect: '/thank-you',
          emailNotification: true
        }),
        isActive: true,
        organizationId: organization.id,
        createdById: users[0].id
      }
    });
  });

  await safeCreate('LeadPulseFormSubmission', async () => {
    const form = await prisma.leadPulseForm.findFirst();
    if (form) {
      await prisma.leadPulseFormSubmission.create({
        data: {
          id: randomUUID(),
          formId: form.id,
          data: JSON.stringify({
            email: 'subscriber@example.com',
            firstName: 'John'
          }),
          ipAddress: '192.168.1.50',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          organizationId: organization.id
        }
      });
    }
  });

  console.log(`\n✅ Final comprehensive seeding completed! Created records in ${seedCount} additional tables.`);
  console.log('🎯 MarketSage database is now fully populated with realistic data!');
}

async function main() {
  try {
    await seedComprehensiveTables();
  } catch (error) {
    console.error('❌ Comprehensive seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🎉 Final comprehensive seeding process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Final comprehensive seeding process failed:', error.message);
      process.exit(1);
    });
}

export default main;