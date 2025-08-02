#!/usr/bin/env tsx

/**
 * Final Table Summary - Check all our seeding progress
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 
  "postgresql://marketsage:marketsage_password@localhost:5432/marketsage?schema=public";

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } }
});

async function checkAllTables() {
  console.log('🎯 FINAL MARKETSAGE DATABASE SEEDING SUMMARY\n');
  console.log('='.repeat(60));

  let totalSeeded = 0;
  let totalEmpty = 0;

  // Core entities
  console.log('\n📊 CORE BUSINESS ENTITIES:');
  const coreEntities = [
    { name: 'Organization', fn: () => prisma.organization.count() },
    { name: 'User', fn: () => prisma.user.count() },
    { name: 'Contact', fn: () => prisma.contact.count() },
    { name: 'List', fn: () => prisma.list.count() },
    { name: 'Segment', fn: () => prisma.segment.count() }
  ];

  for (const entity of coreEntities) {
    try {
      const count = await entity.fn();
      console.log(`${count > 0 ? '✅' : '❌'} ${entity.name}: ${count} records`);
      if (count > 0) totalSeeded++; else totalEmpty++;
    } catch (error) {
      console.log(`⚠️  ${entity.name}: Error`);
      totalEmpty++;
    }
  }

  // Communication & Campaigns  
  console.log('\n📧 COMMUNICATION & CAMPAIGNS:');
  const campaignTables = [
    { name: 'EmailTemplate', fn: () => prisma.emailTemplate.count() },
    { name: 'EmailCampaign', fn: () => prisma.emailCampaign.count() },
    { name: 'EmailActivity', fn: () => prisma.emailActivity.count() },
    { name: 'SMSTemplate', fn: () => prisma.sMSTemplate.count() },
    { name: 'SMSCampaign', fn: () => prisma.sMSCampaign.count() },
    { name: 'SMSActivity', fn: () => prisma.sMSActivity.count() },
    { name: 'SMSHistory', fn: () => prisma.sMSHistory.count() },
    { name: 'WhatsAppTemplate', fn: () => prisma.whatsAppTemplate.count() },
    { name: 'WhatsAppCampaign', fn: () => prisma.whatsAppCampaign.count() },
    { name: 'WhatsAppHistory', fn: () => prisma.whatsAppHistory.count() }
  ];

  for (const table of campaignTables) {
    try {
      const count = await table.fn();
      console.log(`${count > 0 ? '✅' : '❌'} ${table.name}: ${count} records`);
      if (count > 0) totalSeeded++; else totalEmpty++;
    } catch (error) {
      console.log(`⚠️  ${table.name}: Error`);
      totalEmpty++;
    }
  }

  // Integration & Providers
  console.log('\n🔗 INTEGRATIONS & PROVIDERS:');
  const integrationTables = [
    { name: 'EmailProvider', fn: () => prisma.emailProvider.count() },
    { name: 'SMSProvider', fn: () => prisma.sMSProvider.count() },
    { name: 'WhatsAppBusinessConfig', fn: () => prisma.whatsAppBusinessConfig.count() },
    { name: 'EmailDomainConfig', fn: () => prisma.emailDomainConfig.count() },
    { name: 'Integration', fn: () => prisma.integration.count() },
    { name: 'SocialMediaAccount', fn: () => prisma.socialMediaAccount.count() }
  ];

  for (const table of integrationTables) {
    try {
      const count = await table.fn();
      console.log(`${count > 0 ? '✅' : '❌'} ${table.name}: ${count} records`);
      if (count > 0) totalSeeded++; else totalEmpty++;
    } catch (error) {
      console.log(`⚠️  ${table.name}: Error`);
      totalEmpty++;
    }
  }

  // A/B Testing
  console.log('\n🧪 A/B TESTING & ANALYTICS:');
  const abTestTables = [
    { name: 'ABTest', fn: () => prisma.aBTest.count() },
    { name: 'ABTestVariant', fn: () => prisma.aBTestVariant.count() },
    { name: 'ABTestResult', fn: () => prisma.aBTestResult.count() },
    { name: 'ConversionFunnel', fn: () => prisma.conversionFunnel.count() },
    { name: 'ConversionEvent', fn: () => prisma.conversionEvent.count() }
  ];

  for (const table of abTestTables) {
    try {
      const count = await table.fn();
      console.log(`${count > 0 ? '✅' : '❌'} ${table.name}: ${count} records`);
      if (count > 0) totalSeeded++; else totalEmpty++;
    } catch (error) {
      console.log(`⚠️  ${table.name}: Error`);
      totalEmpty++;
    }
  }

  // AI & Customer Intelligence
  console.log('\n🤖 AI & CUSTOMER INTELLIGENCE:');
  const aiTables = [
    { name: 'CustomerProfile', fn: () => prisma.customerProfile.count() },
    { name: 'ChurnPrediction', fn: () => prisma.churnPrediction.count() },
    { name: 'BehavioralSegment', fn: () => prisma.behavioralSegment.count() },
    { name: 'ContentAnalysis', fn: () => prisma.contentAnalysis.count() },
    { name: 'SubjectLineTest', fn: () => prisma.subjectLineTest.count() }
  ];

  for (const table of aiTables) {
    try {
      const count = await table.fn();
      console.log(`${count > 0 ? '✅' : '❌'} ${table.name}: ${count} records`);
      if (count > 0) totalSeeded++; else totalEmpty++;
    } catch (error) {
      console.log(`⚠️  ${table.name}: Error`);
      totalEmpty++;
    }
  }

  // Enterprise Features
  console.log('\n🏢 ENTERPRISE FEATURES:');
  const enterpriseTables = [
    { name: 'SubscriptionPlan', fn: () => prisma.subscriptionPlan.count() },
    { name: 'Subscription', fn: () => prisma.subscription.count() },
    { name: 'PaymentMethod', fn: () => prisma.paymentMethod.count() },
    { name: 'AdminAuditLog', fn: () => prisma.adminAuditLog.count() },
    { name: 'MessagingUsage', fn: () => prisma.messagingUsage.count() },
    { name: 'CreditTransaction', fn: () => prisma.creditTransaction.count() }
  ];

  for (const table of enterpriseTables) {
    try {
      const count = await table.fn();
      console.log(`${count > 0 ? '✅' : '❌'} ${table.name}: ${count} records`);
      if (count > 0) totalSeeded++; else totalEmpty++;
    } catch (error) {
      console.log(`⚠️  ${table.name}: Error`);
      totalEmpty++;
    }
  }

  // User Management
  console.log('\n👤 USER MANAGEMENT:');
  const userTables = [
    { name: 'UserPreference', fn: () => prisma.userPreference.count() },
    { name: 'UserActivity', fn: () => prisma.userActivity.count() },
    { name: 'Notification', fn: () => prisma.notification.count() },
    { name: 'Task', fn: () => prisma.task.count() },
    { name: 'TaskComment', fn: () => prisma.taskComment.count() }
  ];

  for (const table of userTables) {
    try {
      const count = await table.fn();
      console.log(`${count > 0 ? '✅' : '❌'} ${table.name}: ${count} records`);
      if (count > 0) totalSeeded++; else totalEmpty++;
    } catch (error) {
      console.log(`⚠️  ${table.name}: Error`);
      totalEmpty++;
    }
  }

  // LeadPulse Features
  console.log('\n📝 LEADPULSE FEATURES:');
  const leadpulseTables = [
    { name: 'LeadPulseForm', fn: () => prisma.leadPulseForm.count() },
    { name: 'LeadPulseFormSubmission', fn: () => prisma.leadPulseFormSubmission.count() }
  ];

  for (const table of leadpulseTables) {
    try {
      const count = await table.fn();
      console.log(`${count > 0 ? '✅' : '❌'} ${table.name}: ${count} records`);
      if (count > 0) totalSeeded++; else totalEmpty++;
    } catch (error) {
      console.log(`⚠️  ${table.name}: Error`);
      totalEmpty++;
    }
  }

  // MCP (Model Context Protocol) Tables
  console.log('\n🤖 MCP INTELLIGENCE SERVERS:');
  const mcpTables = [
    { name: 'MCPCampaignMetrics', fn: () => prisma.mCPCampaignMetrics.count() },
    { name: 'MCPCustomerPredictions', fn: () => prisma.mCPCustomerPredictions.count() },
    { name: 'MCPVisitorSessions', fn: () => prisma.mCPVisitorSessions.count() },
    { name: 'MCPMonitoringMetrics', fn: () => prisma.mCPMonitoringMetrics.count() }
  ];

  for (const table of mcpTables) {
    try {
      const count = await table.fn();
      console.log(`${count > 0 ? '✅' : '❌'} ${table.name}: ${count} records`);
      if (count > 0) totalSeeded++; else totalEmpty++;
    } catch (error) {
      console.log(`⚠️  ${table.name}: Error`);
      totalEmpty++;
    }
  }

  // Final Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL SEEDING SUMMARY:');
  console.log('='.repeat(60));
  console.log(`✅ Successfully Seeded Tables: ${totalSeeded}`);
  console.log(`❌ Empty Tables Remaining: ${totalEmpty}`);
  console.log(`📈 Success Rate: ${Math.round((totalSeeded / (totalSeeded + totalEmpty)) * 100)}%`);
  
  if (totalSeeded >= 30) {
    console.log('\n🎉 EXCELLENT! MarketSage database is comprehensively seeded!');
    console.log('🚀 All critical business functions now have realistic test data.');
    console.log('💼 Ready for development, testing, and demonstration!');
  } else if (totalSeeded >= 20) {
    console.log('\n✅ GOOD! Major features are seeded with data.');
    console.log('🔧 Core functionality is ready for testing.');
  } else {
    console.log('\n⚠️  More seeding needed for comprehensive coverage.');
  }

  console.log('\n🎯 MarketSage is ready for African market domination! 🌍');

  await prisma.$disconnect();
}

checkAllTables()
  .then(() => {
    console.log('\n✨ Database seeding analysis completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error analyzing database:', error);
    process.exit(1);
  });