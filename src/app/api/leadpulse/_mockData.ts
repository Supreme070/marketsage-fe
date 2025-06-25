/**
 * Mock data for LeadPulse API endpoints
 * Used as fallbacks when database queries fail or for development
 */

export interface PulseDataPoint {
  timestamp: string;
  value: number;
  type: 'pageview' | 'click' | 'form_interaction' | 'conversion';
  url?: string;
  title?: string;
}

export interface VisitorJourney {
  id: string;
  visitorId: string;
  fingerprint: string;
  location?: string;
  device?: string;
  browser?: string;
  engagementScore: number;
  lastActive: string;
  pulseData: PulseDataPoint[];
}

export interface Touchpoint {
  id: string;
  timestamp: string;
  type: 'pageview' | 'click' | 'form_view' | 'form_start' | 'form_submit' | 'conversion';
  url: string;
  title?: string;
  duration?: number;
  formId?: string;
  formName?: string;
  conversionValue?: number;
}

export interface VisitorPath {
  visitorId: string;
  touchpoints: Touchpoint[];
  probability: number;
  predictedValue: number;
  status: 'active' | 'converted' | 'lost';
}

export interface InsightItem {
  id: string;
  type: 'behavior' | 'prediction' | 'opportunity' | 'trend';
  title: string;
  description: string;
  importance: 'low' | 'medium' | 'high';
  metric?: {
    label: string;
    value: number;
    format?: 'percentage' | 'currency' | 'number';
    change?: number;
  };
  recommendation?: string;
  createdAt: string;
}

export interface VisitorSegment {
  id: string;
  name: string;
  count: number;
  percentage: number;
  key: string;
}

/**
 * Generate mock visitor data
 */
export function generateMockVisitorData(): VisitorJourney[] {
  return [
    {
      id: 'v1',
      visitorId: 'v1',
      fingerprint: 'fp12345678abcdef',
      location: 'Lagos, Nigeria',
      device: 'Mobile, Chrome',
      browser: 'Chrome',
      engagementScore: 72,
      lastActive: '2 mins ago',
      pulseData: [
        { timestamp: '2023-05-17T14:00:00Z', value: 1, type: 'pageview', url: '/home', title: 'TechFlow Solutions - Home' },
        { timestamp: '2023-05-17T14:01:30Z', value: 2, type: 'click', url: '/solutions', title: 'TechFlow Solutions - AI Services' },
        { timestamp: '2023-05-17T14:03:00Z', value: 1, type: 'pageview', url: '/solutions/ai-intelligence', title: 'AI Intelligence Platform' },
        { timestamp: '2023-05-17T14:05:00Z', value: 3, type: 'form_interaction', url: '/contact', title: 'Contact TechFlow' },
        { timestamp: '2023-05-17T14:07:00Z', value: 5, type: 'conversion', url: '/demo-booking', title: 'Book TechFlow Demo' }
      ]
    },
    {
      id: 'v2',
      visitorId: 'v2',
      fingerprint: 'fp87654321fedcba',
      location: 'Abuja, Nigeria',
      device: 'Desktop, Safari',
      browser: 'Safari',
      engagementScore: 45,
      lastActive: '5 mins ago',
      pulseData: [
        { timestamp: '2023-05-17T13:50:00Z', value: 1, type: 'pageview', url: '/home', title: 'TechFlow Solutions - Home' },
        { timestamp: '2023-05-17T13:52:00Z', value: 1, type: 'pageview', url: '/about', title: 'About TechFlow Solutions' },
        { timestamp: '2023-05-17T13:55:00Z', value: 2, type: 'click', url: '/team', title: 'TechFlow Team' },
        { timestamp: '2023-05-17T13:59:00Z', value: 1, type: 'pageview', url: '/blog', title: 'TechFlow AI Insights Blog' }
      ]
    },
    {
      id: 'v3',
      visitorId: 'v3',
      fingerprint: 'fp13579aceg24680',
      location: 'Accra, Ghana',
      device: 'Tablet, Chrome',
      browser: 'Chrome',
      engagementScore: 63,
      lastActive: '12 mins ago',
      pulseData: [
        { timestamp: '2023-05-17T13:40:00Z', value: 1, type: 'pageview', url: '/home', title: 'TechFlow Solutions - Home' },
        { timestamp: '2023-05-17T13:42:00Z', value: 2, type: 'click', url: '/solutions', title: 'TechFlow AI Solutions' },
        { timestamp: '2023-05-17T13:44:00Z', value: 1, type: 'pageview', url: '/solutions/leadpulse', title: 'LeadPulse Analytics by TechFlow' },
        { timestamp: '2023-05-17T13:46:00Z', value: 3, type: 'form_interaction', url: '/contact', title: 'Contact TechFlow' }
      ]
    },
    // Nigerian Enterprise CEO - AI Analytics focus
    {
      id: 'lagos_ceo',
      visitorId: 'lagos_ceo',
      fingerprint: 'fp24680acegi13579',
      location: 'Lagos, Nigeria',
      device: 'Mobile, Chrome',
      browser: 'Chrome',
      engagementScore: 89,
      lastActive: '1 hour ago',
      pulseData: [
        { timestamp: '2023-05-18T09:15:00Z', value: 1, type: 'pageview', url: '/home', title: 'TechFlow Solutions - Home' },
        { timestamp: '2023-05-18T09:16:00Z', value: 2, type: 'click', url: '/solutions', title: 'TechFlow AI Solutions' },
        { timestamp: '2023-05-18T09:18:30Z', value: 1, type: 'pageview', url: '/solutions/ai-intelligence', title: 'AI Intelligence Platform' },
        { timestamp: '2023-05-18T09:29:00Z', value: 1, type: 'pageview', url: '/pricing', title: 'TechFlow Pricing - Nigerian Market' },
        { timestamp: '2023-05-18T09:36:00Z', value: 4, type: 'form_interaction', url: '/contact', title: 'Contact TechFlow Sales' },
        { timestamp: '2023-05-18T10:22:00Z', value: 5, type: 'conversion', url: '/enterprise-demo-confirmed', title: 'TechFlow Enterprise Demo Confirmed' }
      ]
    },
    // South African Startup Founder - AI Analytics & Automation focus
    {
      id: 'capetown_founder',
      visitorId: 'capetown_founder',
      fingerprint: 'fp97531zxcvb24680',
      location: 'Cape Town, South Africa',
      device: 'Desktop, Firefox',
      browser: 'Firefox',
      engagementScore: 76,
      lastActive: '3 hours ago',
      pulseData: [
        { timestamp: '2023-05-17T16:40:00Z', value: 1, type: 'pageview', url: '/home', title: 'TechFlow Solutions - Home' },
        { timestamp: '2023-05-17T16:44:40Z', value: 3, type: 'pageview', url: '/blog/ai-analytics-trends-africa-2023', title: 'AI Analytics Trends in Africa 2023' },
        { timestamp: '2023-05-17T16:55:20Z', value: 2, type: 'pageview', url: '/solutions/leadpulse', title: 'LeadPulse Analytics Platform' },
        { timestamp: '2023-05-17T17:01:50Z', value: 4, type: 'form_interaction', url: '/resources/download-guide', title: 'Download AI Analytics Guide' },
        { timestamp: '2023-05-19T14:30:00Z', value: 1, type: 'pageview', url: '/pricing', title: 'TechFlow Pricing - African Markets' },
        { timestamp: '2023-05-19T14:35:50Z', value: 5, type: 'conversion', url: '/trial-signup', title: 'TechFlow Free Trial Sign-up' }
      ]
    },
    // Kenyan Bank CTO - Enterprise AI Solutions focus
    {
      id: 'nairobi_bank_cto',
      visitorId: 'nairobi_bank_cto',
      fingerprint: 'fp86420qwerty97531',
      location: 'Nairobi, Kenya',
      device: 'Desktop, Chrome',
      browser: 'Chrome',
      engagementScore: 92,
      lastActive: '2 days ago',
      pulseData: [
        { timestamp: '2023-05-16T11:00:00Z', value: 1, type: 'pageview', url: '/home', title: 'TechFlow Solutions - Home' },
        { timestamp: '2023-05-16T11:04:30Z', value: 2, type: 'pageview', url: '/enterprise', title: 'TechFlow Enterprise AI Solutions' },
        { timestamp: '2023-05-16T11:13:40Z', value: 3, type: 'pageview', url: '/case-studies/african-banks', title: 'African Banking AI Case Studies' },
        { timestamp: '2023-05-16T11:36:50Z', value: 4, type: 'form_interaction', url: '/enterprise-demo', title: 'Request TechFlow Enterprise Demo' },
        { timestamp: '2023-05-18T09:33:30Z', value: 3, type: 'pageview', url: '/resources/white-papers/ai-banking-africa', title: 'AI in African Banking 2023' },
        { timestamp: '2023-05-18T09:56:20Z', value: 4, type: 'form_interaction', url: '/contact', title: 'Contact TechFlow Enterprise' },
        { timestamp: '2023-05-20T14:00:00Z', value: 5, type: 'conversion', url: '/enterprise-subscription', title: 'TechFlow Enterprise AI Subscription' }
      ]
    }
  ];
}

/**
 * Generate mock journey data
 */
export function generateMockJourneyData(visitorId?: string): VisitorPath[] {
  const journeys: VisitorPath[] = [
    {
      visitorId: 'v1',
      touchpoints: [
        { id: 't1', timestamp: '2023-05-17T14:00:00Z', type: 'pageview', url: '/home', title: 'Home Page', duration: 90 },
        { id: 't2', timestamp: '2023-05-17T14:01:30Z', type: 'click', url: '/products', title: 'Products Page', duration: 120 },
        { id: 't3', timestamp: '2023-05-17T14:03:00Z', type: 'pageview', url: '/products/1', title: 'Product Detail', duration: 180 },
        { id: 't4', timestamp: '2023-05-17T14:05:00Z', type: 'form_view', url: '/contact', title: 'Contact Form', formId: 'form1', formName: 'Contact Us', duration: 120 },
        { id: 't5', timestamp: '2023-05-17T14:07:00Z', type: 'form_submit', url: '/checkout', title: 'Checkout', formId: 'form2', formName: 'Order Form', duration: 60, conversionValue: 199.99 }
      ],
      probability: 0.82,
      predictedValue: 199.99,
      status: 'converted'
    },
    {
      visitorId: 'v2',
      touchpoints: [
        { id: 't6', timestamp: '2023-05-17T13:50:00Z', type: 'pageview', url: '/home', title: 'Home Page', duration: 120 },
        { id: 't7', timestamp: '2023-05-17T13:52:00Z', type: 'pageview', url: '/about', title: 'About Us', duration: 180 },
        { id: 't8', timestamp: '2023-05-17T13:55:00Z', type: 'click', url: '/team', title: 'Our Team', duration: 90 },
        { id: 't9', timestamp: '2023-05-17T13:59:00Z', type: 'pageview', url: '/blog', title: 'Blog', duration: 300 }
      ],
      probability: 0.35,
      predictedValue: 49.99,
      status: 'active'
    },
    // Male from Lagos, Nigeria - Social Media Marketing focus
    {
      visitorId: 'lagos_male',
      touchpoints: [
        { id: 'lm_t1', timestamp: '2023-05-18T09:15:00Z', type: 'pageview', url: '/home', title: 'Home Page', duration: 45 },
        { id: 'lm_t2', timestamp: '2023-05-18T09:16:00Z', type: 'click', url: '/services', title: 'Our Services', duration: 120 },
        { id: 'lm_t3', timestamp: '2023-05-18T09:18:30Z', type: 'pageview', url: '/services/social-media-marketing', title: 'Social Media Marketing Services', duration: 210 },
        { id: 'lm_t4', timestamp: '2023-05-18T09:22:00Z', type: 'click', url: '/case-studies', title: 'Case Studies', duration: 180 },
        { id: 'lm_t5', timestamp: '2023-05-18T09:25:00Z', type: 'pageview', url: '/case-studies/nigeria-retail', title: 'Nigerian Retail Success Story', duration: 240 },
        { id: 'lm_t6', timestamp: '2023-05-18T09:29:00Z', type: 'pageview', url: '/pricing', title: 'Service Pricing', duration: 300 },
        { id: 'lm_t7', timestamp: '2023-05-18T09:34:00Z', type: 'form_view', url: '/contact', title: 'Contact Us', formId: 'form_contact', formName: 'Contact Form', duration: 90 },
        { id: 'lm_t8', timestamp: '2023-05-18T09:36:00Z', type: 'form_submit', url: '/contact', title: 'Contact Us', formId: 'form_contact', formName: 'Contact Form', duration: 120 },
        { id: 'lm_t9', timestamp: '2023-05-18T09:38:00Z', type: 'pageview', url: '/thank-you', title: 'Thank You Page', duration: 40 },
        { id: 'lm_t10', timestamp: '2023-05-18T10:15:00Z', type: 'pageview', url: '/resources/social-media-guide', title: 'Social Media Marketing Guide', duration: 420 },
        { id: 'lm_t11', timestamp: '2023-05-18T10:22:00Z', type: 'conversion', url: '/demo-booking-confirmed', title: 'Demo Booking Confirmation', formId: 'form_demo', formName: 'Demo Booking Form', duration: 180, conversionValue: 250.00 }
      ],
      probability: 0.89,
      predictedValue: 250.00,
      status: 'converted'
    },
    // Female from South Africa - Email Marketing & Automation focus
    {
      visitorId: 'southafrica_female',
      touchpoints: [
        { id: 'sf_t1', timestamp: '2023-05-17T16:40:00Z', type: 'pageview', url: '/home', title: 'Home Page', duration: 60 },
        { id: 'sf_t2', timestamp: '2023-05-17T16:41:30Z', type: 'pageview', url: '/blog', title: 'Marketing Blog', duration: 180 },
        { id: 'sf_t3', timestamp: '2023-05-17T16:44:40Z', type: 'pageview', url: '/blog/email-automation-trends-2023', title: 'Email Automation Trends 2023', duration: 420 },
        { id: 'sf_t4', timestamp: '2023-05-17T16:51:30Z', type: 'click', url: '/services/email-marketing', title: 'Email Marketing Services', duration: 240 },
        { id: 'sf_t5', timestamp: '2023-05-17T16:55:20Z', type: 'pageview', url: '/services/email-marketing', title: 'Email Marketing Services', duration: 180 },
        { id: 'sf_t6', timestamp: '2023-05-17T16:58:50Z', type: 'pageview', url: '/resources', title: 'Marketing Resources', duration: 90 },
        { id: 'sf_t7', timestamp: '2023-05-17T17:00:30Z', type: 'form_view', url: '/resources/download-guide', title: 'Download Email Marketing Guide', formId: 'form_guide', formName: 'Resource Download Form', duration: 60 },
        { id: 'sf_t8', timestamp: '2023-05-17T17:01:50Z', type: 'form_submit', url: '/resources/download-guide', title: 'Download Email Marketing Guide', formId: 'form_guide', formName: 'Resource Download Form', duration: 80 },
        { id: 'sf_t9', timestamp: '2023-05-19T14:20:00Z', type: 'pageview', url: '/home', title: 'Home Page', duration: 30 },
        { id: 'sf_t10', timestamp: '2023-05-19T14:20:45Z', type: 'pageview', url: '/services/marketing-automation', title: 'Marketing Automation Services', duration: 300 },
        { id: 'sf_t11', timestamp: '2023-05-19T14:25:50Z', type: 'pageview', url: '/case-studies/south-africa-ecommerce', title: 'South African E-commerce Success Story', duration: 240 },
        { id: 'sf_t12', timestamp: '2023-05-19T14:30:00Z', type: 'pageview', url: '/pricing', title: 'Service Pricing', duration: 180 },
        { id: 'sf_t13', timestamp: '2023-05-19T14:33:20Z', type: 'form_view', url: '/trial-signup', title: 'Free Trial Sign-up', formId: 'form_trial', formName: 'Free Trial Form', duration: 120 },
        { id: 'sf_t14', timestamp: '2023-05-19T14:35:50Z', type: 'form_submit', url: '/trial-signup', title: 'Free Trial Sign-up', formId: 'form_trial', formName: 'Free Trial Form', duration: 150, conversionValue: 99.00 }
      ],
      probability: 0.76,
      predictedValue: 350.00,
      status: 'active'
    },
    // Organization from Kenya - Enterprise Marketing Solutions focus
    {
      visitorId: 'kenya_organization',
      touchpoints: [
        { id: 'ko_t1', timestamp: '2023-05-16T11:00:00Z', type: 'pageview', url: '/home', title: 'Home Page', duration: 75 },
        { id: 'ko_t2', timestamp: '2023-05-16T11:01:30Z', type: 'click', url: '/enterprise', title: 'Enterprise Solutions', duration: 180 },
        { id: 'ko_t3', timestamp: '2023-05-16T11:04:30Z', type: 'pageview', url: '/enterprise', title: 'Enterprise Solutions', duration: 240 },
        { id: 'ko_t4', timestamp: '2023-05-16T11:08:30Z', type: 'pageview', url: '/enterprise/multi-channel-marketing', title: 'Multi-Channel Marketing Platform', duration: 300 },
        { id: 'ko_t5', timestamp: '2023-05-16T11:13:40Z', type: 'pageview', url: '/case-studies/east-africa', title: 'East African Enterprise Case Studies', duration: 420 },
        { id: 'ko_t6', timestamp: '2023-05-16T11:20:50Z', type: 'click', url: '/case-studies/kenya-telecom', title: 'Kenya Telecom Success Story', duration: 360 },
        { id: 'ko_t7', timestamp: '2023-05-16T11:26:50Z', type: 'pageview', url: '/team', title: 'Our Team', duration: 180 },
        { id: 'ko_t8', timestamp: '2023-05-16T11:30:00Z', type: 'pageview', url: '/contact', title: 'Contact Us', duration: 90 },
        { id: 'ko_t9', timestamp: '2023-05-16T11:31:45Z', type: 'form_view', url: '/enterprise-demo', title: 'Request Enterprise Demo', formId: 'form_enterprise', formName: 'Enterprise Demo Request', duration: 300 },
        { id: 'ko_t10', timestamp: '2023-05-16T11:36:50Z', type: 'form_submit', url: '/enterprise-demo', title: 'Request Enterprise Demo', formId: 'form_enterprise', formName: 'Enterprise Demo Request', duration: 240 },
        { id: 'ko_t11', timestamp: '2023-05-18T09:30:00Z', type: 'pageview', url: '/resources/white-papers', title: 'Marketing White Papers', duration: 180 },
        { id: 'ko_t12', timestamp: '2023-05-18T09:33:30Z', type: 'pageview', url: '/resources/white-papers/african-market-analysis', title: 'African Market Analysis 2023', duration: 600 },
        { id: 'ko_t13', timestamp: '2023-05-18T09:43:40Z', type: 'pageview', url: '/pricing/enterprise', title: 'Enterprise Pricing', duration: 360 },
        { id: 'ko_t14', timestamp: '2023-05-18T09:49:50Z', type: 'pageview', url: '/contact', title: 'Contact Us', duration: 120 },
        { id: 'ko_t15', timestamp: '2023-05-18T09:52:00Z', type: 'form_view', url: '/contact', title: 'Contact Us', formId: 'form_contact', formName: 'Contact Form', duration: 240 },
        { id: 'ko_t16', timestamp: '2023-05-18T09:56:20Z', type: 'form_submit', url: '/contact', title: 'Contact Us', formId: 'form_contact', formName: 'Contact Form', duration: 180 },
        { id: 'ko_t17', timestamp: '2023-05-20T14:00:00Z', type: 'conversion', url: '/enterprise-subscription', title: 'Enterprise Subscription Confirmation', formId: 'form_subscription', formName: 'Enterprise Subscription Form', duration: 420, conversionValue: 5000.00 }
      ],
      probability: 0.92,
      predictedValue: 5000.00,
      status: 'converted'
    }
  ];
  
  if (visitorId) {
    return journeys.filter(journey => journey.visitorId === visitorId);
  }
  
  return journeys;
}

/**
 * Generate mock insight data
 */
export function generateMockInsightData(): InsightItem[] {
  return [
    {
      id: 'i1',
      type: 'behavior',
      title: 'High engagement on TechFlow AI Intelligence page',
      description: 'Nigerian enterprises are spending 3x more time on the AI Intelligence platform page, indicating strong market interest.',
      importance: 'high',
      metric: {
        label: 'Avg. Session Duration',
        value: 4.2,
        format: 'number',
        change: 25.8
      },
      recommendation: 'Add WhatsApp contact button and Nigerian payment methods to capitalize on interest.',
      createdAt: '2023-05-16T12:00:00Z'
    },
    {
      id: 'i2',
      type: 'opportunity',
      title: 'African market WhatsApp preference',
      description: 'TechFlow visitors from Nigeria, Kenya, and South Africa show 60% higher engagement when WhatsApp contact is available.',
      importance: 'medium',
      metric: {
        label: 'WhatsApp Engagement',
        value: 60.3,
        format: 'percentage',
        change: 18.7
      },
      recommendation: 'Integrate WhatsApp Business API across all TechFlow solution pages.',
      createdAt: '2023-05-16T10:30:00Z'
    },
    {
      id: 'i3',
      type: 'prediction',
      title: 'TechFlow Enterprise deals forecasted',
      description: 'AI analysis predicts 3 enterprise clients from Nigeria and Kenya will convert within 30 days based on engagement patterns.',
      importance: 'medium',
      metric: {
        label: 'Predicted Revenue (₦)',
        value: 850000,
        format: 'currency',
        change: 32.4
      },
      createdAt: '2023-05-15T16:45:00Z'
    },
    {
      id: 'i4',
      type: 'trend',
      title: 'African fintech interest surge',
      description: 'TechFlow AI solutions show 45% increased interest from African fintech companies seeking intelligent analytics.',
      importance: 'low',
      metric: {
        label: 'Fintech Traffic',
        value: 45.2,
        format: 'percentage',
        change: 28.6
      },
      recommendation: 'Create dedicated TechFlow fintech case studies and African payment integration guides.',
      createdAt: '2023-05-14T09:15:00Z'
    }
  ];
}

/**
 * Generate mock segment data
 */
export function generateMockSegmentData(): VisitorSegment[] {
  return [
    {
      id: 's1',
      name: 'Nigerian Enterprise Clients',
      count: 89,
      percentage: 32.1,
      key: 'nigerian_enterprise'
    },
    {
      id: 's2',
      name: 'African Fintech Startups',
      count: 67,
      percentage: 24.2,
      key: 'african_fintech'
    },
    {
      id: 's3',
      name: 'AI Intelligence Prospects',
      count: 134,
      percentage: 48.4,
      key: 'ai_prospects'
    },
    {
      id: 's4',
      name: 'TechFlow Demo Attendees',
      count: 52,
      percentage: 18.8,
      key: 'demo_attendees'
    },
    {
      id: 's5',
      name: 'LeadPulse Trial Users',
      count: 78,
      percentage: 28.2,
      key: 'leadpulse_users'
    }
  ];
} 