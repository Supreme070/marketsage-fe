import prisma from '@/lib/db/prisma';
import { randomUUID } from 'crypto';

// Sample journey data
const journeyTemplates = [
  {
    name: "Welcome Journey",
    description: "New customer welcome sequence with email and SMS touchpoints",
    isActive: true,
  },
  {
    name: "Lead Nurturing Journey", 
    description: "Convert leads to customers through educational content",
    isActive: true,
  },
  {
    name: "Re-engagement Journey",
    description: "Win back inactive customers with special offers",
    isActive: false,
  }
];

// Sample visitors data with touchpoints
const visitorTemplates = [
  {
    fingerprint: "fp_lagos_male_visitor",
    ipAddress: "154.113.162.45", // Lagos IP
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    referrer: "https://www.google.com/search?q=digital+marketing+nigeria",
    visitCount: 4,
    score: 85,
    engagementLevel: "HIGH",
    geo: { country: "Nigeria", city: "Lagos", region: "Lagos State" },
    device: { type: "desktop", browser: "Chrome", os: "Windows" },
    touchpoints: [
      { type: "pageview", url: "/home", timestamp: new Date("2023-05-18T09:15:00Z"), duration: 45 },
      { type: "click", url: "/services", timestamp: new Date("2023-05-18T09:16:00Z"), duration: 120, metadata: { elementType: "button", text: "Our Services" } },
      { type: "pageview", url: "/services/social-media-marketing", timestamp: new Date("2023-05-18T09:18:30Z"), duration: 210 },
      { type: "click", url: "/case-studies", timestamp: new Date("2023-05-18T09:22:00Z"), duration: 180, metadata: { elementType: "link", text: "Case Studies" } },
      { type: "pageview", url: "/case-studies/nigeria-retail", timestamp: new Date("2023-05-18T09:25:00Z"), duration: 240 },
      { type: "pageview", url: "/pricing", timestamp: new Date("2023-05-18T09:29:00Z"), duration: 300 },
      { type: "pageview", url: "/contact", timestamp: new Date("2023-05-18T09:34:00Z"), duration: 90 },
      { type: "form_view", url: "/contact", timestamp: new Date("2023-05-18T09:36:00Z"), duration: 120, metadata: { formId: "form_contact", formName: "Contact Form" } },
      { type: "pageview", url: "/thank-you", timestamp: new Date("2023-05-18T09:38:00Z"), duration: 40 },
      { type: "pageview", url: "/resources/social-media-guide", timestamp: new Date("2023-05-18T10:15:00Z"), duration: 420 },
      { type: "conversion", url: "/demo-booking-confirmed", timestamp: new Date("2023-05-18T10:22:00Z"), duration: 180, metadata: { formId: "form_demo", formName: "Demo Booking", value: 250.00 } }
    ]
  },
  {
    fingerprint: "fp_southafrica_female_visitor",
    ipAddress: "196.23.154.78", // South Africa IP
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
    referrer: "https://www.facebook.com/ads/",
    visitCount: 3,
    score: 76,
    engagementLevel: "MEDIUM",
    geo: { country: "South Africa", city: "Cape Town", region: "Western Cape" },
    device: { type: "desktop", browser: "Safari", os: "macOS" },
    touchpoints: [
      { type: "pageview", url: "/home", timestamp: new Date("2023-05-17T16:40:00Z"), duration: 60 },
      { type: "pageview", url: "/blog", timestamp: new Date("2023-05-17T16:41:30Z"), duration: 180 },
      { type: "pageview", url: "/blog/email-automation-trends-2023", timestamp: new Date("2023-05-17T16:44:40Z"), duration: 420 },
      { type: "click", url: "/services/email-marketing", timestamp: new Date("2023-05-17T16:51:30Z"), duration: 240, metadata: { elementType: "button", text: "Email Marketing" } },
      { type: "pageview", url: "/services/email-marketing", timestamp: new Date("2023-05-17T16:55:20Z"), duration: 180 },
      { type: "pageview", url: "/resources", timestamp: new Date("2023-05-17T16:58:50Z"), duration: 90 },
      { type: "form_view", url: "/resources/download-guide", timestamp: new Date("2023-05-17T17:00:30Z"), duration: 60, metadata: { formId: "form_guide", formName: "Resource Download Form" } },
      { type: "form_submit", url: "/resources/download-guide", timestamp: new Date("2023-05-17T17:01:50Z"), duration: 80, metadata: { formId: "form_guide", formName: "Resource Download Form" } }
    ]
  },
  {
    fingerprint: "fp_kenya_organization_visitor",
    ipAddress: "41.212.34.56", // Kenya IP
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36",
    referrer: "https://www.linkedin.com/company/marketsage/",
    visitCount: 7,
    score: 92,
    engagementLevel: "HIGH",
    geo: { country: "Kenya", city: "Nairobi", region: "Nairobi County" },
    device: { type: "desktop", browser: "Chrome", os: "Linux" },
    touchpoints: [
      { type: "pageview", url: "/home", timestamp: new Date("2023-05-16T11:00:00Z"), duration: 75 },
      { type: "click", url: "/enterprise", timestamp: new Date("2023-05-16T11:01:30Z"), duration: 180, metadata: { elementType: "button", text: "Enterprise Solutions" } },
      { type: "pageview", url: "/enterprise", timestamp: new Date("2023-05-16T11:04:30Z"), duration: 240 },
      { type: "pageview", url: "/enterprise/multi-channel-marketing", timestamp: new Date("2023-05-16T11:08:30Z"), duration: 300 },
      { type: "pageview", url: "/case-studies/east-africa", timestamp: new Date("2023-05-16T11:13:40Z"), duration: 420 },
      { type: "click", url: "/case-studies/kenya-telecom", timestamp: new Date("2023-05-16T11:20:50Z"), duration: 360, metadata: { elementType: "card", text: "Kenya Telecom Success Story" } },
      { type: "pageview", url: "/team", timestamp: new Date("2023-05-16T11:26:50Z"), duration: 180 },
      { type: "pageview", url: "/contact", timestamp: new Date("2023-05-16T11:30:00Z"), duration: 90 },
      { type: "form_view", url: "/enterprise-demo", timestamp: new Date("2023-05-16T11:31:45Z"), duration: 300, metadata: { formId: "form_enterprise", formName: "Enterprise Demo Request" } },
      { type: "form_submit", url: "/enterprise-demo", timestamp: new Date("2023-05-16T11:36:50Z"), duration: 240, metadata: { formId: "form_enterprise", formName: "Enterprise Demo Request" } },
      { type: "conversion", url: "/enterprise-subscription", timestamp: new Date("2023-05-20T14:00:00Z"), duration: 420, metadata: { formId: "form_subscription", formName: "Enterprise Subscription Form", value: 5000.00 } }
    ]
  }
];

export async function seedSampleJourneys(userId: string): Promise<boolean> {
  try {
    console.log("Creating sample visitor journeys...");
    
    let visitorCount = 0;
    let touchpointCount = 0;
    let journeyCount = 0;
    
    // Create sample visitors with their touchpoints
    for (const template of visitorTemplates) {
      // Check if visitor already exists
      const existingVisitor = await prisma.anonymousVisitor.findUnique({
        where: { fingerprint: template.fingerprint }
      });

      if (existingVisitor) {
        console.log(`Visitor with fingerprint ${template.fingerprint} already exists, skipping.`);
        continue;
      }

      // Create the visitor
      const visitor = await prisma.anonymousVisitor.create({
        data: {
          fingerprint: template.fingerprint,
          ipAddress: template.ipAddress,
          userAgent: template.userAgent,
          referrer: template.referrer,
          firstVisit: template.touchpoints[0].timestamp,
          lastVisit: template.touchpoints[template.touchpoints.length - 1].timestamp,
          visitCount: template.visitCount,
          score: template.score,
          engagementScore: template.score,
          city: template.geo.city,
          country: template.geo.country,
          region: template.geo.region
        }
      });
      
      visitorCount++;
      
      // Create touchpoints for this visitor
      for (const tp of template.touchpoints) {
        await prisma.leadPulseTouchpoint.create({
          data: {
            id: randomUUID(),
            visitorId: visitor.id,
            type: tp.type,
            url: tp.url,
            timestamp: tp.timestamp,
            duration: tp.duration,
            metadata: tp.metadata || {},
            score: Math.floor(Math.random() * 100)
          }
        });
        touchpointCount++;
      }
      
      // Create a journey for this visitor
      await prisma.leadPulseJourney.create({
        data: {
          id: randomUUID(),
          visitorId: visitor.id,
          startDate: template.touchpoints[0].timestamp,
          lastUpdate: template.touchpoints[template.touchpoints.length - 1].timestamp,
          stage: template.touchpoints.some(t => t.type === "conversion") ? "CONVERSION" : "CONSIDERATION",
          completionDate: template.touchpoints.some(t => t.type === "conversion") ? template.touchpoints[template.touchpoints.length - 1].timestamp : null,
          score: template.score,
          isCompleted: template.touchpoints.some(t => t.type === "conversion"),
          source: template.referrer
        }
      });
      journeyCount++;
    }
    
    console.log(`Successfully created ${visitorCount} visitors with ${touchpointCount} touchpoints and ${journeyCount} journeys`);
    return true;
    
  } catch (error) {
    console.error("Error in journey seeding:", error);
    return false;
  }
}

export default { seedSampleJourneys }; 