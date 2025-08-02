#!/usr/bin/env tsx

/**
 * MCP Customer Predictions Seed Script
 * 
 * This script generates realistic customer prediction data for MCP servers by:
 * - Analyzing existing Contact and CustomerProfile data
 * - Calculating churn risk based on last activity and engagement
 * - Generating lifetime value predictions from transaction history
 * - Creating engagement scores from campaign interactions
 * - Assigning customers to behavioral segments
 * 
 * Follows the same patterns as existing seed scripts for Docker compatibility.
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

// Load environment variables
dotenv.config();

// Allow connection to both Docker internal and local connections
const databaseUrl = process.env.DATABASE_URL || "postgresql://marketsage:marketsage_password@localhost:5432/marketsage?schema=public";

// Create Prisma client with direct connection to database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

// Customer segments based on behavior and value
const CUSTOMER_SEGMENTS = [
  { name: 'VIP Customers', criteria: 'High LTV + Low Churn Risk', percentage: 8 },
  { name: 'Growth Potential', criteria: 'Medium LTV + High Engagement', percentage: 15 },
  { name: 'At Risk', criteria: 'Any LTV + High Churn Risk', percentage: 12 },
  { name: 'New Customers', criteria: 'Recent signup + No history', percentage: 20 },
  { name: 'Loyal Base', criteria: 'Medium LTV + Low Churn Risk', percentage: 25 },
  { name: 'Price Sensitive', criteria: 'Low LTV + Medium Engagement', percentage: 12 },
  { name: 'Inactive', criteria: 'Low engagement + Old last activity', percentage: 8 }
];

// Nigerian/African customer behavior patterns
const BEHAVIOR_PATTERNS = {
  // Mobile-first behavior (90%+ mobile usage in Africa)
  mobileUsage: { min: 85, max: 98 },
  
  // Price sensitivity (higher in African markets)
  priceSensitivity: { min: 60, max: 90 },
  
  // Social influence (strong in African communities)
  socialInfluence: { min: 70, max: 95 },
  
  // WhatsApp preference (dominant in Africa)
  whatsappPreference: { min: 75, max: 95 },
  
  // SMS effectiveness (still strong in Africa)
  smsEngagement: { min: 40, max: 80 }
};

/**
 * Calculate churn risk based on customer activity and engagement
 */
function calculateChurnRisk(contact: any, lastActivity: Date): number {
  const daysSinceLastActivity = Math.floor((new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  
  let riskScore = 0;
  
  // Days since last activity (higher weight)
  if (daysSinceLastActivity > 90) riskScore += 40;
  else if (daysSinceLastActivity > 60) riskScore += 30;
  else if (daysSinceLastActivity > 30) riskScore += 20;
  else if (daysSinceLastActivity > 14) riskScore += 10;
  
  // Email engagement (if available)
  const emailEngagement = Math.random() * 100; // Placeholder - would come from actual email stats
  if (emailEngagement < 20) riskScore += 25;
  else if (emailEngagement < 40) riskScore += 15;
  else if (emailEngagement < 60) riskScore += 5;
  
  // Account age factor (newer accounts higher risk)
  const accountAgeDays = Math.floor((new Date().getTime() - contact.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  if (accountAgeDays < 30) riskScore += 15;
  else if (accountAgeDays < 90) riskScore += 10;
  
  // Customer status factor
  if (contact.status === 'INACTIVE') riskScore += 30;
  else if (contact.status === 'UNSUBSCRIBED') riskScore += 50;
  
  // Cap at 100 and add some randomness for realism
  riskScore = Math.min(100, riskScore + (Math.random() - 0.5) * 10);
  
  return Math.max(0, Math.min(100, riskScore));
}

/**
 * Calculate lifetime value based on customer profile and behavior
 */
function calculateLifetimeValue(contact: any, engagementScore: number): number {
  // Base LTV calculation for African market (lower than US/EU but growing)
  let baseLTV = 50; // Base $50 LTV for African customers
  
  // Engagement factor (high engagement = higher LTV)
  baseLTV *= (1 + engagementScore / 200); // Max 1.5x multiplier
  
  // Account age factor (loyal customers worth more)
  const accountAgeDays = Math.floor((new Date().getTime() - contact.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  if (accountAgeDays > 365) baseLTV *= 1.4; // Long-term customers
  else if (accountAgeDays > 180) baseLTV *= 1.2;
  else if (accountAgeDays > 90) baseLTV *= 1.1;
  
  // Industry/company size factor (if available)
  if (contact.company) {
    // Larger companies typically have higher LTV
    const companySize = Math.random();
    if (companySize > 0.8) baseLTV *= 2.5; // Enterprise
    else if (companySize > 0.6) baseLTV *= 1.8; // Medium business
    else if (companySize > 0.4) baseLTV *= 1.3; // Small business
  }
  
  // Location factor (urban vs rural, country economic factors)
  const locationFactor = Math.random() * 0.5 + 0.75; // 0.75-1.25x
  baseLTV *= locationFactor;
  
  // Add randomness for realism
  baseLTV *= (0.8 + Math.random() * 0.4); // ±20% variance
  
  return Number(baseLTV.toFixed(2));
}

/**
 * Calculate engagement score based on customer interactions
 */
function calculateEngagementScore(contact: any, lastActivity: Date): number {
  let score = 50; // Base score
  
  // Recent activity boost
  const daysSinceLastActivity = Math.floor((new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceLastActivity <= 7) score += 25;
  else if (daysSinceLastActivity <= 14) score += 15;
  else if (daysSinceLastActivity <= 30) score += 5;
  else if (daysSinceLastActivity > 90) score -= 25;
  
  // Account tenure (loyal customers get bonus)
  const accountAgeDays = Math.floor((new Date().getTime() - contact.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  if (accountAgeDays > 365) score += 15;
  else if (accountAgeDays > 180) score += 10;
  
  // Contact status
  if (contact.status === 'ACTIVE') score += 10;
  else if (contact.status === 'INACTIVE') score -= 20;
  else if (contact.status === 'UNSUBSCRIBED') score -= 40;
  
  // Profile completeness
  let profileCompleteness = 0;
  if (contact.firstName) profileCompleteness += 20;
  if (contact.lastName) profileCompleteness += 20;
  if (contact.phone) profileCompleteness += 20;
  if (contact.company) profileCompleteness += 20;
  if (contact.jobTitle) profileCompleteness += 20;
  
  score += profileCompleteness * 0.3; // 30% weight for profile completeness
  
  // Add some randomness for realistic variation
  score += (Math.random() - 0.5) * 20;
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Assign customer to behavioral segment
 */
function assignCustomerSegment(churnRisk: number, lifetimeValue: number, engagementScore: number, contact: any): string {
  const accountAgeDays = Math.floor((new Date().getTime() - contact.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  
  // VIP Customers: High LTV + Low Churn Risk
  if (lifetimeValue > 200 && churnRisk < 30) return 'VIP Customers';
  
  // At Risk: High Churn Risk regardless of other factors
  if (churnRisk > 70) return 'At Risk';
  
  // New Customers: Recent signups
  if (accountAgeDays < 30) return 'New Customers';
  
  // Growth Potential: Medium-High LTV + High Engagement
  if (lifetimeValue > 100 && engagementScore > 70) return 'Growth Potential';
  
  // Loyal Base: Long tenure + decent engagement
  if (accountAgeDays > 180 && engagementScore > 50 && churnRisk < 50) return 'Loyal Base';
  
  // Price Sensitive: Low LTV but decent engagement
  if (lifetimeValue < 75 && engagementScore > 40) return 'Price Sensitive';
  
  // Inactive: Low engagement
  if (engagementScore < 30) return 'Inactive';
  
  // Default to Loyal Base
  return 'Loyal Base';
}

/**
 * Generate behavioral insights for customer
 */
function generateCustomerInsights(churnRisk: number, lifetimeValue: number, engagementScore: number, segment: string): any {
  const insights = [];
  
  // Churn risk insights
  if (churnRisk > 70) {
    insights.push('High risk of churning - immediate retention action needed');
  } else if (churnRisk > 50) {
    insights.push('Moderate churn risk - consider engagement campaign');
  } else if (churnRisk < 20) {
    insights.push('Very loyal customer - excellent retention');
  }
  
  // LTV insights
  if (lifetimeValue > 200) {
    insights.push('High-value customer - prioritize for premium services');
  } else if (lifetimeValue > 100) {
    insights.push('Good revenue potential - upselling opportunity');
  } else {
    insights.push('Focus on engagement before monetization');
  }
  
  // Engagement insights
  if (engagementScore > 80) {
    insights.push('Highly engaged - brand advocate potential');
  } else if (engagementScore < 30) {
    insights.push('Low engagement - re-activation campaign needed');
  }
  
  // Segment-specific insights
  const segmentInsights = {
    'VIP Customers': 'Provide white-glove service and exclusive offers',
    'At Risk': 'Urgent: Deploy retention campaign with special incentives',
    'New Customers': 'Focus on onboarding and early value demonstration',
    'Growth Potential': 'Upsell opportunities with premium features',
    'Loyal Base': 'Maintain satisfaction with consistent communication',
    'Price Sensitive': 'Focus on value messaging and cost-effective solutions',
    'Inactive': 'Re-engagement campaign with compelling content'
  };
  
  if (segmentInsights[segment]) {
    insights.push(segmentInsights[segment]);
  }
  
  return insights;
}

/**
 * Main seeding function
 */
async function seedMCPCustomerPredictions() {
  console.log('🧠 Starting MCP Customer Predictions Seeding...');
  console.log(`📊 Database URL: ${databaseUrl.replace(/\/\/.*@/, '//***:***@')}`);

  try {
    // Get existing contacts
    const contacts = await prisma.contact.findMany({
      include: {
        organization: true,
        customerProfile: true
      }
    });

    console.log(`👥 Found ${contacts.length} contacts to analyze`);

    if (contacts.length === 0) {
      console.log('⚠️  No contacts found. Please run contact seeding first.');
      return;
    }

    // Clear existing predictions
    console.log('🧹 Clearing existing customer predictions...');
    await prisma.$executeRaw`DELETE FROM "MCPCustomerPredictions"`;

    let predictionsCreated = 0;

    for (const contact of contacts) {
      // Generate realistic last activity date
      const lastActivityDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000); // Last 180 days
      
      // Calculate predictions
      const engagementScore = calculateEngagementScore(contact, lastActivityDate);
      const churnRisk = calculateChurnRisk(contact, lastActivityDate);
      const lifetimeValue = calculateLifetimeValue(contact, engagementScore);
      const segment = assignCustomerSegment(churnRisk, lifetimeValue, engagementScore, contact);
      const insights = generateCustomerInsights(churnRisk, lifetimeValue, engagementScore, segment);
      
      // Generate behavioral scores (African market specific)
      const behavioralScores = {
        mobileUsage: randomBetween(BEHAVIOR_PATTERNS.mobileUsage.min, BEHAVIOR_PATTERNS.mobileUsage.max),
        priceSensitivity: randomBetween(BEHAVIOR_PATTERNS.priceSensitivity.min, BEHAVIOR_PATTERNS.priceSensitivity.max),
        socialInfluence: randomBetween(BEHAVIOR_PATTERNS.socialInfluence.min, BEHAVIOR_PATTERNS.socialInfluence.max),
        whatsappPreference: randomBetween(BEHAVIOR_PATTERNS.whatsappPreference.min, BEHAVIOR_PATTERNS.whatsappPreference.max),
        smsEngagement: randomBetween(BEHAVIOR_PATTERNS.smsEngagement.min, BEHAVIOR_PATTERNS.smsEngagement.max)
      };
      
      // Create prediction record
      await prisma.mCPCustomerPredictions.create({
        data: {
          id: randomUUID(),
          contactId: contact.id,
          organizationId: contact.organizationId,
          churnRisk: Number(churnRisk.toFixed(2)),
          lifetimeValue: lifetimeValue,
          engagementScore: engagementScore,
          segment: segment,
          lastActivityDate: lastActivityDate,
          nextBestAction: getNextBestAction(churnRisk, lifetimeValue, engagementScore, segment),
          preferredChannel: getPreferredChannel(behavioralScores),
          behavioralScores: JSON.stringify(behavioralScores),
          insights: JSON.stringify(insights),
          confidenceScore: Math.round(85 + Math.random() * 10), // 85-95% confidence
          calculatedAt: new Date(),
          lastUpdated: new Date()
        }
      });

      predictionsCreated++;
    }

    console.log(`✅ Successfully created ${predictionsCreated} customer prediction records`);
    
    // Display segment distribution
    const segmentCounts = await prisma.mCPCustomerPredictions.groupBy({
      by: ['segment'],
      _count: { segment: true },
      orderBy: { _count: { segment: 'desc' } }
    });

    console.log('\n📊 Customer Segment Distribution:');
    segmentCounts.forEach(segment => {
      const percentage = ((segment._count.segment / predictionsCreated) * 100).toFixed(1);
      console.log(`  ${segment.segment}: ${segment._count.segment} customers (${percentage}%)`);
    });

    // Display sample predictions
    const samplePredictions = await prisma.mCPCustomerPredictions.findMany({
      take: 3,
      include: {
        contact: {
          select: { firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { lifetimeValue: 'desc' }
    });

    console.log('\n🎯 Sample Customer Predictions:');
    samplePredictions.forEach(prediction => {
      console.log(`  ${prediction.contact.firstName} ${prediction.contact.lastName} (${prediction.contact.email})`);
      console.log(`    Segment: ${prediction.segment} | LTV: $${prediction.lifetimeValue} | Churn Risk: ${prediction.churnRisk}%`);
      console.log(`    Engagement: ${prediction.engagementScore}/100 | Next Action: ${prediction.nextBestAction}`);
      console.log(`    Preferred Channel: ${prediction.preferredChannel}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error seeding MCP customer predictions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Helper functions
 */
function randomBetween(min: number, max: number): number {
  return Math.round(Math.random() * (max - min) + min);
}

function getNextBestAction(churnRisk: number, lifetimeValue: number, engagementScore: number, segment: string): string {
  if (churnRisk > 70) return 'Send retention offer immediately';
  if (lifetimeValue > 200 && engagementScore > 70) return 'Offer premium upgrade';
  if (segment === 'New Customers') return 'Send onboarding sequence';
  if (engagementScore < 30) return 'Re-engagement campaign';
  if (lifetimeValue > 100) return 'Cross-sell complementary products';
  return 'Continue nurture sequence';
}

function getPreferredChannel(behavioralScores: any): string {
  const { whatsappPreference, smsEngagement, mobileUsage } = behavioralScores;
  
  if (whatsappPreference > 80) return 'WhatsApp';
  if (smsEngagement > 70 && mobileUsage > 85) return 'SMS';
  if (mobileUsage > 90) return 'Mobile App';
  return 'Email';
}

// Run the seeding script
if (require.main === module) {
  seedMCPCustomerPredictions()
    .then(() => {
      console.log('🎉 MCP Customer Predictions seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export default seedMCPCustomerPredictions;