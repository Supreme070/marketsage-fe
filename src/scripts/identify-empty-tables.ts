#!/usr/bin/env tsx

/**
 * Identify the exact 10 empty tables so we can target them specifically
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 
  "postgresql://marketsage:marketsage_password@localhost:5432/marketsage?schema=public";

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } }
});

async function identifyEmptyTables() {
  console.log('🔍 IDENTIFYING THE 10 EMPTY TABLES TO TARGET\n');

  const emptyTables = [];

  // All tables from our previous check
  const allTables = [
    // Core entities
    { name: 'Organization', fn: () => prisma.organization.count() },
    { name: 'User', fn: () => prisma.user.count() },
    { name: 'Contact', fn: () => prisma.contact.count() },
    { name: 'List', fn: () => prisma.list.count() },
    { name: 'Segment', fn: () => prisma.segment.count() },
    
    // Communication
    { name: 'EmailTemplate', fn: () => prisma.emailTemplate.count() },
    { name: 'EmailCampaign', fn: () => prisma.emailCampaign.count() },
    { name: 'EmailActivity', fn: () => prisma.emailActivity.count() },
    { name: 'SMSTemplate', fn: () => prisma.sMSTemplate.count() },
    { name: 'SMSCampaign', fn: () => prisma.sMSCampaign.count() },
    { name: 'SMSActivity', fn: () => prisma.sMSActivity.count() },
    { name: 'SMSHistory', fn: () => prisma.sMSHistory.count() },
    { name: 'WhatsAppTemplate', fn: () => prisma.whatsAppTemplate.count() },
    { name: 'WhatsAppCampaign', fn: () => prisma.whatsAppCampaign.count() },
    { name: 'WhatsAppHistory', fn: () => prisma.whatsAppHistory.count() },
    
    // Integrations
    { name: 'EmailProvider', fn: () => prisma.emailProvider.count() },
    { name: 'SMSProvider', fn: () => prisma.sMSProvider.count() },
    { name: 'WhatsAppBusinessConfig', fn: () => prisma.whatsAppBusinessConfig.count() },
    { name: 'EmailDomainConfig', fn: () => prisma.emailDomainConfig.count() },
    { name: 'Integration', fn: () => prisma.integration.count() },
    { name: 'SocialMediaAccount', fn: () => prisma.socialMediaAccount.count() },
    
    // A/B Testing
    { name: 'ABTest', fn: () => prisma.aBTest.count() },
    { name: 'ABTestVariant', fn: () => prisma.aBTestVariant.count() },
    { name: 'ABTestResult', fn: () => prisma.aBTestResult.count() },
    { name: 'ConversionFunnel', fn: () => prisma.conversionFunnel.count() },
    { name: 'ConversionEvent', fn: () => prisma.conversionEvent.count() },
    
    // AI & Intelligence
    { name: 'CustomerProfile', fn: () => prisma.customerProfile.count() },
    { name: 'ChurnPrediction', fn: () => prisma.churnPrediction.count() },
    { name: 'BehavioralSegment', fn: () => prisma.behavioralSegment.count() },
    { name: 'ContentAnalysis', fn: () => prisma.contentAnalysis.count() },
    { name: 'SubjectLineTest', fn: () => prisma.subjectLineTest.count() },
    
    // Enterprise
    { name: 'SubscriptionPlan', fn: () => prisma.subscriptionPlan.count() },
    { name: 'Subscription', fn: () => prisma.subscription.count() },
    { name: 'PaymentMethod', fn: () => prisma.paymentMethod.count() },
    { name: 'AdminAuditLog', fn: () => prisma.adminAuditLog.count() },
    { name: 'MessagingUsage', fn: () => prisma.messagingUsage.count() },
    { name: 'CreditTransaction', fn: () => prisma.creditTransaction.count() },
    
    // User Management
    { name: 'UserPreference', fn: () => prisma.userPreference.count() },
    { name: 'UserActivity', fn: () => prisma.userActivity.count() },
    { name: 'Notification', fn: () => prisma.notification.count() },
    { name: 'Task', fn: () => prisma.task.count() },
    { name: 'TaskComment', fn: () => prisma.taskComment.count() },
    
    // LeadPulse
    { name: 'LeadPulseForm', fn: () => prisma.leadPulseForm.count() },
    { name: 'LeadPulseFormSubmission', fn: () => prisma.leadPulseFormSubmission.count() },
    
    // MCP
    { name: 'MCPCampaignMetrics', fn: () => prisma.mCPCampaignMetrics.count() },
    { name: 'MCPCustomerPredictions', fn: () => prisma.mCPCustomerPredictions.count() },
    { name: 'MCPVisitorSessions', fn: () => prisma.mCPVisitorSessions.count() },
    { name: 'MCPMonitoringMetrics', fn: () => prisma.mCPMonitoringMetrics.count() }
  ];

  console.log('🔍 Scanning all tables...\n');

  for (const table of allTables) {
    try {
      const count = await table.fn();
      if (count === 0) {
        emptyTables.push(table.name);
        console.log(`❌ ${table.name}: 0 records - NEEDS SEEDING`);
      }
    } catch (error) {
      emptyTables.push(table.name);
      console.log(`⚠️  ${table.name}: Error checking - NEEDS INVESTIGATION`);
    }
  }

  console.log('\n🎯 EMPTY TABLES TO TARGET:');
  console.log('='.repeat(50));
  emptyTables.forEach((table, index) => {
    console.log(`${index + 1}. ${table}`);
  });

  console.log(`\n📊 Total Empty Tables: ${emptyTables.length}`);
  console.log('🎯 These are our final targets for 100% coverage!');

  await prisma.$disconnect();
  return emptyTables;
}

identifyEmptyTables()
  .then(() => {
    console.log('\n✨ Empty table identification completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error identifying empty tables:', error);
    process.exit(1);
  });