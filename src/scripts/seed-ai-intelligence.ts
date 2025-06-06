/**
 * AI Intelligence Seed Data Generator
 * 
 * Creates realistic data for MarketSage AI Intelligence Dashboard
 * - Customer segments with realistic African fintech profiles
 * - Content analyses for marketing materials
 * - Chat history for AI interactions
 * - AI Tools usage data
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Sample African customer profiles for fintech
const sampleCustomers = [
  {
    firstName: 'Adaora',
    lastName: 'Okafor',
    email: 'adaora.okafor@gmail.com',
    phone: '+2348012345678',
    company: 'Okafor Enterprises',
    city: 'Lagos',
    country: 'Nigeria',
    transactionFrequency: 25,
    averageTransactionValue: 15000,
    totalSpent: 375000,
    churnRisk: 0.15,
    ltv: 1200000
  },
  {
    firstName: 'Chukwudi',
    lastName: 'Nnamdi',
    email: 'chukwudi.nnamdi@outlook.com',
    phone: '+2347098765432',
    company: 'Nnamdi Trading',
    city: 'Abuja',
    country: 'Nigeria',
    transactionFrequency: 8,
    averageTransactionValue: 5000,
    totalSpent: 40000,
    churnRisk: 0.85,
    ltv: 85000
  },
  {
    firstName: 'Amina',
    lastName: 'Hassan',
    email: 'amina.hassan@yahoo.com',
    phone: '+2348055555555',
    company: 'Hassan Textiles',
    city: 'Kano',
    country: 'Nigeria',
    transactionFrequency: 15,
    averageTransactionValue: 8000,
    totalSpent: 120000,
    churnRisk: 0.45,
    ltv: 320000
  },
  {
    firstName: 'Kwame',
    lastName: 'Asante',
    email: 'kwame.asante@gmail.com',
    phone: '+233244444444',
    company: 'Asante Gold',
    city: 'Accra',
    country: 'Ghana',
    transactionFrequency: 30,
    averageTransactionValue: 25000,
    totalSpent: 750000,
    churnRisk: 0.08,
    ltv: 2500000
  },
  {
    firstName: 'Fatima',
    lastName: 'Diallo',
    email: 'fatima.diallo@gmail.com',
    phone: '+221777777777',
    company: 'Diallo Import Export',
    city: 'Dakar',
    country: 'Senegal',
    transactionFrequency: 12,
    averageTransactionValue: 12000,
    totalSpent: 144000,
    churnRisk: 0.35,
    ltv: 480000
  }
];

// Sample marketing content for analysis
const sampleContent = [
  {
    title: 'Welcome Email - New Users',
    content: 'Welcome to MarketSage! 🚀 Transform your financial journey with our revolutionary fintech platform. Send money across Africa instantly, securely, and at the best rates. Join thousands of satisfied customers who trust us daily.',
    type: 'email',
    supremeScore: 87,
    sentiment: 0.85,
    readability: 82,
    engagement: 76
  },
  {
    title: 'Transaction Alert - WhatsApp',
    content: '✅ Transaction Complete! Your transfer of ₦50,000 to Adaora Okafor has been successfully processed. Transaction ID: MST2024001234. Thank you for choosing MarketSage!',
    type: 'whatsapp',
    supremeScore: 92,
    sentiment: 0.78,
    readability: 95,
    engagement: 89
  },
  {
    title: 'Promotional Campaign - SMS',
    content: '🎉 LIMITED TIME: Send money to Ghana with ZERO fees this week! Use code GHANA2024. Download the MarketSage app now and save big on international transfers.',
    type: 'sms',
    supremeScore: 78,
    sentiment: 0.82,
    readability: 88,
    engagement: 71
  },
  {
    title: 'Customer Support Follow-up',
    content: 'Hi there! We noticed you had a question about our exchange rates. Our team is here to help 24/7. For the most competitive rates across West Africa, we guarantee transparency and speed in every transaction.',
    type: 'email',
    supremeScore: 85,
    sentiment: 0.88,
    readability: 79,
    engagement: 73
  },
  {
    title: 'Premium Service Upgrade',
    content: 'Unlock MarketSage Premium! 💎 Get VIP treatment with instant transfers, priority support, and exclusive rates. Upgrade today for just ₦2,500/month and experience financial freedom like never before.',
    type: 'email',
    supremeScore: 81,
    sentiment: 0.79,
    readability: 84,
    engagement: 68
  }
];

// Sample AI chat interactions
const sampleChatHistory = [
  {
    question: 'What are the current exchange rates for Nigerian Naira to US Dollar?',
    answer: 'Based on current market data, the NGN to USD rate is approximately ₦1,650 per $1 USD. This represents a 2.3% improvement from last week. Would you like me to set up rate alerts for better timing?',
    confidence: 0.94
  },
  {
    question: 'Which customer segments are most at risk of churning?',
    answer: 'Analysis shows 23% of customers in the "Low Frequency" segment have churn risk above 70%. Key factors include: reduced transaction frequency (40% decline), longer gaps between transfers (avg 45 days), and decreased customer support interactions.',
    confidence: 0.87
  },
  {
    question: 'How can I improve my email campaign performance?',
    answer: 'Your current email campaigns show 76% engagement. To improve: 1) Personalize subject lines (+12% open rate), 2) Optimize send times for African time zones, 3) Include transaction cost savings in CTAs (+8% click rate).',
    confidence: 0.91
  },
  {
    question: 'Predict revenue for next month based on current trends',
    answer: 'Based on transaction patterns, customer growth (12% MoM), and seasonal trends, predicted revenue for next month is ₦145M-165M (confidence: 89%). Key drivers: increased cross-border transactions and new user acquisitions.',
    confidence: 0.89
  }
];

// Sample AI tools data
const sampleAITools = [
  {
    name: 'Supreme Content Analyzer',
    description: 'AI-powered content analysis for marketing campaigns',
    category: 'Content Intelligence',
    config: {
      features: ['sentiment', 'readability', 'engagement_prediction', 'supreme_scoring'],
      languages: ['en', 'ha', 'yo', 'ig', 'fr'],
      accuracy: 0.92
    },
    usage: {
      totalAnalyses: 1247,
      averageScore: 84.2,
      lastUsed: new Date().toISOString()
    }
  },
  {
    name: 'Customer Churn Predictor',
    description: 'Predict customer churn risk with ML algorithms',
    category: 'Customer Intelligence',
    config: {
      algorithm: 'Random Forest + Neural Network Ensemble',
      features: ['transaction_frequency', 'value_trends', 'support_interactions', 'app_usage'],
      accuracy: 0.87
    },
    usage: {
      predictionsGenerated: 852,
      averageAccuracy: 0.87,
      lastUsed: new Date().toISOString()
    }
  },
  {
    name: 'Market Trend Analyzer',
    description: 'Analyze African fintech market trends and opportunities',
    category: 'Market Intelligence',
    config: {
      markets: ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Senegal'],
      indicators: ['exchange_rates', 'regulatory_changes', 'competitor_activity'],
      updateFrequency: 'hourly'
    },
    usage: {
      trendsAnalyzed: 456,
      marketsTracked: 5,
      lastUsed: new Date().toISOString()
    }
  }
];

async function generateTimeSeriesData() {
  // Generate 30 days of realistic data
  const days = 30;
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - days);
  
  const data = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    
    // Simulate realistic patterns
    const weekday = date.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    
    // Business activity is higher on weekdays
    const baseActivity = isWeekend ? 0.6 : 1.0;
    
    // Add some randomness and growth trend
    const randomFactor = 0.8 + Math.random() * 0.4;
    const growthFactor = 1 + (i / days) * 0.1; // 10% growth over period
    
    const contentAnalyses = Math.floor(baseActivity * randomFactor * growthFactor * 15);
    const customerSegments = Math.floor(baseActivity * randomFactor * growthFactor * 8);
    const chatSessions = Math.floor(baseActivity * randomFactor * growthFactor * 25);
    const aiToolUsage = Math.floor(baseActivity * randomFactor * growthFactor * 35);
    
    data.push({
      date: date.toISOString().split('T')[0],
      contentAnalyses,
      customerSegments,
      chatSessions,
      aiToolUsage,
      totalActivity: contentAnalyses + customerSegments + chatSessions + aiToolUsage
    });
  }
  
  return data;
}

async function seedAIIntelligence() {
  console.log('🌱 Seeding AI Intelligence data...');
  
  try {
    // Use existing admin user instead of creating a new one
    const adminUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: 'admin@example.com' },
          { email: 'supreme@marketsage.africa' },
          { role: 'ADMIN' }
        ]
      }
    });
    
    if (!adminUser) {
      throw new Error('No admin user found. Please run the main seeding script first.');
    }

    // 1. Create realistic customer contacts
    console.log('Creating customer data...');
    const contacts = [];
    
    for (const customer of sampleCustomers) {
      const contact = await prisma.contact.create({
        data: {
          id: randomUUID(),
          email: customer.email,
          phone: customer.phone,
          firstName: customer.firstName,
          lastName: customer.lastName,
          company: customer.company,
          city: customer.city,
          country: customer.country,
          source: 'AI_DEMO_DATA',
          createdById: adminUser.id,
          updatedAt: new Date()
        }
      });
      contacts.push(contact);
      
      // TODO: Add churn predictions and LTV predictions once we verify model names
      console.log(`Created contact: ${customer.firstName} ${customer.lastName} (Churn Risk: ${customer.churnRisk}, LTV: ${customer.ltv})`);
    }

    // 2. Generate time series data for analytics
    console.log('Generating analytics data...');
    const timeSeriesData = await generateTimeSeriesData();
    
    // Store this as analytics records
    let analyticsCount = 0;
    for (const dayData of timeSeriesData) {
      await prisma.analytics.upsert({
        where: {
          entityType_entityId_period: {
            entityType: 'EMAIL_CAMPAIGN',
            entityId: `dashboard-overview-${dayData.date}`,
            period: 'DAILY'
          }
        },
        update: {
          metrics: JSON.stringify({
            date: dayData.date,
            contentAnalyses: dayData.contentAnalyses,
            customerSegments: dayData.customerSegments,
            chatSessions: dayData.chatSessions,
            aiToolUsage: dayData.aiToolUsage,
            totalActivity: dayData.totalActivity,
            trends: {
              contentAnalysesGrowth: Math.random() * 20 - 10, // -10% to +10%
              customerSegmentsGrowth: Math.random() * 15 - 5,
              chatSessionsGrowth: Math.random() * 30 - 10,
              aiToolUsageGrowth: Math.random() * 25 - 8
            }
          }),
          updatedAt: new Date()
        },
        create: {
          id: randomUUID(),
          entityType: 'EMAIL_CAMPAIGN',
          entityId: `dashboard-overview-${dayData.date}`,
          period: 'DAILY',
          metrics: JSON.stringify({
            date: dayData.date,
            contentAnalyses: dayData.contentAnalyses,
            customerSegments: dayData.customerSegments,
            chatSessions: dayData.chatSessions,
            aiToolUsage: dayData.aiToolUsage,
            totalActivity: dayData.totalActivity,
            trends: {
              contentAnalysesGrowth: Math.random() * 20 - 10, // -10% to +10%
              customerSegmentsGrowth: Math.random() * 15 - 5,
              chatSessionsGrowth: Math.random() * 30 - 10,
              aiToolUsageGrowth: Math.random() * 25 - 8
            }
          }),
          updatedAt: new Date()
        }
      });
      analyticsCount++;
    }

    console.log('✅ AI Intelligence seed data created successfully!');
    console.log(`📊 Created:`);
    console.log(`   - ${contacts.length} customer contacts with metadata`);
    console.log(`   - ${analyticsCount} days of analytics data`);
    console.log(`\n🔗 Next steps:`);
    console.log(`   1. Verify Prisma model names for AI tables`);
    console.log(`   2. Add content analyses, chat history, and AI tools`);
    console.log(`   3. Connect dashboard to real data API endpoints`);

  } catch (error) {
    console.error('❌ Error seeding AI Intelligence data:', error);
    throw error;
  }
}

async function main() {
  await seedAIIntelligence();
  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { seedAIIntelligence }; 