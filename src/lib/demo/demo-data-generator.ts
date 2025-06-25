/**
 * LeadPulse Demo Data Generator
 * 
 * Generates realistic, compelling demo data to showcase LeadPulse capabilities:
 * - 50,000+ realistic visitors with proper geographic/demographic distribution
 * - Time-based patterns with business hours, weekends, seasonal trends
 * - Realistic engagement scores and conversion funnels
 * - Multiple company scenarios with industry-specific behavior
 */

import { faker } from '@faker-js/faker';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

// Demo configuration - Single company focus
export const DEMO_CONFIG = {
  TOTAL_VISITORS: 52000,
  TIME_RANGE_DAYS: 90,
  COMPANY: {
    name: 'TechFlow Solutions',
    industry: 'SaaS',
    description: 'AI-powered project management platform for African businesses',
    website: 'https://techflowsolutions.com',
    founded: '2022',
    employees: '25-50',
    markets: ['Nigeria', 'Kenya', 'Ghana', 'South Africa'],
  }
};

// Geographic distribution (African focus)
const GEOGRAPHIC_DISTRIBUTION = {
  'Nigeria': { weight: 40, cities: ['Lagos', 'Abuja', 'Kano', 'Port Harcourt', 'Ibadan'] },
  'Kenya': { weight: 15, cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'] },
  'Ghana': { weight: 12, cities: ['Accra', 'Kumasi', 'Tamale', 'Cape Coast'] },
  'South Africa': { weight: 10, cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria'] },
  'Egypt': { weight: 8, cities: ['Cairo', 'Alexandria', 'Giza', 'Sharm El Sheikh'] },
  'Tanzania': { weight: 5, cities: ['Dar es Salaam', 'Dodoma', 'Mwanza', 'Arusha'] },
  'Uganda': { weight: 4, cities: ['Kampala', 'Gulu', 'Lira', 'Mbarara'] },
  'Morocco': { weight: 3, cities: ['Casablanca', 'Rabat', 'Marrakech', 'Fez'] },
  'Ethiopia': { weight: 2, cities: ['Addis Ababa', 'Dire Dawa', 'Mekelle'] },
  'Rwanda': { weight: 1, cities: ['Kigali', 'Butare', 'Gisenyi'] }
};

// Device distribution
const DEVICE_DISTRIBUTION = {
  'Desktop': 60,
  'Mobile': 35,
  'Tablet': 5
};

// Browser distribution  
const BROWSER_DISTRIBUTION = {
  'Chrome': 65,
  'Safari': 20,
  'Firefox': 10,
  'Edge': 5
};

// TechFlow Solutions - Complete SaaS behavior profile
const TECHFLOW_PROFILE = {
  name: 'TechFlow Solutions',
  industry: 'SaaS',
  description: 'AI-powered project management platform for African businesses',
  
  // Website structure and user journey
  pages: {
    landing: {
      home: { weight: 30, avgTime: 120, bounceRate: 45 },
      features: { weight: 25, avgTime: 180, bounceRate: 35 },
      pricing: { weight: 20, avgTime: 240, bounceRate: 25 },
      'use-cases': { weight: 15, avgTime: 200, bounceRate: 30 },
      about: { weight: 10, avgTime: 90, bounceRate: 55 }
    },
    highValue: {
      pricing: { weight: 35, avgTime: 300, conversionRate: 8.5 },
      enterprise: { weight: 25, avgTime: 420, conversionRate: 12.2 },
      'api-docs': { weight: 20, avgTime: 480, conversionRate: 6.8 },
      integrations: { weight: 15, avgTime: 210, conversionRate: 5.2 },
      security: { weight: 5, avgTime: 180, conversionRate: 4.1 }
    },
    conversion: {
      demo: { weight: 40, conversionRate: 18.5, avgDealSize: 25000 },
      'free-trial': { weight: 35, conversionRate: 25.2, avgDealSize: 15000 },
      contact: { weight: 20, conversionRate: 12.8, avgDealSize: 35000 },
      consultation: { weight: 5, conversionRate: 45.0, avgDealSize: 50000 }
    },
    content: {
      blog: { weight: 40, avgTime: 240, returnRate: 35 },
      'case-studies': { weight: 30, avgTime: 360, returnRate: 55 },
      resources: { weight: 20, avgTime: 180, returnRate: 25 },
      webinars: { weight: 10, avgTime: 600, returnRate: 75 }
    }
  },
  
  // Business metrics
  metrics: {
    avgDealSize: 22000,
    salesCycle: 45, // days
    churnRate: 8, // annual %
    ltv: 85000, // customer lifetime value
    conversionRate: 3.8,
    avgEngagementScore: 58,
    mobileTraffic: 0.42, // 42% mobile
    internationalTraffic: 0.15, // 15% outside Africa
  },
  
  // Customer segments with different behaviors
  segments: {
    enterprise: {
      percentage: 15,
      avgDealSize: 65000,
      conversionRate: 1.2,
      engagementScore: 75,
      salesCycle: 90,
      pages: ['enterprise', 'security', 'api-docs', 'consultation']
    },
    midmarket: {
      percentage: 35,
      avgDealSize: 25000,
      conversionRate: 2.8,
      engagementScore: 62,
      salesCycle: 60,
      pages: ['pricing', 'features', 'demo', 'case-studies']
    },
    smallbusiness: {
      percentage: 45,
      avgDealSize: 8500,
      conversionRate: 6.2,
      engagementScore: 48,
      salesCycle: 21,
      pages: ['pricing', 'free-trial', 'features', 'contact']
    },
    freelancer: {
      percentage: 5,
      avgDealSize: 2400,
      conversionRate: 12.5,
      engagementScore: 35,
      salesCycle: 7,
      pages: ['pricing', 'free-trial', 'features']
    }
  },
  
  // Time-based patterns
  temporal: {
    peakHours: [9, 10, 11, 14, 15, 16], // Business hours
    timeZones: ['Africa/Lagos', 'Africa/Nairobi', 'Africa/Johannesburg'],
    weekendTraffic: 0.25, // 25% of weekday traffic
    holidayImpact: 0.6, // 60% traffic during holidays
    monthlyGrowth: 0.08, // 8% month-over-month growth
  },
  
  // Traffic sources and attribution
  acquisition: {
    organic: { weight: 35, quality: 'high', conversionRate: 4.2 },
    linkedin: { weight: 25, quality: 'high', conversionRate: 5.8 },
    direct: { weight: 15, quality: 'medium', conversionRate: 3.1 },
    referral: { weight: 10, quality: 'high', conversionRate: 6.5 },
    twitter: { weight: 8, quality: 'medium', conversionRate: 2.8 },
    github: { weight: 4, quality: 'high', conversionRate: 7.2 },
    producthunt: { weight: 2, quality: 'medium', conversionRate: 3.5 },
    techcrunch: { weight: 1, quality: 'high', conversionRate: 8.9 }
  }
};

export class DemoDataGenerator {
  private userId: string;
  private startDate: Date;
  private endDate: Date;

  constructor(userId = 'demo-user-001') {
    this.userId = userId;
    this.endDate = new Date();
    this.startDate = new Date(this.endDate.getTime() - (DEMO_CONFIG.TIME_RANGE_DAYS * 24 * 60 * 60 * 1000));
  }

  /**
   * Generate all demo data for TechFlow Solutions
   */
  async generateAllDemoData(): Promise<void> {
    logger.info('🚀 Starting TechFlow Solutions demo data generation...');
    logger.info(`📊 Generating comprehensive data for ${TECHFLOW_PROFILE.name}...`);
    
    try {
      // Generate complete customer journey data
      await this.generateTechFlowData();

      logger.info('✅ TechFlow Solutions demo data generation completed successfully!');
    } catch (error) {
      logger.error('❌ Error generating demo data:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive TechFlow Solutions data
   */
  private async generateTechFlowData(): Promise<void> {
    // Generate visitors with deep behavioral patterns
    const visitors = await this.generateTechFlowVisitors();
    
    logger.info('✅ Generated TechFlow visitors successfully!');
    
    // TODO: Temporarily skip other components to test visitors first
    // const forms = await this.generateTechFlowForms();
    // await this.generateCustomerJourneySubmissions(visitors, forms);
    // await this.generateTechFlowCRMData();
    // await this.generateTechFlowIntegrations();
    // await this.generateTechFlowSuccessStory();
    
    logger.info(`✅ Generated complete TechFlow Solutions environment with ${DEMO_CONFIG.TOTAL_VISITORS.toLocaleString()} visitors`);
  }

  /**
   * Generate TechFlow Solutions visitors with deep behavioral patterns
   */
  private async generateTechFlowVisitors(): Promise<any[]> {
    const count = DEMO_CONFIG.TOTAL_VISITORS;
    const visitors = [];
    const batchSize = 100;

    for (let i = 0; i < count; i += batchSize) {
      const batch = [];
      const currentBatchSize = Math.min(batchSize, count - i);

      for (let j = 0; j < currentBatchSize; j++) {
        const visitor = await this.generateTechFlowVisitor();
        batch.push(visitor);
      }

      // Insert batch
      const createdVisitors = await prisma.leadPulseVisitor.createMany({
        data: batch,
        skipDuplicates: true
      });

      visitors.push(...batch);

      // Generate customer journey touchpoints for each visitor
      for (const visitor of batch) {
        await this.generateTechFlowTouchpoints(visitor);
      }

      logger.info(`📈 Generated ${i + currentBatchSize}/${count} TechFlow visitors`);
    }

    return visitors;
  }

  /**
   * Generate a single TechFlow Solutions visitor with behavioral segment
   */
  private async generateTechFlowVisitor(): Promise<any> {
    // Select customer segment first (influences all other behaviors)
    const segment = this.selectCustomerSegment();
    
    // Generate timestamp with SaaS business patterns and growth
    const visitTime = this.generateTechFlowTimestamp();
    
    // Geographic location with African tech hub focus
    const location = this.selectTechLocation();
    
    // Device selection based on segment (enterprise = more desktop)
    const device = this.selectDeviceBySegment(segment);
    
    // Browser selection
    const browser = this.selectBrowser();
    
    // Engagement score based on segment behavior
    const score = this.generateSegmentEngagementScore(segment);
    
    // Session data based on segment behavior
    const sessionData = this.generateSegmentSessionData(segment);
    
    // Conversion likelihood based on segment
    const isConverted = Math.random() < (TECHFLOW_PROFILE.segments[segment].conversionRate / 100);
    
    // Traffic source attribution
    const source = this.selectTrafficSource();
    
    const fingerprint = this.generateFingerprint();

    return {
      fingerprint,
      engagementScore: score,
      city: location.city,
      country: location.country,
      device,
      browser,
      score,
      metadata: {
        company: DEMO_CONFIG.COMPANY.name,
        industry: DEMO_CONFIG.COMPANY.industry,
        segment: segment,
        source: source,
        potentialDealSize: TECHFLOW_PROFILE.segments[segment].avgDealSize,
        salesCycle: TECHFLOW_PROFILE.segments[segment].salesCycle,
        sessionCount: sessionData.sessions,
        pageViews: sessionData.pageViews,
        isConverted,
        contactId: isConverted ? faker.string.uuid() : null,
        generatedAt: new Date().toISOString(),
        lastActivity: visitTime.toISOString(),
      },
      createdAt: visitTime,
      updatedAt: new Date(visitTime.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Generate TechFlow customer journey touchpoints
   */
  private async generateTechFlowTouchpoints(visitor: any): Promise<void> {
    const visitorSegment = visitor.metadata.segment;
    const touchpointCount = this.calculateTouchpointCount(visitorSegment);
    const touchpoints = [];

    for (let i = 0; i < touchpointCount; i++) {
      const touchpointTime = new Date(visitor.createdAt.getTime() + (i * Math.random() * 4 * 60 * 60 * 1000)); // Spread over 4 hours
      
      // Select page based on customer journey and segment
      const pageData = this.selectTechFlowPage(visitorSegment, i, touchpointCount);
      const page = this.generateTechFlowPageUrl(pageData.type, pageData.specific);
      
      const touchpoint = {
        visitorId: visitor.fingerprint, // We'll need to update this with actual visitor ID
        type: this.selectTouchpointType(pageData.type),
        url: page.url,
        title: page.title,
        duration: Math.floor(Math.random() * 300) + 30, // 30-330 seconds
        metadata: JSON.stringify({
          referrer: i === 0 ? this.selectTrafficSourceUrl() : page.url,
          scrollDepth: Math.floor(Math.random() * 100) + 1,
          clicks: Math.floor(Math.random() * 5),
          pageType: pageData.type,
        }),
        createdAt: touchpointTime,
      };

      touchpoints.push(touchpoint);
    }

    // We'll create these after visitor creation in the actual implementation
    // For now, store them in metadata
    visitor.touchpoints = touchpoints;
  }

  /**
   * Generate forms for a scenario
   */
  private async generateScenarioForms(scenario: any): Promise<any[]> {
    const formsConfig = [
      {
        name: 'Contact Us',
        description: `Get in touch with ${scenario.name}`,
        type: 'contact',
        expectedSubmissions: 250,
        conversionRate: 8.5,
      },
      {
        name: 'Demo Request',
        description: `Request a demo of ${scenario.industry} solution`,
        type: 'demo',
        expectedSubmissions: 180,
        conversionRate: 12.3,
      },
      {
        name: 'Newsletter Signup',
        description: `Stay updated with ${scenario.name} news`,
        type: 'newsletter',
        expectedSubmissions: 850,
        conversionRate: 25.7,
      },
      {
        name: 'Free Trial',
        description: 'Start your free trial today',
        type: 'trial',
        expectedSubmissions: 95,
        conversionRate: 15.8,
      },
      {
        name: 'Price Quote',
        description: 'Get a custom price quote',
        type: 'quote',
        expectedSubmissions: 45,
        conversionRate: 6.2,
      },
      {
        name: 'Support Ticket',
        description: 'Get help from our support team',
        type: 'support',
        expectedSubmissions: 120,
        conversionRate: 18.4,
      },
    ];

    const forms = [];

    for (const formConfig of formsConfig) {
      const form = await this.generateForm(formConfig, scenario);
      forms.push(form);
    }

    return forms;
  }

  /**
   * Generate a single form
   */
  private async generateForm(config: any, scenario: any): Promise<any> {
    const fields = this.generateFormFields(config.type);
    
    return {
      id: faker.string.uuid(),
      name: config.name,
      description: config.description,
      fields: JSON.stringify(fields),
      styling: JSON.stringify({
        theme: 'light',
        primaryColor: '#007bff',
        backgroundColor: '#ffffff',
        borderRadius: 8,
      }),
      settings: JSON.stringify({
        successMessage: 'Thank you for your submission!',
        emailNotifications: true,
        autoResponder: {
          enabled: true,
          subject: `Thank you for contacting ${scenario.name}`,
          message: 'We will get back to you soon.',
        },
      }),
      status: 'active',
      userId: this.userId,
      createdAt: faker.date.between({ from: this.startDate, to: this.endDate }),
      metadata: JSON.stringify({
        scenario: scenario.name,
        expectedSubmissions: config.expectedSubmissions,
        expectedConversionRate: config.conversionRate,
      }),
    };
  }

  /**
   * Generate form fields based on type
   */
  private generateFormFields(type: string): any[] {
    const baseFields = [
      {
        id: 'name',
        type: 'TEXT',
        label: 'Full Name',
        placeholder: 'Enter your full name',
        required: true,
        validation: { minLength: 2, maxLength: 100 },
      },
      {
        id: 'email',
        type: 'EMAIL',
        label: 'Email Address',
        placeholder: 'Enter your email',
        required: true,
      },
    ];

    const fieldsByType = {
      contact: [
        ...baseFields,
        {
          id: 'company',
          type: 'TEXT',
          label: 'Company',
          placeholder: 'Your company name',
          required: false,
        },
        {
          id: 'message',
          type: 'TEXTAREA',
          label: 'Message',
          placeholder: 'How can we help you?',
          required: true,
          validation: { minLength: 10, maxLength: 1000 },
        },
      ],
      demo: [
        ...baseFields,
        {
          id: 'company',
          type: 'TEXT',
          label: 'Company',
          required: true,
        },
        {
          id: 'role',
          type: 'SELECT',
          label: 'Your Role',
          required: true,
          options: [
            { value: 'ceo', label: 'CEO/Founder' },
            { value: 'cto', label: 'CTO/Tech Lead' },
            { value: 'marketing', label: 'Marketing Manager' },
            { value: 'sales', label: 'Sales Manager' },
            { value: 'other', label: 'Other' },
          ],
        },
        {
          id: 'team_size',
          type: 'SELECT',
          label: 'Team Size',
          required: true,
          options: [
            { value: '1-10', label: '1-10 employees' },
            { value: '11-50', label: '11-50 employees' },
            { value: '51-200', label: '51-200 employees' },
            { value: '200+', label: '200+ employees' },
          ],
        },
      ],
      newsletter: [
        {
          id: 'email',
          type: 'EMAIL',
          label: 'Email Address',
          placeholder: 'Enter your email',
          required: true,
        },
        {
          id: 'interests',
          type: 'CHECKBOX',
          label: 'Interests',
          required: false,
          options: [
            { value: 'product_updates', label: 'Product Updates' },
            { value: 'industry_news', label: 'Industry News' },
            { value: 'events', label: 'Events & Webinars' },
            { value: 'case_studies', label: 'Case Studies' },
          ],
        },
      ],
      trial: [
        ...baseFields,
        {
          id: 'company',
          type: 'TEXT',
          label: 'Company',
          required: true,
        },
        {
          id: 'phone',
          type: 'PHONE',
          label: 'Phone Number',
          required: false,
        },
      ],
      quote: [
        ...baseFields,
        {
          id: 'company',
          type: 'TEXT',
          label: 'Company',
          required: true,
        },
        {
          id: 'budget',
          type: 'SELECT',
          label: 'Budget Range',
          required: true,
          options: [
            { value: '1k-5k', label: '$1,000 - $5,000' },
            { value: '5k-10k', label: '$5,000 - $10,000' },
            { value: '10k-25k', label: '$10,000 - $25,000' },
            { value: '25k+', label: '$25,000+' },
          ],
        },
        {
          id: 'requirements',
          type: 'TEXTAREA',
          label: 'Requirements',
          placeholder: 'Describe your requirements',
          required: true,
        },
      ],
      support: [
        {
          id: 'email',
          type: 'EMAIL',
          label: 'Email Address',
          required: true,
        },
        {
          id: 'subject',
          type: 'TEXT',
          label: 'Subject',
          required: true,
        },
        {
          id: 'priority',
          type: 'SELECT',
          label: 'Priority',
          required: true,
          options: [
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'urgent', label: 'Urgent' },
          ],
        },
        {
          id: 'description',
          type: 'TEXTAREA',
          label: 'Description',
          required: true,
        },
      ],
    };

    return fieldsByType[type] || baseFields;
  }

  /**
   * Generate weighted timestamp based on business patterns
   */
  private generateWeightedTimestamp(peakHours: number[]): Date {
    // Random day within range
    const randomDay = faker.date.between({ from: this.startDate, to: this.endDate });
    
    // Weight towards business days (Monday-Friday)
    const dayOfWeek = randomDay.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (isWeekend && Math.random() < 0.7) {
      // 70% chance to pick a different day if weekend
      return this.generateWeightedTimestamp(peakHours);
    }
    
    // Weight towards peak hours
    let hour: number;
    if (Math.random() < 0.6) {
      // 60% chance to use peak hours
      hour = peakHours[Math.floor(Math.random() * peakHours.length)];
    } else {
      // 40% chance for any hour during business time (8-18)
      hour = Math.floor(Math.random() * 11) + 8; // 8 AM to 6 PM
    }
    
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    
    randomDay.setHours(hour, minute, second, 0);
    return randomDay;
  }

  /**
   * Select geographic location based on distribution
   */
  private selectGeographicLocation(): any {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const [country, data] of Object.entries(GEOGRAPHIC_DISTRIBUTION)) {
      cumulative += data.weight;
      if (random <= cumulative) {
        const city = data.cities[Math.floor(Math.random() * data.cities.length)];
        return {
          country,
          city,
          timezone: this.getTimezone(country),
        };
      }
    }
    
    // Fallback to Nigeria
    return {
      country: 'Nigeria',
      city: 'Lagos',
      timezone: 'Africa/Lagos',
    };
  }

  /**
   * Get timezone for country
   */
  private getTimezone(country: string): string {
    const timezones: Record<string, string> = {
      'Nigeria': 'Africa/Lagos',
      'Kenya': 'Africa/Nairobi',
      'Ghana': 'Africa/Accra',
      'South Africa': 'Africa/Johannesburg',
      'Egypt': 'Africa/Cairo',
      'Tanzania': 'Africa/Dar_es_Salaam',
      'Uganda': 'Africa/Kampala',
      'Morocco': 'Africa/Casablanca',
      'Ethiopia': 'Africa/Addis_Ababa',
      'Rwanda': 'Africa/Kigali',
    };
    
    return timezones[country] || 'Africa/Lagos';
  }

  /**
   * Helper methods for demo data generation
   */
  private selectSubmissionStatus(): string {
    const statuses = ['completed', 'pending', 'processed'];
    const weights = [85, 10, 5]; // 85% completed, 10% pending, 5% processed
    
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (let i = 0; i < statuses.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return statuses[i];
      }
    }
    
    return 'completed';
  }

  private generateUserAgent(device: string, browser: string): string {
    const agents = {
      'Chrome': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Safari': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      'Firefox': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
      'Edge': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    };
    
    if (device === 'Mobile') {
      return 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    }
    
    return agents[browser] || agents.Chrome;
  }

  private generateIPAddress(country: string): string {
    // Generate realistic IP ranges for African countries
    const ipRanges = {
      'Nigeria': ['41.58', '41.73', '197.149', '197.210'],
      'Kenya': ['41.90', '105.27', '197.232', '154.126'],
      'Ghana': ['41.89', '197.255', '154.160', '216.176'],
      'South Africa': ['41.86', '154.73', '196.25', '197.81'],
      'Egypt': ['41.67', '156.160', '197.131', '216.187'],
    };
    
    const ranges = ipRanges[country] || ipRanges['Nigeria'];
    const range = ranges[Math.floor(Math.random() * ranges.length)];
    const third = Math.floor(Math.random() * 255);
    const fourth = Math.floor(Math.random() * 255) + 1;
    
    return `${range}.${third}.${fourth}`;
  }

  private generateFieldValue(field: any, scenario: any): string {
    switch (field.type) {
      case 'EMAIL':
        return faker.internet.email();
      
      case 'TEXT':
        if (field.id === 'name') {
          return faker.person.fullName();
        } else if (field.id === 'company') {
          return this.generateCompanyName(scenario.industry);
        } else if (field.id === 'subject') {
          return this.generateEmailSubject(scenario);
        }
        return faker.lorem.words(Math.floor(Math.random() * 3) + 1);
      
      case 'TEXTAREA':
        if (field.id === 'message' || field.id === 'description') {
          return this.generateRealisticMessage(scenario);
        } else if (field.id === 'requirements') {
          return this.generateRequirements(scenario);
        }
        return faker.lorem.paragraph();
      
      case 'PHONE':
        return faker.phone.number();
      
      case 'SELECT':
        if (field.options && field.options.length > 0) {
          const option = field.options[Math.floor(Math.random() * field.options.length)];
          return option.value;
        }
        return 'other';
      
      case 'CHECKBOX':
        if (field.options && field.options.length > 0) {
          // Select 1-3 random options
          const selectedCount = Math.floor(Math.random() * 3) + 1;
          const selected = [];
          for (let i = 0; i < selectedCount && i < field.options.length; i++) {
            const option = field.options[Math.floor(Math.random() * field.options.length)];
            if (!selected.includes(option.value)) {
              selected.push(option.value);
            }
          }
          return JSON.stringify(selected);
        }
        return JSON.stringify([]);
      
      default:
        return faker.lorem.word();
    }
  }

  private generateCompanyName(industry: string): string {
    const prefixes = {
      'SaaS': ['Tech', 'Cloud', 'Data', 'Smart', 'Digital', 'Cyber', 'AI'],
      'E-commerce': ['Shop', 'Buy', 'Mart', 'Store', 'Market', 'Boutique'],
      'Business Consulting': ['Strategy', 'Growth', 'Success', 'Elite', 'Prime', 'Pro'],
      'Restaurant Chain': ['Taste', 'Fresh', 'Delicious', 'Golden', 'Royal', 'Chef'],
    };
    
    const suffixes = {
      'SaaS': ['Solutions', 'Systems', 'Labs', 'Technologies', 'Innovations'],
      'E-commerce': ['Hub', 'Store', 'Market', 'Plaza', 'Center'],
      'Business Consulting': ['Consulting', 'Partners', 'Group', 'Associates', 'Advisors'],
      'Restaurant Chain': ['Kitchen', 'Bistro', 'Cafe', 'Restaurant', 'Grill'],
    };
    
    const industryPrefixes = prefixes[industry] || prefixes['SaaS'];
    const industrySuffixes = suffixes[industry] || suffixes['SaaS'];
    
    const prefix = industryPrefixes[Math.floor(Math.random() * industryPrefixes.length)];
    const suffix = industrySuffixes[Math.floor(Math.random() * industrySuffixes.length)];
    
    return `${prefix} ${suffix}`;
  }

  private generateEmailSubject(scenario: any): string {
    const subjects = {
      'SaaS': [
        'Demo Request - Project Management Solution',
        'Pricing Inquiry for Enterprise Plan',
        'Integration Support Needed',
        'API Documentation Question',
        'Trial Extension Request',
      ],
      'E-commerce': [
        'Product Inquiry - African Fashion',
        'Bulk Order Request',
        'Return Policy Question',
        'Custom Design Request',
        'Shipping to International Location',
      ],
      'Business Consulting': [
        'Strategic Planning Consultation',
        'Market Entry Strategy for Nigeria',
        'Digital Transformation Project',
        'Growth Strategy Discussion',
        'Partnership Opportunity',
      ],
      'Restaurant Chain': [
        'Catering Services Inquiry',
        'Event Booking Request',
        'Franchise Opportunity',
        'Menu Customization Request',
        'Corporate Lunch Program',
      ],
    };
    
    const industrySubjects = subjects[scenario.industry] || subjects['SaaS'];
    return industrySubjects[Math.floor(Math.random() * industrySubjects.length)];
  }

  private generateRealisticMessage(scenario: any): string {
    const messages = {
      'SaaS': [
        'Hi, I\'m interested in learning more about your project management solution. We\'re a growing team of 25 people and looking for a tool that can help us streamline our workflows. Could we schedule a demo?',
        'Hello, I saw your pricing page and I\'m wondering if you offer any discounts for startups. We\'re bootstrapped and could really use a solution like yours.',
        'Hi there, we\'re currently using [competitor] but facing some integration issues. Can your platform integrate with Slack and Google Workspace?',
      ],
      'E-commerce': [
        'Hello, I love your African fashion collection! I\'m organizing a cultural event and need 20 matching outfits. Do you offer bulk discounts?',
        'Hi, I\'m interested in your latest collection. Do you ship to the US? What are the shipping times and costs?',
        'Good day, I saw your beautiful ankara designs on Instagram. Do you do custom sizes? I need something for a special occasion.',
      ],
      'Business Consulting': [
        'Hi, our company is planning to expand into the Nigerian market. We need strategic guidance on market entry, regulatory compliance, and local partnerships. Can we discuss?',
        'Hello, we\'re a tech startup looking to scale across Africa. We need help with business strategy and funding guidance. What services do you offer?',
        'Good morning, we\'re going through digital transformation and need expert guidance. Can you help with change management and technology implementation?',
      ],
      'Restaurant Chain': [
        'Hi, I\'m planning a corporate event for 100 people next month. Do you provide catering services? We need traditional Nigerian cuisine.',
        'Hello, I\'m interested in learning about franchise opportunities. What are the requirements and investment needed?',
        'Good day, we\'re organizing a wedding reception and need catering for 200 guests. Can you provide a custom menu with both local and continental dishes?',
      ],
    };
    
    const industryMessages = messages[scenario.industry] || messages['SaaS'];
    return industryMessages[Math.floor(Math.random() * industryMessages.length)];
  }

  private generateRequirements(scenario: any): string {
    const requirements = {
      'SaaS': [
        'We need a solution that supports: 1) Multi-project management, 2) Team collaboration tools, 3) Time tracking, 4) Custom reporting, 5) API integration with existing tools. Budget: $10,000-$15,000 annually.',
        'Requirements: Scalable for 50+ users, mobile app, offline capabilities, advanced security features, GDPR compliance. Timeline: Implementation within 3 months.',
      ],
      'E-commerce': [
        'Looking for: Custom African print dresses, sizes XS-3XL, high-quality fabric, delivery within 2 weeks, international shipping available. Budget: $2,000-$5,000.',
        'Need bulk order: 50 pieces traditional wear, corporate branding allowed, mix of sizes, delivery by end of month. Budget flexible for quality products.',
      ],
      'Business Consulting': [
        'Project scope: Market analysis for fintech expansion in West Africa, regulatory compliance review, go-to-market strategy, local partnership identification. Timeline: 6 months. Budget: $50,000-$75,000.',
        'Services needed: Digital transformation strategy, technology roadmap, change management, staff training programs, KPI development. Urgent project - 3 month timeline.',
      ],
      'Restaurant Chain': [
        'Event details: Corporate annual dinner, 150 guests, mix of vegetarian and meat options, traditional Nigerian dishes preferred, professional service staff needed. Date: Next month.',
        'Catering needs: Weekly corporate lunches, 40-50 people, variety of healthy options, dietary restrictions accommodation, reliable delivery service. Long-term contract.',
      ],
    };
    
    const industryRequirements = requirements[scenario.industry] || requirements['SaaS'];
    return industryRequirements[Math.floor(Math.random() * industryRequirements.length)];
  }

  private selectCRMOperation(): string {
    const operations = ['contact_sync', 'deal_creation', 'lead_update', 'data_export', 'field_mapping'];
    const weights = [40, 25, 20, 10, 5]; // Weighted selection
    
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (let i = 0; i < operations.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return operations[i];
      }
    }
    
    return 'contact_sync';
  }

  private generateCRMError(operation: string): string {
    const errors = {
      'contact_sync': [
        'Duplicate email address detected',
        'Required field missing: Company',
        'Invalid phone number format',
      ],
      'deal_creation': [
        'Invalid stage value provided',
        'Contact association failed',
        'Amount field validation error',
      ],
      'lead_update': [
        'Record not found in CRM',
        'Insufficient permissions',
        'Field mapping error',
      ],
      'data_export': [
        'Query timeout exceeded',
        'Export limit reached',
        'Invalid date range',
      ],
      'field_mapping': [
        'Custom field not found',
        'Data type mismatch',
        'Mapping configuration error',
      ],
    };
    
    const operationErrors = errors[operation] || errors['contact_sync'];
    return operationErrors[Math.floor(Math.random() * operationErrors.length)];
  }

  private generateCRMSuccessStories(scenario: any): any[] {
    const stories = [
      {
        title: `${scenario.name} increased lead conversion by 45%`,
        description: 'Automated lead scoring and CRM integration helped prioritize high-value prospects',
        metrics: {
          conversionIncrease: '45%',
          leadsGenerated: Math.floor(Math.random() * 1000) + 500,
          revenue: `$${(Math.random() * 100000 + 25000).toFixed(0)}`,
        },
      },
      {
        title: 'Reduced manual data entry by 80%',
        description: 'Seamless integration eliminated duplicate work and improved data accuracy',
        metrics: {
          timesSaved: '15 hours/week',
          accuracyImprovement: '80%',
          costSavings: `$${(Math.random() * 50000 + 10000).toFixed(0)}`,
        },
      },
    ];
    
    return stories;
  }

  private selectWebhookEvents(type: string): string {
    const allEvents = ['visitor.new', 'visitor.converted', 'form.submitted', 'lead.qualified', 'alert.triggered'];
    
    const eventsByType = {
      'slack': ['visitor.converted', 'form.submitted', 'lead.qualified'],
      'email': ['visitor.new', 'form.submitted', 'alert.triggered'],
      'custom': allEvents,
      'zapier': ['visitor.converted', 'form.submitted'],
      'teams': ['visitor.converted', 'lead.qualified', 'alert.triggered'],
    };
    
    const events = eventsByType[type] || allEvents;
    return JSON.stringify(events);
  }

  private selectRandomFromArray<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private generateWebhookPayload(eventType: string, scenario: any): any {
    const basePayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      source: 'leadpulse',
      scenario: scenario.name,
    };
    
    switch (eventType) {
      case 'visitor.new':
        return {
          ...basePayload,
          visitor: {
            id: faker.string.uuid(),
            fingerprint: this.generateFingerprint(),
            location: { country: 'Nigeria', city: 'Lagos' },
            device: 'Desktop',
            score: Math.floor(Math.random() * 100),
          },
        };
      
      case 'form.submitted':
        return {
          ...basePayload,
          form: {
            id: faker.string.uuid(),
            name: 'Contact Form',
            fields: {
              email: faker.internet.email(),
              name: faker.person.fullName(),
            },
          },
        };
      
      default:
        return basePayload;
    }
  }

  private generateWebhookError(): string {
    const errors = [
      'Connection timeout',
      'Invalid SSL certificate',
      'Endpoint not found',
      'Server error: 500',
      'Rate limit exceeded',
      'Authentication failed',
    ];
    
    return errors[Math.floor(Math.random() * errors.length)];
  }

  private generateAlertHistory(scenario: any): any[] {
    const alerts = [];
    const alertCount = Math.floor(Math.random() * 200) + 50;
    
    for (let i = 0; i < alertCount; i++) {
      const alertTime = faker.date.between({ from: this.startDate, to: this.endDate });
      const alertType = this.selectRandomFromArray(['high_value_visitor', 'form_abandoned', 'conversion_milestone', 'traffic_spike']);
      
      alerts.push({
        id: faker.string.uuid(),
        type: alertType,
        title: this.generateAlertTitle(alertType),
        description: this.generateAlertDescription(alertType, scenario),
        severity: this.selectRandomFromArray(['low', 'medium', 'high']),
        status: this.selectRandomFromArray(['sent', 'delivered', 'acknowledged']),
        createdAt: alertTime,
      });
    }
    
    return alerts;
  }

  private generateAlertTitle(type: string): string {
    const titles = {
      'high_value_visitor': 'High-Value Visitor Detected',
      'form_abandoned': 'Form Abandonment Alert',
      'conversion_milestone': 'Conversion Milestone Reached',
      'traffic_spike': 'Traffic Spike Detected',
    };
    
    return titles[type] || 'LeadPulse Alert';
  }

  private generateAlertDescription(type: string, scenario: any): string {
    const descriptions = {
      'high_value_visitor': `A visitor with 85+ engagement score from ${scenario.industry} industry is browsing your pricing page`,
      'form_abandoned': 'A visitor started filling out your contact form but didn\'t complete it',
      'conversion_milestone': `Congratulations! You\'ve reached 100 new leads this month`,
      'traffic_spike': 'Website traffic increased by 300% in the last hour',
    };
    
    return descriptions[type] || 'LeadPulse detected an important event on your website';
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Select device based on scenario mobile traffic
   */
  private selectDevice(mobileWeight: number): string {
    const random = Math.random();
    
    if (random < mobileWeight) {
      return 'Mobile';
    } else if (random < mobileWeight + 0.05) { // 5% tablet
      return 'Tablet';
    } else {
      return 'Desktop';
    }
  }

  /**
   * Select browser based on distribution
   */
  private selectBrowser(): string {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const [browser, weight] of Object.entries(BROWSER_DISTRIBUTION)) {
      cumulative += weight;
      if (random <= cumulative) {
        return browser;
      }
    }
    
    return 'Chrome';
  }

  /**
   * Generate engagement score with scenario-specific average
   */
  private generateEngagementScore(avgScore: number): number {
    // Generate score with normal distribution around average
    const variance = 15; // Standard deviation
    const score = Math.round(faker.number.float({ min: avgScore - variance, max: avgScore + variance }));
    
    // Clamp between 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate unique fingerprint
   */
  private generateFingerprint(): string {
    return `fp_demo_${faker.string.alphanumeric(16)}`;
  }

  /**
   * Select page type based on scenario and visit sequence
   */
  private selectPageType(scenario: any, isFirstVisit: boolean): string {
    if (isFirstVisit) {
      // Landing pages for first visit
      const landingPages = ['home', 'pricing', 'features', 'about'];
      return landingPages[Math.floor(Math.random() * landingPages.length)];
    }
    
    // Subsequent visits - weight towards high-value pages
    const random = Math.random();
    
    if (random < 0.3) {
      // 30% high-value pages
      const highValueTypes = ['pricing', 'features', 'enterprise', 'demo'];
      return highValueTypes[Math.floor(Math.random() * highValueTypes.length)];
    } else if (random < 0.5) {
      // 20% conversion pages
      const conversionTypes = ['contact', 'signup', 'checkout', 'trial'];
      return conversionTypes[Math.floor(Math.random() * conversionTypes.length)];
    } else {
      // 50% regular pages
      const regularTypes = ['blog', 'about', 'support', 'resources'];
      return regularTypes[Math.floor(Math.random() * regularTypes.length)];
    }
  }

  /**
   * Generate page URL and title
   */
  private generatePageUrl(pageType: string, scenario: any): { url: string; title: string } {
    const baseUrl = `https://${scenario.name.toLowerCase().replace(/\s+/g, '')}.com`;
    
    const pages: Record<string, { url: string; title: string }> = {
      home: { url: baseUrl, title: `${scenario.name} - ${scenario.description}` },
      pricing: { url: `${baseUrl}/pricing`, title: `Pricing - ${scenario.name}` },
      features: { url: `${baseUrl}/features`, title: `Features - ${scenario.name}` },
      about: { url: `${baseUrl}/about`, title: `About Us - ${scenario.name}` },
      contact: { url: `${baseUrl}/contact`, title: `Contact Us - ${scenario.name}` },
      demo: { url: `${baseUrl}/demo`, title: `Request Demo - ${scenario.name}` },
      enterprise: { url: `${baseUrl}/enterprise`, title: `Enterprise Solutions - ${scenario.name}` },
      signup: { url: `${baseUrl}/signup`, title: `Sign Up - ${scenario.name}` },
      trial: { url: `${baseUrl}/trial`, title: `Free Trial - ${scenario.name}` },
      blog: { url: `${baseUrl}/blog`, title: `Blog - ${scenario.name}` },
      support: { url: `${baseUrl}/support`, title: `Support - ${scenario.name}` },
      resources: { url: `${baseUrl}/resources`, title: `Resources - ${scenario.name}` },
      checkout: { url: `${baseUrl}/checkout`, title: `Checkout - ${scenario.name}` },
    };
    
    return pages[pageType] || pages.home;
  }

  /**
   * Select touchpoint type based on page
   */
  private selectTouchpointType(pageType: string): string {
    const conversionPages = ['contact', 'signup', 'checkout', 'trial', 'demo'];
    
    if (conversionPages.includes(pageType)) {
      const types = ['pageview', 'form_focus', 'form_submit'];
      return types[Math.floor(Math.random() * types.length)];
    }
    
    const types = ['pageview', 'click', 'scroll_milestone'];
    return types[Math.floor(Math.random() * types.length)];
  }

  /**
   * Select referrer based on distribution
   */
  private selectReferrer(distribution: Record<string, number>): string {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const [referrer, weight] of Object.entries(distribution)) {
      cumulative += weight;
      if (random <= cumulative) {
        if (referrer === 'direct') {
          return '';
        }
        return `https://${referrer}/`;
      }
    }
    
    return '';
  }

  /**
   * Generate form submissions
   */
  private async generateFormSubmissions(visitors: any[], forms: any[], scenario: any): Promise<void> {
    logger.info(`📝 Generating form submissions for ${scenario.name}...`);
    
    for (const form of forms) {
      const expectedSubmissions = form.metadata ? JSON.parse(form.metadata).expectedSubmissions : 100;
      const submissionCount = Math.floor(expectedSubmissions * (0.8 + Math.random() * 0.4)); // 80-120% of expected
      
      const submissions = [];
      const submissionData = [];
      
      for (let i = 0; i < submissionCount; i++) {
        // Select a random visitor who could have submitted this form
        const visitor = visitors[Math.floor(Math.random() * visitors.length)];
        const submissionTime = new Date(visitor.createdAt.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000); // Within 30 days
        
        const submission = {
          id: faker.string.uuid(),
          formId: form.id,
          visitorId: visitor.fingerprint,
          status: this.selectSubmissionStatus(),
          submittedAt: submissionTime,
          metadata: JSON.stringify({
            userAgent: this.generateUserAgent(visitor.device, visitor.browser),
            ipAddress: this.generateIPAddress(JSON.parse(visitor.location).country),
            source: 'leadpulse_demo',
            completionTime: Math.floor(Math.random() * 300) + 30, // 30-330 seconds
          }),
          createdAt: submissionTime,
        };
        
        submissions.push(submission);
        
        // Generate field data for this submission
        const fields = JSON.parse(form.fields);
        for (const field of fields) {
          const fieldData = {
            submissionId: submission.id,
            fieldId: field.id,
            value: this.generateFieldValue(field, scenario),
            createdAt: submissionTime,
          };
          submissionData.push(fieldData);
        }
      }
      
      // Batch insert submissions
      if (submissions.length > 0) {
        await prisma.leadPulseFormSubmission.createMany({
          data: submissions,
          skipDuplicates: true,
        });
        
        await prisma.leadPulseSubmissionData.createMany({
          data: submissionData,
          skipDuplicates: true,
        });
        
        logger.info(`✅ Generated ${submissions.length} submissions for form: ${form.name}`);
      }
    }
  }

  /**
   * Generate CRM integration data
   */
  private async generateCRMIntegrationData(scenario: any): Promise<void> {
    logger.info(`🔗 Generating CRM data for ${scenario.name}...`);
    
    // Generate realistic CRM sync history
    const syncEvents = [];
    const totalSyncs = Math.floor(Math.random() * 500) + 200; // 200-700 sync events
    
    for (let i = 0; i < totalSyncs; i++) {
      const syncTime = faker.date.between({ from: this.startDate, to: this.endDate });
      const platform = Math.random() < 0.6 ? 'salesforce' : 'hubspot';
      const operation = this.selectCRMOperation();
      const isSuccess = Math.random() < 0.92; // 92% success rate
      
      const syncEvent = {
        id: faker.string.uuid(),
        userId: this.userId,
        platform,
        operation,
        status: isSuccess ? 'success' : 'error',
        recordsProcessed: isSuccess ? Math.floor(Math.random() * 50) + 1 : 0,
        errorMessage: isSuccess ? null : this.generateCRMError(operation),
        duration: Math.floor(Math.random() * 30000) + 1000, // 1-30 seconds
        metadata: JSON.stringify({
          scenario: scenario.name,
          batchSize: Math.floor(Math.random() * 100) + 10,
          apiVersion: platform === 'salesforce' ? 'v58.0' : 'v3',
          rateLimitRemaining: Math.floor(Math.random() * 1000) + 500,
        }),
        createdAt: syncTime,
      };
      
      syncEvents.push(syncEvent);
    }
    
    // Create CRM sync audit logs
    await prisma.leadPulseAuditLog.createMany({
      data: syncEvents.map(event => ({
        id: faker.string.uuid(),
        userId: this.userId,
        action: 'SYNC',
        resource: `crm_${event.platform}`,
        resourceId: event.id,
        details: JSON.stringify({
          operation: event.operation,
          status: event.status,
          recordsProcessed: event.recordsProcessed,
          duration: event.duration,
        }),
        metadata: event.metadata,
        createdAt: event.createdAt,
      })),
      skipDuplicates: true,
    });
    
    // Generate success stories
    const successStories = this.generateCRMSuccessStories(scenario);
    logger.info(`✅ Generated ${totalSyncs} CRM sync events and ${successStories.length} success stories`);
  }

  /**
   * Generate alerts and webhooks
   */
  private async generateAlertsAndWebhooks(scenario: any): Promise<void> {
    logger.info(`🚨 Generating alerts and webhooks for ${scenario.name}...`);
    
    // Generate webhook endpoints
    const webhookEndpoints = [];
    const webhookTypes = ['slack', 'email', 'custom', 'zapier', 'teams'];
    
    for (const type of webhookTypes) {
      const endpoint = {
        id: faker.string.uuid(),
        userId: this.userId,
        name: `Demo ${this.capitalizeFirst(type)} Integration`,
        url: `https://hooks.${type}.com/demo/${faker.string.alphanumeric(12)}`,
        events: this.selectWebhookEvents(type),
        isActive: Math.random() < 0.8, // 80% active
        secret: faker.string.alphanumeric(32),
        metadata: JSON.stringify({
          scenario: scenario.name,
          channel: type === 'slack' ? '#leads' : null,
          integration: type,
          setupDate: faker.date.between({ from: this.startDate, to: this.endDate }).toISOString(),
        }),
        createdAt: faker.date.between({ from: this.startDate, to: this.endDate }),
      };
      
      webhookEndpoints.push(endpoint);
    }
    
    // Create webhook endpoints
    await prisma.webhookEndpoint.createMany({
      data: webhookEndpoints,
      skipDuplicates: true,
    });
    
    // Generate webhook deliveries
    const deliveries = [];
    const totalDeliveries = Math.floor(Math.random() * 2000) + 500; // 500-2500 deliveries
    
    for (let i = 0; i < totalDeliveries; i++) {
      const endpoint = webhookEndpoints[Math.floor(Math.random() * webhookEndpoints.length)];
      const deliveryTime = faker.date.between({ from: this.startDate, to: this.endDate });
      const eventType = this.selectRandomFromArray(JSON.parse(endpoint.events));
      const isSuccess = Math.random() < 0.94; // 94% success rate
      
      const delivery = {
        id: faker.string.uuid(),
        endpointId: endpoint.id,
        eventType: eventType as string,
        payload: JSON.stringify(this.generateWebhookPayload(eventType as string, scenario || {})),
        status: isSuccess ? 'delivered' : (Math.random() < 0.3 ? 'failed' : 'retrying'),
        attempts: isSuccess ? 1 : Math.floor(Math.random() * 5) + 1,
        lastAttemptAt: deliveryTime,
        nextRetryAt: isSuccess ? null : new Date(deliveryTime.getTime() + Math.random() * 3600000), // Within 1 hour
        responseStatus: isSuccess ? (200 + Math.floor(Math.random() * 5)) : (400 + Math.floor(Math.random() * 100)),
        responseBody: isSuccess ? 'OK' : this.generateWebhookError(),
        duration: Math.floor(Math.random() * 5000) + 100, // 100ms - 5s
        metadata: JSON.stringify({
          userAgent: 'LeadPulse-Webhook/1.0',
          signature: faker.string.alphanumeric(64),
          headers: {
            'Content-Type': 'application/json',
            'X-LeadPulse-Event': eventType,
          },
        }),
        createdAt: deliveryTime,
      };
      
      deliveries.push(delivery);
    }
    
    // Batch insert deliveries
    const batchSize = 100;
    for (let i = 0; i < deliveries.length; i += batchSize) {
      const batch = deliveries.slice(i, i + batchSize);
      await prisma.webhookDelivery.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }
    
    // Generate alert history
    const alertEvents = this.generateAlertHistory(scenario);
    
    logger.info(`✅ Generated ${webhookEndpoints.length} webhook endpoints, ${deliveries.length} deliveries, and ${alertEvents.length} alert events`);
  }

  /**
   * TechFlow Solutions - Specific Helper Methods
   */
  
  private selectCustomerSegment(): keyof typeof TECHFLOW_PROFILE.segments {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const [segment, data] of Object.entries(TECHFLOW_PROFILE.segments)) {
      cumulative += data.percentage;
      if (random <= cumulative) {
        return segment as keyof typeof TECHFLOW_PROFILE.segments;
      }
    }
    
    return 'smallbusiness';
  }

  private generateTechFlowTimestamp(): Date {
    // Add growth trend - more recent visitors
    const growthWeight = Math.random();
    const timeWeight = Math.pow(growthWeight, 0.7); // Bias towards recent dates
    
    const timeRange = this.endDate.getTime() - this.startDate.getTime();
    const randomTime = this.startDate.getTime() + (timeWeight * timeRange);
    const baseDate = new Date(randomTime);
    
    // Apply business hours weighting
    return this.applyBusinessHoursWeighting(baseDate);
  }

  private applyBusinessHoursWeighting(date: Date): Date {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // 70% chance to reroll if weekend
    if (isWeekend && Math.random() < 0.7) {
      return this.generateTechFlowTimestamp();
    }
    
    // Weight towards business hours
    let hour: number;
    if (Math.random() < 0.65) {
      // 65% during peak hours
      hour = TECHFLOW_PROFILE.temporal.peakHours[Math.floor(Math.random() * TECHFLOW_PROFILE.temporal.peakHours.length)];
    } else {
      // 35% during extended business hours (7 AM - 7 PM)
      hour = Math.floor(Math.random() * 13) + 7;
    }
    
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    
    date.setHours(hour, minute, second, 0);
    return date;
  }

  private selectTechLocation(): any {
    // Tech-focused African cities with higher probability
    const techHubs = {
      'Nigeria': { weight: 45, cities: ['Lagos', 'Abuja', 'Port Harcourt'] },
      'Kenya': { weight: 20, cities: ['Nairobi', 'Mombasa'] },
      'South Africa': { weight: 15, cities: ['Cape Town', 'Johannesburg', 'Durban'] },
      'Ghana': { weight: 10, cities: ['Accra', 'Kumasi'] },
      'Egypt': { weight: 5, cities: ['Cairo', 'Alexandria'] },
      'Rwanda': { weight: 3, cities: ['Kigali'] },
      'Morocco': { weight: 2, cities: ['Casablanca', 'Rabat'] },
    };
    
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const [country, data] of Object.entries(techHubs)) {
      cumulative += data.weight;
      if (random <= cumulative) {
        const city = data.cities[Math.floor(Math.random() * data.cities.length)];
        return {
          country,
          city,
          timezone: this.getTimezone(country),
          techHub: true,
        };
      }
    }
    
    return {
      country: 'Nigeria',
      city: 'Lagos',
      timezone: 'Africa/Lagos',
      techHub: true,
    };
  }

  private selectDeviceBySegment(segment: string): string {
    const deviceDistribution = {
      enterprise: { Desktop: 75, Mobile: 20, Tablet: 5 },
      midmarket: { Desktop: 65, Mobile: 30, Tablet: 5 },
      smallbusiness: { Desktop: 55, Mobile: 40, Tablet: 5 },
      freelancer: { Desktop: 45, Mobile: 50, Tablet: 5 },
    };
    
    const distribution = deviceDistribution[segment] || deviceDistribution.smallbusiness;
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const [device, weight] of Object.entries(distribution)) {
      cumulative += Number(weight);
      if (random <= cumulative) {
        return device;
      }
    }
    
    return 'Desktop';
  }

  private generateSegmentEngagementScore(segment: string): number {
    const baseScore = TECHFLOW_PROFILE.segments[segment].engagementScore;
    const variance = 12; // Standard deviation
    
    // Generate score with normal distribution
    const score = Math.round(faker.number.float({ min: baseScore - variance, max: baseScore + variance }));
    return Math.max(0, Math.min(100, score));
  }

  private generateSegmentSessionData(segment: string): { sessions: number; pageViews: number } {
    const sessionWeights = {
      enterprise: { min: 3, max: 15, avgPages: 8 },
      midmarket: { min: 2, max: 10, avgPages: 6 },
      smallbusiness: { min: 1, max: 8, avgPages: 4 },
      freelancer: { min: 1, max: 5, avgPages: 3 },
    };
    
    const weights = sessionWeights[segment] || sessionWeights.smallbusiness;
    const sessions = Math.floor(Math.random() * (weights.max - weights.min + 1)) + weights.min;
    const pageViews = Math.max(sessions, Math.floor(sessions * weights.avgPages * (0.8 + Math.random() * 0.4)));
    
    return { sessions, pageViews };
  }

  private selectTrafficSource(): string {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const [source, data] of Object.entries(TECHFLOW_PROFILE.acquisition)) {
      cumulative += data.weight;
      if (random <= cumulative) {
        return source;
      }
    }
    
    return 'organic';
  }

  private calculateTouchpointCount(segment: string): number {
    const touchpointRanges = {
      enterprise: { min: 8, max: 25 },
      midmarket: { min: 5, max: 18 },
      smallbusiness: { min: 3, max: 12 },
      freelancer: { min: 2, max: 8 },
    };
    
    const range = touchpointRanges[segment] || touchpointRanges.smallbusiness;
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  }

  private selectTechFlowPage(segment: string, touchpointIndex: number, totalTouchpoints: number): { type: string; specific: string } {
    const isFirstVisit = touchpointIndex === 0;
    const isEarlyJourney = touchpointIndex < totalTouchpoints * 0.3;
    const isMidJourney = touchpointIndex < totalTouchpoints * 0.7;
    const isLateJourney = touchpointIndex >= totalTouchpoints * 0.7;
    
    if (isFirstVisit) {
      // Landing pages based on traffic source and segment
      const landingPages = this.getLandingPagesForSegment(segment);
      return { type: 'landing', specific: landingPages[Math.floor(Math.random() * landingPages.length)] };
    }
    
    if (isEarlyJourney) {
      // Education and awareness phase
      const earlyPages = ['features', 'use-cases', 'about', 'blog', 'case-studies'];
      return { type: 'content', specific: earlyPages[Math.floor(Math.random() * earlyPages.length)] };
    }
    
    if (isMidJourney) {
      // Consideration phase - high-value pages
      const segmentPages = TECHFLOW_PROFILE.segments[segment].pages;
      return { type: 'highValue', specific: segmentPages[Math.floor(Math.random() * segmentPages.length)] };
    }
    
    if (isLateJourney) {
      // Decision phase - conversion pages
      const conversionPages = ['demo', 'free-trial', 'contact', 'consultation', 'pricing'];
      return { type: 'conversion', specific: conversionPages[Math.floor(Math.random() * conversionPages.length)] };
    }
    
    return { type: 'content', specific: 'features' };
  }

  private getLandingPagesForSegment(segment: string): string[] {
    const landingPages = {
      enterprise: ['home', 'enterprise', 'security', 'api-docs'],
      midmarket: ['home', 'features', 'pricing', 'case-studies'],
      smallbusiness: ['home', 'features', 'pricing', 'free-trial'],
      freelancer: ['home', 'pricing', 'free-trial', 'features'],
    };
    
    return landingPages[segment] || landingPages.smallbusiness;
  }

  private generateTechFlowPageUrl(type: string, specific: string): { url: string; title: string } {
    const baseUrl = DEMO_CONFIG.COMPANY.website;
    
    const pages: Record<string, { url: string; title: string }> = {
      // Landing pages
      home: { url: baseUrl, title: `${DEMO_CONFIG.COMPANY.name} - ${DEMO_CONFIG.COMPANY.description}` },
      features: { url: `${baseUrl}/features`, title: 'Features - AI-Powered Project Management' },
      pricing: { url: `${baseUrl}/pricing`, title: 'Pricing Plans - Start Free' },
      'use-cases': { url: `${baseUrl}/use-cases`, title: 'Use Cases - Project Management for African Teams' },
      about: { url: `${baseUrl}/about`, title: 'About TechFlow Solutions' },
      
      // High-value pages
      enterprise: { url: `${baseUrl}/enterprise`, title: 'Enterprise Solutions - Scale Your Business' },
      'api-docs': { url: `${baseUrl}/developers/api`, title: 'API Documentation - TechFlow Platform' },
      integrations: { url: `${baseUrl}/integrations`, title: 'Integrations - Connect Your Tools' },
      security: { url: `${baseUrl}/security`, title: 'Enterprise Security - SOC 2 Compliant' },
      
      // Conversion pages
      demo: { url: `${baseUrl}/demo`, title: 'Request Demo - See TechFlow in Action' },
      'free-trial': { url: `${baseUrl}/start-free-trial`, title: 'Start Free Trial - No Credit Card Required' },
      contact: { url: `${baseUrl}/contact`, title: 'Contact Sales - Get Custom Quote' },
      consultation: { url: `${baseUrl}/consultation`, title: 'Free Consultation - Strategic Planning' },
      
      // Content pages
      blog: { url: `${baseUrl}/blog`, title: 'Blog - Project Management Insights' },
      'case-studies': { url: `${baseUrl}/customers`, title: 'Customer Success Stories' },
      resources: { url: `${baseUrl}/resources`, title: 'Resources - Guides & Templates' },
      webinars: { url: `${baseUrl}/webinars`, title: 'Webinars - Master Project Management' },
    };
    
    return pages[specific] || pages.home;
  }

  /**
   * Generate TechFlow SaaS-specific forms
   */
  private async generateTechFlowForms(): Promise<any[]> {
    logger.info('📝 Generating TechFlow SaaS forms...');
    
    const forms = [
      {
        name: 'Request Demo',
        description: 'See TechFlow in action - personalized demo for your team',
        type: 'demo',
        segment: 'enterprise-midmarket',
        expectedSubmissions: 180,
        conversionRate: 18.5,
        avgDealSize: 35000,
      },
      {
        name: 'Start Free Trial',
        description: 'Try TechFlow free for 14 days - no credit card required',
        type: 'trial',
        segment: 'smallbusiness-freelancer',
        expectedSubmissions: 320,
        conversionRate: 25.2,
        avgDealSize: 8500,
      },
      {
        name: 'Contact Sales',
        description: 'Get a custom quote and speak with our African market experts',
        type: 'sales',
        segment: 'enterprise',
        expectedSubmissions: 95,
        conversionRate: 12.8,
        avgDealSize: 65000,
      },
      {
        name: 'Free Consultation',
        description: 'Strategic project management consultation for growing teams',
        type: 'consultation',
        segment: 'midmarket',
        expectedSubmissions: 45,
        conversionRate: 45.0,
        avgDealSize: 25000,
      },
      {
        name: 'Newsletter Signup',
        description: 'African project management insights and best practices',
        type: 'newsletter',
        segment: 'all',
        expectedSubmissions: 850,
        conversionRate: 35.7,
        avgDealSize: 0,
      },
      {
        name: 'Download Guide',
        description: 'Free guide: "Project Management for African Startups"',
        type: 'lead_magnet',
        segment: 'smallbusiness',
        expectedSubmissions: 290,
        conversionRate: 28.3,
        avgDealSize: 0,
      },
      {
        name: 'API Access Request',
        description: 'Request developer access to TechFlow Platform API',
        type: 'api',
        segment: 'enterprise',
        expectedSubmissions: 35,
        conversionRate: 8.2,
        avgDealSize: 45000,
      },
      {
        name: 'Support Request',
        description: 'Get help from our technical support team',
        type: 'support',
        segment: 'existing-customers',
        expectedSubmissions: 120,
        conversionRate: 18.4,
        avgDealSize: 0,
      },
    ];
    
    const createdForms = [];
    
    for (const formConfig of forms) {
      const form = await this.generateTechFlowForm(formConfig);
      createdForms.push(form);
    }
    
    // Create forms in database
    await prisma.leadPulseForm.createMany({
      data: createdForms,
      skipDuplicates: true,
    });
    
    logger.info(`✅ Generated ${createdForms.length} TechFlow SaaS forms`);
    return createdForms;
  }

  private async generateCustomerJourneySubmissions(visitors: any[], forms: any[]): Promise<void> {
    logger.info('📊 Generating customer journey submissions...');
    
    const allSubmissions = [];
    const allSubmissionData = [];
    
    for (const form of forms) {
      const formMetadata = JSON.parse(form.metadata);
      const expectedSubmissions = formMetadata.expectedSubmissions;
      const formSegment = formMetadata.segment;
      
      // Filter visitors by segment compatibility
      const eligibleVisitors = this.filterVisitorsBySegment(visitors, formSegment);
      const submissionCount = Math.floor(expectedSubmissions * (0.85 + Math.random() * 0.3)); // 85-115% of expected
      
      for (let i = 0; i < submissionCount; i++) {
        // Select visitor based on form type and segment
        const visitor = this.selectVisitorForForm(eligibleVisitors, form.type, formSegment);
        if (!visitor) continue;
        
        // Generate submission timing (during visitor's journey)
        const submissionTime = this.generateSubmissionTime(visitor, form.type);
        
        const submission = {
          id: faker.string.uuid(),
          formId: form.id,
          visitorId: visitor.fingerprint,
          status: this.selectSubmissionStatus(),
          submittedAt: submissionTime,
          metadata: JSON.stringify({
            userAgent: this.generateUserAgent(visitor.device, visitor.browser),
            ipAddress: this.generateIPAddress(JSON.parse(visitor.location).country),
            source: 'techflow_demo',
            formType: form.type,
            visitorSegment: JSON.parse(visitor.metadata).segment,
            completionTime: this.generateCompletionTime(form.type),
            conversionValue: formMetadata.avgDealSize,
          }),
          createdAt: submissionTime,
        };
        
        allSubmissions.push(submission);
        
        // Generate realistic field data
        const fields = JSON.parse(form.fields);
        for (const field of fields) {
          const fieldData = {
            submissionId: submission.id,
            fieldId: field.id,
            value: this.generateTechFlowFieldValue(field, formMetadata.segment),
            createdAt: submissionTime,
          };
          allSubmissionData.push(fieldData);
        }
        
        // Mark visitor as converted if high-value form
        if (['demo', 'sales', 'consultation', 'trial'].includes(form.type)) {
          visitor.isConverted = true;
          visitor.contactId = faker.string.uuid();
        }
      }
      
      logger.info(`✅ Generated ${submissionCount} submissions for ${form.name}`);
    }
    
    // Batch insert submissions
    if (allSubmissions.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < allSubmissions.length; i += batchSize) {
        const batch = allSubmissions.slice(i, i + batchSize);
        await prisma.leadPulseFormSubmission.createMany({
          data: batch,
          skipDuplicates: true,
        });
      }
      
      // Insert submission data
      for (let i = 0; i < allSubmissionData.length; i += batchSize) {
        const batch = allSubmissionData.slice(i, i + batchSize);
        await prisma.leadPulseSubmissionData.createMany({
          data: batch,
          skipDuplicates: true,
        });
      }
    }
    
    logger.info(`✅ Generated complete customer journey with ${allSubmissions.length} total submissions`);
  }

  private async generateTechFlowCRMData(): Promise<void> {
    logger.info('🔗 Generating TechFlow CRM integration story...');
    
    // Generate comprehensive CRM sync history showing growth
    const syncEvents = [];
    const totalSyncs = Math.floor(Math.random() * 800) + 600; // 600-1400 sync events
    
    // CRM adoption timeline (started 2 months ago, ramping up)
    const crmStartDate = new Date(this.endDate.getTime() - (60 * 24 * 60 * 60 * 1000)); // 60 days ago
    
    for (let i = 0; i < totalSyncs; i++) {
      const syncTime = faker.date.between({ from: crmStartDate, to: this.endDate });
      const platform = Math.random() < 0.7 ? 'salesforce' : 'hubspot'; // 70% Salesforce
      const operation = this.selectTechFlowCRMOperation();
      const isSuccess = Math.random() < 0.94; // 94% success rate
      
      const syncEvent = {
        id: faker.string.uuid(),
        userId: this.userId,
        platform,
        operation,
        status: isSuccess ? 'success' : 'error',
        recordsProcessed: isSuccess ? this.generateRecordsProcessed(operation) : 0,
        errorMessage: isSuccess ? null : this.generateTechFlowCRMError(operation),
        duration: Math.floor(Math.random() * 45000) + 2000, // 2-45 seconds
        metadata: JSON.stringify({
          company: DEMO_CONFIG.COMPANY.name,
          batchSize: Math.floor(Math.random() * 200) + 50,
          apiVersion: platform === 'salesforce' ? 'v58.0' : 'v3',
          rateLimitRemaining: Math.floor(Math.random() * 2000) + 1000,
          dataCenter: platform === 'salesforce' ? 'EU1' : 'EU-West',
          segmentProcessed: this.selectRandomSegment(),
        }),
        createdAt: syncTime,
      };
      
      syncEvents.push(syncEvent);
    }
    
    // Create comprehensive audit trail
    await prisma.leadPulseAuditLog.createMany({
      data: syncEvents.map(event => ({
        id: faker.string.uuid(),
        userId: this.userId,
        action: 'SYNC',
        resource: `crm_${event.platform}`,
        resourceId: event.id,
        details: JSON.stringify({
          operation: event.operation,
          status: event.status,
          recordsProcessed: event.recordsProcessed,
          duration: event.duration,
          platform: event.platform,
        }),
        metadata: event.metadata,
        createdAt: event.createdAt,
      })),
      skipDuplicates: true,
    });
    
    // Generate CRM success metrics
    const successMetrics = this.generateTechFlowCRMSuccessMetrics();
    
    logger.info(`✅ Generated ${totalSyncs} CRM sync events and success metrics`);
    logger.info(`📈 CRM Success: ${successMetrics.conversionIncrease} conversion increase`);
  }

  private async generateTechFlowIntegrations(): Promise<void> {
    logger.info('🚨 Generating TechFlow SaaS integrations...');
    
    // Generate webhook endpoints for SaaS integrations
    const integrationEndpoints = [
      {
        name: 'Slack Sales Alerts',
        url: 'https://hooks.slack.com/services/T12345/B67890/techflow_sales',
        events: ['visitor.converted', 'form.demo_submitted', 'lead.qualified'],
        platform: 'slack',
        isActive: true,
      },
      {
        name: 'Salesforce Lead Sync',
        url: 'https://techflow.my.salesforce.com/services/data/webhook/leadpulse',
        events: ['visitor.converted', 'form.submitted', 'lead.scored'],
        platform: 'salesforce',
        isActive: true,
      },
      {
        name: 'HubSpot Marketing Integration',
        url: 'https://api.hubapi.com/webhooks/v1/techflow/leadpulse',
        events: ['visitor.new', 'form.newsletter_submitted', 'visitor.qualified'],
        platform: 'hubspot',
        isActive: true,
      },
      {
        name: 'Zapier Automation Hub',
        url: 'https://hooks.zapier.com/hooks/catch/12345/techflow/',
        events: ['form.trial_submitted', 'visitor.enterprise_detected'],
        platform: 'zapier',
        isActive: true,
      },
      {
        name: 'Microsoft Teams Notifications',
        url: 'https://techflowsolutions.webhook.office.com/webhookb2/leadpulse',
        events: ['lead.high_value', 'form.consultation_submitted'],
        platform: 'teams',
        isActive: true,
      },
      {
        name: 'Custom Analytics Endpoint',
        url: 'https://analytics.techflowsolutions.com/api/leadpulse/webhook',
        events: ['visitor.new', 'visitor.converted', 'form.submitted'],
        platform: 'custom',
        isActive: false, // Testing phase
      },
    ];
    
    const webhookEndpoints = [];
    
    for (const config of integrationEndpoints) {
      const endpoint = {
        id: faker.string.uuid(),
        userId: this.userId,
        name: config.name,
        url: config.url,
        events: JSON.stringify(config.events),
        isActive: config.isActive,
        secret: faker.string.alphanumeric(32),
        metadata: JSON.stringify({
          company: DEMO_CONFIG.COMPANY.name,
          platform: config.platform,
          setupDate: faker.date.between({ from: this.startDate, to: this.endDate }).toISOString(),
          environment: 'production',
          version: '1.0',
        }),
        createdAt: faker.date.between({ from: this.startDate, to: this.endDate }),
      };
      
      webhookEndpoints.push(endpoint);
    }
    
    // Create webhook endpoints
    await prisma.webhookEndpoint.createMany({
      data: webhookEndpoints,
      skipDuplicates: true,
    });
    
    // Generate realistic webhook deliveries with SaaS patterns
    const deliveries = [];
    const totalDeliveries = Math.floor(Math.random() * 3000) + 2000; // 2000-5000 deliveries
    
    for (let i = 0; i < totalDeliveries; i++) {
      const endpoint = webhookEndpoints[Math.floor(Math.random() * webhookEndpoints.length)];
      const deliveryTime = faker.date.between({ from: this.startDate, to: this.endDate });
      const eventType = this.selectRandomFromArray(JSON.parse(endpoint.events));
      const isSuccess = Math.random() < 0.96; // 96% success rate for SaaS integrations
      
      const delivery = {
        id: faker.string.uuid(),
        endpointId: endpoint.id,
        eventType: eventType as string,
        payload: JSON.stringify(this.generateTechFlowWebhookPayload(eventType as string)),
        status: isSuccess ? 'delivered' : (Math.random() < 0.2 ? 'failed' : 'retrying'),
        attempts: isSuccess ? 1 : Math.floor(Math.random() * 4) + 1,
        lastAttemptAt: deliveryTime,
        nextRetryAt: isSuccess ? null : new Date(deliveryTime.getTime() + Math.random() * 1800000), // Within 30 min
        responseStatus: isSuccess ? (200 + Math.floor(Math.random() * 3)) : (400 + Math.floor(Math.random() * 100)),
        responseBody: isSuccess ? 'OK' : this.generateWebhookError(),
        duration: Math.floor(Math.random() * 3000) + 150, // 150ms - 3s for SaaS APIs
        metadata: JSON.stringify({
          userAgent: 'TechFlow-LeadPulse/1.2',
          signature: faker.string.alphanumeric(64),
          headers: {
            'Content-Type': 'application/json',
            'X-TechFlow-Event': eventType,
            'X-TechFlow-Timestamp': deliveryTime.toISOString(),
          },
        }),
        createdAt: deliveryTime,
      };
      
      deliveries.push(delivery);
    }
    
    // Batch insert deliveries
    const batchSize = 100;
    for (let i = 0; i < deliveries.length; i += batchSize) {
      const batch = deliveries.slice(i, i + batchSize);
      await prisma.webhookDelivery.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }
    
    logger.info(`✅ Generated ${webhookEndpoints.length} SaaS integrations and ${deliveries.length} webhook deliveries`);
  }

  private async generateTechFlowSuccessStory(): Promise<void> {
    logger.info('🎯 Generating TechFlow success story and growth metrics...');
    
    // Create comprehensive success story with realistic metrics
    const successStory = {
      company: DEMO_CONFIG.COMPANY.name,
      timeframe: '90 days',
      metricsGenerated: new Date().toISOString(),
      
      // Business Impact Metrics
      businessImpact: {
        leadGenerationIncrease: '127%',
        conversionRateImprovement: '89%',
        salesCycleReduction: '34%',
        revenueAttributed: '$2.1M',
        costPerLeadReduction: '56%',
        customerAcquisitionImprovement: '78%',
      },
      
      // Operational Efficiency
      operationalGains: {
        timesSavedPerWeek: '22 hours',
        manualTasksEliminated: '85%',
        dataAccuracyImprovement: '92%',
        reportingTimeReduction: '67%',
        teamProductivityIncrease: '43%',
      },
      
      // Platform Adoption & Usage
      platformMetrics: {
        activeUsers: 47,
        dailyActiveUsers: 34,
        featureAdoptionRate: '78%',
        integrationSuccessRate: '94%',
        userSatisfactionScore: 4.7,
        supportTicketReduction: '61%',
      },
      
      // African Market Insights
      marketInsights: {
        topPerformingRegion: 'Lagos, Nigeria',
        fastestGrowingSegment: 'Small Business',
        preferredIntegration: 'Slack + Salesforce',
        peakPerformanceHours: '10 AM - 4 PM WAT',
        mobileTrafficGrowth: '67%',
        localLanguageEngagement: '+23% (Hausa, Swahili)',
      },
      
      // Success Milestones
      milestones: [
        {
          date: '30 days',
          achievement: 'First enterprise deal closed from LeadPulse lead',
          value: '$65,000',
        },
        {
          date: '45 days',
          achievement: 'Achieved 25% of quarterly revenue target',
          value: '$425,000',
        },
        {
          date: '60 days',
          achievement: 'Expanded to 3 new African markets',
          value: '847 new leads',
        },
        {
          date: '75 days',
          achievement: 'Hit record monthly conversion rate',
          value: '5.2%',
        },
        {
          date: '90 days',
          achievement: 'Exceeded quarterly goals by 34%',
          value: '$2.1M pipeline',
        },
      ],
      
      // Customer Testimonials
      testimonials: [
        {
          person: 'Amara Okonkwo, CEO',
          quote: 'LeadPulse transformed how we understand our African customers. The insights are incredible.',
          metric: '89% conversion rate increase',
        },
        {
          person: 'David Mutua, Head of Sales',
          quote: 'We can now identify high-value prospects before they even fill out a form. Game changer.',
          metric: '34% shorter sales cycles',
        },
        {
          person: 'Sarah Mensah, Marketing Director',
          quote: 'The African market insights help us tailor our messaging perfectly for each region.',
          metric: '127% lead generation increase',
        },
      ],
      
      // Growth Trajectory
      growthTrajectory: {
        month1: { leads: 234, conversion: 2.1, revenue: 156000 },
        month2: { leads: 367, conversion: 3.2, revenue: 298000 },
        month3: { leads: 531, conversion: 3.8, revenue: 447000 },
        projectedMonth4: { leads: 678, conversion: 4.2, revenue: 589000 },
      },
    };
    
    // Store success story as audit log entry
    await prisma.leadPulseAuditLog.create({
      data: {
        id: faker.string.uuid(),
        userId: this.userId,
        action: 'SUCCESS_STORY',
        resource: 'demo_metrics',
        resourceId: 'techflow_success_90d',
        details: JSON.stringify({
          type: 'comprehensive_success_story',
          period: '90_days',
          generatedAt: new Date().toISOString(),
          metricsCount: Object.keys(successStory.businessImpact).length + Object.keys(successStory.operationalGains).length,
        }),
        metadata: JSON.stringify(successStory),
        createdAt: new Date(),
      },
    });
    
    logger.info('✅ Generated comprehensive TechFlow success story');
    logger.info(`📈 Key Highlights:`);
    logger.info(`   • Revenue Attributed: ${successStory.businessImpact.revenueAttributed}`);
    logger.info(`   • Lead Generation: +${successStory.businessImpact.leadGenerationIncrease}`);
    logger.info(`   • Conversion Rate: +${successStory.businessImpact.conversionRateImprovement}`);
    logger.info(`   • Time Saved: ${successStory.operationalGains.timesSavedPerWeek}`);
    logger.info(`   • User Satisfaction: ${successStory.platformMetrics.userSatisfactionScore}/5.0`);
  }

  // Helper methods that are missing but referenced in the implementation above
  private async generateTechFlowForm(config: any): Promise<any> {
    const fields = this.generateTechFlowFormFields(config.type);
    
    return {
      id: faker.string.uuid(),
      name: config.name,
      title: config.name,
      description: config.description,
      status: 'ACTIVE',
      theme: {
        primaryColor: '#3B82F6',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
      },
      settings: {
        successMessage: `Thank you for your interest in ${DEMO_CONFIG.COMPANY.name}!`,
        emailNotifications: true,
        autoResponder: { enabled: true },
      },
      userId: this.userId,
      createdAt: faker.date.between({ from: this.startDate, to: this.endDate }),
      // Store metadata in settings for compatibility
      metadata: {
        company: DEMO_CONFIG.COMPANY.name,
        type: config.type,
        segment: config.segment,
        expectedSubmissions: config.expectedSubmissions,
        expectedConversionRate: config.conversionRate,
        avgDealSize: config.avgDealSize,
      },
    };
  }

  private generateTechFlowFormFields(type: string): any[] {
    const baseFields = [
      { id: 'email', type: 'EMAIL', label: 'Email', required: true },
      { id: 'first_name', type: 'TEXT', label: 'First Name', required: true },
      { id: 'last_name', type: 'TEXT', label: 'Last Name', required: true },
    ];

    const typeFields = {
      demo: [...baseFields, { id: 'company', type: 'TEXT', label: 'Company', required: true }],
      trial: [...baseFields, { id: 'company', type: 'TEXT', label: 'Company', required: false }],
      sales: [...baseFields, { id: 'company', type: 'TEXT', label: 'Company', required: true }],
      consultation: [...baseFields, { id: 'company', type: 'TEXT', label: 'Company', required: true }],
      newsletter: [{ id: 'email', type: 'EMAIL', label: 'Email', required: true }],
      lead_magnet: [...baseFields.slice(0, 2)],
      api: [...baseFields, { id: 'company', type: 'TEXT', label: 'Company', required: true }],
      support: [...baseFields.slice(0, 2), { id: 'issue', type: 'TEXTAREA', label: 'Issue', required: true }],
    };

    return typeFields[type] || baseFields;
  }

  private filterVisitorsBySegment(visitors: any[], formSegment: string): any[] {
    if (formSegment === 'all') return visitors;
    if (formSegment === 'existing-customers') return visitors.filter(v => v.isConverted);
    
    return visitors.filter(visitor => {
      const metadata = JSON.parse(visitor.metadata);
      if (formSegment.includes('-')) {
        return formSegment.split('-').includes(metadata.segment);
      }
      return metadata.segment === formSegment;
    });
  }

  private selectVisitorForForm(visitors: any[], formType: string, formSegment: string): any {
    return visitors[Math.floor(Math.random() * visitors.length)] || null;
  }

  private generateSubmissionTime(visitor: any, formType: string): Date {
    const visitorTime = new Date(visitor.createdAt);
    const hoursDelay = Math.random() * 72; // 0-72 hours
    return new Date(visitorTime.getTime() + hoursDelay * 60 * 60 * 1000);
  }

  private generateCompletionTime(formType: string): number {
    return Math.floor(Math.random() * 300) + 30; // 30-330 seconds
  }

  private generateTechFlowFieldValue(field: any, segment: string): string {
    switch (field.type) {
      case 'EMAIL': return faker.internet.email();
      case 'TEXT': 
        if (field.id === 'first_name') return faker.person.firstName();
        if (field.id === 'last_name') return faker.person.lastName();
        if (field.id === 'company') return faker.company.name();
        return faker.lorem.word();
      case 'TEXTAREA': return faker.lorem.paragraph();
      default: return faker.lorem.word();
    }
  }

  private selectTechFlowCRMOperation(): string {
    const ops = ['contact_sync', 'deal_creation', 'lead_scoring', 'pipeline_update'];
    return ops[Math.floor(Math.random() * ops.length)];
  }

  private generateRecordsProcessed(operation: string): number {
    return Math.floor(Math.random() * 100) + 1;
  }

  private generateTechFlowCRMError(operation: string): string {
    const errors = ['API rate limit exceeded', 'Invalid field format', 'Duplicate record'];
    return errors[Math.floor(Math.random() * errors.length)];
  }

  private selectRandomSegment(): string {
    const segments = ['enterprise', 'midmarket', 'smallbusiness', 'freelancer'];
    return segments[Math.floor(Math.random() * segments.length)];
  }

  private generateTechFlowCRMSuccessMetrics(): any {
    return {
      conversionIncrease: '89%',
      salesCycleReduction: '34%',
      revenueAttribution: '$1.8M',
    };
  }

  private generateTechFlowWebhookPayload(eventType: string): any {
    return {
      event: eventType,
      timestamp: new Date().toISOString(),
      company: DEMO_CONFIG.COMPANY.name,
      data: { id: faker.string.uuid() }
    };
  }

  private selectTrafficSourceUrl(): string {
    const sources = {
      'google.com': 35,
      'linkedin.com': 25,
      'twitter.com': 15,
      'github.com': 10,
      'direct': 15
    };
    
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const [source, weight] of Object.entries(sources)) {
      cumulative += weight;
      if (random <= cumulative) {
        if (source === 'direct') return '';
        return `https://${source}/`;
      }
    }
    
    return '';
  }
}

export const demoDataGenerator = new DemoDataGenerator();