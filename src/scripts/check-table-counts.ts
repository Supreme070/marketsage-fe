#!/usr/bin/env tsx

/**
 * Quick table count checker to see which tables are still empty
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 
  "postgresql://marketsage:marketsage_password@localhost:5432/marketsage?schema=public";

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } }
});

async function checkTableCounts() {
  console.log('📊 Checking table counts after seeding...\n');

  try {
    // Integration tables
    const emailProviders = await prisma.emailProvider.count();
    const smsProviders = await prisma.sMSProvider.count();
    const whatsappConfigs = await prisma.whatsAppBusinessConfig.count();
    const emailDomains = await prisma.emailDomainConfig.count();
    
    console.log(`${emailProviders > 0 ? '✅' : '❌'} EmailProvider: ${emailProviders} records`);
    console.log(`${smsProviders > 0 ? '✅' : '❌'} SMSProvider: ${smsProviders} records`);
    console.log(`${whatsappConfigs > 0 ? '✅' : '❌'} WhatsAppBusinessConfig: ${whatsappConfigs} records`);
    console.log(`${emailDomains > 0 ? '✅' : '❌'} EmailDomainConfig: ${emailDomains} records`);

    // Enterprise tables
    console.log('\n🏢 Enterprise Tables:');
    const subscriptionPlans = await prisma.subscriptionPlan.count();
    const subscriptions = await prisma.subscription.count();
    const paymentMethods = await prisma.paymentMethod.count();
    
    console.log(`${subscriptionPlans > 0 ? '✅' : '❌'} SubscriptionPlan: ${subscriptionPlans} records`);
    console.log(`${subscriptions > 0 ? '✅' : '❌'} Subscription: ${subscriptions} records`);
    console.log(`${paymentMethods > 0 ? '✅' : '❌'} PaymentMethod: ${paymentMethods} records`);

    // A/B Testing tables
    console.log('\n🧪 A/B Testing Tables:');
    const abTests = await prisma.aBTest.count();
    const abVariants = await prisma.aBTestVariant.count();
    const abResults = await prisma.aBTestResult.count();
    
    console.log(`${abTests > 0 ? '✅' : '❌'} ABTest: ${abTests} records`);
    console.log(`${abVariants > 0 ? '✅' : '❌'} ABTestVariant: ${abVariants} records`);
    console.log(`${abResults > 0 ? '✅' : '❌'} ABTestResult: ${abResults} records`);

    // AI & Customer Intelligence
    console.log('\n🤖 AI & Customer Intelligence:');
    const customerProfiles = await prisma.customerProfile.count();
    const churnPredictions = await prisma.churnPrediction.count();
    const behavioralSegments = await prisma.behavioralSegment.count();
    
    console.log(`${customerProfiles > 0 ? '✅' : '❌'} CustomerProfile: ${customerProfiles} records`);
    console.log(`${churnPredictions > 0 ? '✅' : '❌'} ChurnPrediction: ${churnPredictions} records`);
    console.log(`${behavioralSegments > 0 ? '✅' : '❌'} BehavioralSegment: ${behavioralSegments} records`);

    // Analytics
    console.log('\n📊 Analytics Tables:');
    const conversionFunnels = await prisma.conversionFunnel.count();
    const conversionEvents = await prisma.conversionEvent.count();
    
    console.log(`${conversionFunnels > 0 ? '✅' : '❌'} ConversionFunnel: ${conversionFunnels} records`);
    console.log(`${conversionEvents > 0 ? '✅' : '❌'} ConversionEvent: ${conversionEvents} records`);

    // Admin & Security
    console.log('\n🔒 Admin & Security:');
    const adminAuditLogs = await prisma.adminAuditLog.count();
    
    console.log(`${adminAuditLogs > 0 ? '✅' : '❌'} AdminAuditLog: ${adminAuditLogs} records`);

    // Messaging
    console.log('\n💬 Messaging:');
    const messagingUsage = await prisma.messagingUsage.count();
    const creditTransactions = await prisma.creditTransaction.count();
    
    console.log(`${messagingUsage > 0 ? '✅' : '❌'} MessagingUsage: ${messagingUsage} records`);
    console.log(`${creditTransactions > 0 ? '✅' : '❌'} CreditTransaction: ${creditTransactions} records`);

    // MCP tables
    console.log('\n🤖 MCP Tables:');
    const mcpCampaignMetrics = await prisma.mCPCampaignMetrics.count();
    const mcpCustomerPredictions = await prisma.mCPCustomerPredictions.count();
    const mcpVisitorSessions = await prisma.mCPVisitorSessions.count();
    const mcpMonitoringMetrics = await prisma.mCPMonitoringMetrics.count();
    
    console.log(`${mcpCampaignMetrics > 0 ? '✅' : '❌'} MCPCampaignMetrics: ${mcpCampaignMetrics} records`);
    console.log(`${mcpCustomerPredictions > 0 ? '✅' : '❌'} MCPCustomerPredictions: ${mcpCustomerPredictions} records`);
    console.log(`${mcpVisitorSessions > 0 ? '✅' : '❌'} MCPVisitorSessions: ${mcpVisitorSessions} records`);
    console.log(`${mcpMonitoringMetrics > 0 ? '✅' : '❌'} MCPMonitoringMetrics: ${mcpMonitoringMetrics} records`);

  } catch (error) {
    console.error('Error checking table counts:', error);
  }

  await prisma.$disconnect();
}

checkTableCounts()
  .then(() => {
    console.log('\n🎉 Table count check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error checking table counts:', error);
    process.exit(1);
  });