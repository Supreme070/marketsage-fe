#!/usr/bin/env npx tsx

/**
 * Demo Data Generation Script
 * 
 * Generates comprehensive demo data for LeadPulse to create an impressive
 * presentation environment with realistic visitor patterns, form submissions,
 * CRM integration history, and success stories.
 * 
 * Usage: npm run generate-demo-data
 */

import { demoDataGenerator } from '../src/lib/demo/demo-data-generator';
import { logger } from '../src/lib/logger';

async function main() {
  try {
    logger.info('🚀 Starting TechFlow Solutions Demo Data Generation...');
    logger.info('📊 Creating a compelling single-company SaaS demo:');
    logger.info('   • 52,000+ realistic visitors with deep behavioral patterns');
    logger.info('   • 4 customer segments: Enterprise, Mid-market, Small Business, Freelancer');
    logger.info('   • Complete customer journey from visitor → lead → customer');
    logger.info('   • African tech hub geographic distribution');
    logger.info('   • SaaS-specific conversion funnels and touchpoints');
    logger.info('   • Growth-weighted time patterns (8% monthly growth)');
    logger.info('   • Comprehensive CRM integration success story');
    logger.info('   • 90 days of historical data with realistic trends');
    logger.info('');

    // Generate TechFlow Solutions demo data
    await demoDataGenerator.generateAllDemoData();

    logger.info('');
    logger.info('✅ TechFlow Solutions demo data generation completed!');
    logger.info('');
    logger.info('🎯 Your LeadPulse demo showcases:');
    logger.info('   📈 TechFlow Solutions - AI-Powered Project Management Platform');
    logger.info('   🏢 25-50 employees, Founded 2022, Serving African markets');
    logger.info('   💰 $22k average deal size, 45-day sales cycle');
    logger.info('   🎪 3.8% conversion rate, 58 avg engagement score');
    logger.info('');
    logger.info('👥 Customer Segments:');
    logger.info('   • Enterprise (15%): $65k deals, 90-day cycle, Security-focused');
    logger.info('   • Mid-market (35%): $25k deals, 60-day cycle, Feature-driven');
    logger.info('   • Small Business (45%): $8.5k deals, 21-day cycle, Price-sensitive');
    logger.info('   • Freelancer (5%): $2.4k deals, 7-day cycle, Trial-focused');
    logger.info('');
    logger.info('🌍 Geographic Focus (African Tech Hubs):');
    logger.info('   • Nigeria: 45% (Lagos, Abuja, Port Harcourt)');
    logger.info('   • Kenya: 20% (Nairobi, Mombasa)');
    logger.info('   • South Africa: 15% (Cape Town, Johannesburg, Durban)');
    logger.info('   • Ghana: 10% (Accra, Kumasi)');
    logger.info('   • Other African markets: 10%');
    logger.info('');
    logger.info('📱 Traffic Sources & Attribution:');
    logger.info('   • Organic Search: 35% | LinkedIn: 25% | Direct: 15%');
    logger.info('   • Referrals: 10% | Twitter: 8% | GitHub: 4% | Others: 3%');
    logger.info('');
    logger.info('🎬 Single-company demo ready for SaaS presentations!');

  } catch (error) {
    logger.error('❌ Demo data generation failed:', error);
    console.error('Full error details:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { main as generateDemoData };