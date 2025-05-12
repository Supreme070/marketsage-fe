import { PrismaClient, CampaignStatus } from "@prisma/client";
import * as dotenv from "dotenv";
import { randomUUID } from "crypto";

// Load environment variables
dotenv.config();

// Create Prisma client with direct connection to database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://marketsage:marketsage_password@db:5432/marketsage?schema=public"
    }
  }
});

// Sample email templates data
const sampleTemplates = [
  {
    name: "Welcome Email",
    description: "Email sent to welcome new subscribers",
    subject: "Welcome to MarketSage!",
    content: "<h1>Welcome to MarketSage!</h1><p>Thank you for subscribing to our newsletter. We're excited to have you on board!</p>",
    previewText: "Welcome to the MarketSage community",
    category: "Onboarding",
  },
  {
    name: "Monthly Newsletter",
    description: "Regular monthly newsletter template",
    subject: "MarketSage Monthly Updates",
    content: "<h1>Monthly Newsletter</h1><p>Here are the latest updates from MarketSage this month.</p>",
    previewText: "Check out what's new this month",
    category: "Newsletter",
  },
  {
    name: "Product Announcement",
    description: "Template for announcing new products or features",
    subject: "Exciting New Features Just Launched!",
    content: "<h1>New Features Available!</h1><p>We're excited to announce our latest features that will help you grow your business.</p>",
    previewText: "Check out our latest product updates",
    category: "Marketing",
  }
];

// Sample email campaigns data
const sampleCampaigns = [
  {
    name: "Welcome Campaign",
    description: "First welcome email for new subscribers",
    subject: "Welcome to MarketSage!",
    from: "marketing@marketsage.com",
    replyTo: "support@marketsage.com",
    status: CampaignStatus.DRAFT,
  },
  {
    name: "June Newsletter",
    description: "Monthly newsletter for June 2023",
    subject: "MarketSage June Updates",
    from: "newsletter@marketsage.com",
    replyTo: "marketing@marketsage.com",
    status: CampaignStatus.SCHEDULED,
    scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  },
  {
    name: "Product Launch",
    description: "Announcement for new dashboard features",
    subject: "New Dashboard Features Available Now!",
    from: "updates@marketsage.com",
    replyTo: "support@marketsage.com",
    status: CampaignStatus.SENT,
    sentAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
  }
];

async function seedEmailMarketing() {
  console.log("Starting to seed email marketing data...");

  // Get the first admin user
  let adminUser = await prisma.user.findFirst({
    where: {
      role: "ADMIN",
    },
  });

  if (!adminUser) {
    adminUser = await prisma.user.findFirst({});

    if (!adminUser) {
      console.error("No users found in the database. Please create a user first.");
      return;
    }
  }

  console.log(`Using user ${adminUser.email} (${adminUser.id}) as the creator.`);

  // Create email templates
  const createdTemplates = [];
  for (const templateData of sampleTemplates) {
    try {
      const now = new Date();
      const template = await prisma.emailTemplate.create({
        data: {
          id: randomUUID(),
          name: templateData.name,
          description: templateData.description,
          subject: templateData.subject,
          content: templateData.content,
          previewText: templateData.previewText,
          category: templateData.category,
          createdById: adminUser.id,
          createdAt: now,
          updatedAt: now
        },
      });
      createdTemplates.push(template);
      console.log(`Created email template: ${template.name} (${template.id})`);
    } catch (error) {
      console.error(`Error creating email template "${templateData.name}":`, error);
    }
  }

  // Get lists for campaigns
  const lists = await prisma.list.findMany({
    take: 3,
  });

  if (lists.length === 0) {
    console.log("No lists found. Consider running seedLists.ts first.");
  } else {
    console.log(`Found ${lists.length} lists to use for campaigns.`);
  }

  // Get segments for campaigns
  const segments = await prisma.segment.findMany({
    take: 2,
  });

  if (segments.length === 0) {
    console.log("No segments found. Consider creating segments first.");
  } else {
    console.log(`Found ${segments.length} segments to use for campaigns.`);
  }

  // Create email campaigns
  const createdCampaigns = [];
  for (let i = 0; i < sampleCampaigns.length; i++) {
    const campaignData = sampleCampaigns[i];
    
    try {
      // Use the corresponding template if available
      const templateToUse = createdTemplates[i] || null;
      
      // Determine which lists to use (alternate between available lists)
      const listsToUse = lists.filter((_, index) => index % (i + 1) === 0);
      
      // Create the campaign
      const now = new Date();
      const campaign = await prisma.emailCampaign.create({
        data: {
          id: randomUUID(),
          name: campaignData.name,
          description: campaignData.description,
          subject: campaignData.subject,
          from: campaignData.from,
          replyTo: campaignData.replyTo,
          status: campaignData.status,
          scheduledFor: campaignData.scheduledFor,
          sentAt: campaignData.sentAt,
          createdById: adminUser.id,
          createdAt: now,
          updatedAt: now,
          ...(templateToUse ? { templateId: templateToUse.id } : {}),
          ...(listsToUse.length > 0 ? {
            List: {
              connect: listsToUse.map(list => ({ id: list.id })),
            },
          } : {}),
          ...(segments.length > 0 && i === 2 ? { // Only connect segments to the third campaign
            Segment: {
              connect: segments.map(segment => ({ id: segment.id })),
            },
          } : {}),
        },
      });
      
      createdCampaigns.push(campaign);
      console.log(`Created email campaign: ${campaign.name} (${campaign.id})`);
      
      // If the campaign is marked as sent, create some email activities for it
      if (campaign.status === CampaignStatus.SENT) {
        // Get some contacts to create activities for
        const contacts = await prisma.contact.findMany({
          take: 20,
        });
        
        if (contacts.length > 0) {
          for (const contact of contacts) {
            // Create random email activities
            const activityType = Math.random() > 0.7 ? "OPENED" : 
                                Math.random() > 0.5 ? "DELIVERED" : 
                                Math.random() > 0.3 ? "CLICKED" : "SENT";
            
            await prisma.emailActivity.create({
              data: {
                id: randomUUID(),
                campaignId: campaign.id,
                contactId: contact.id,
                type: activityType,
                timestamp: new Date(Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000),
              },
            });
          }
          
          console.log(`Created email activities for ${contacts.length} contacts.`);
        }
      }
    } catch (error) {
      console.error(`Error creating email campaign "${campaignData.name}":`, error);
    }
  }

  console.log(`Successfully created ${createdTemplates.length} email templates and ${createdCampaigns.length} email campaigns.`);

  await prisma.$disconnect();
}

// Run the seed function
seedEmailMarketing()
  .catch((error) => {
    console.error("Error running seed script:", error);
    process.exit(1);
  })
  .finally(() => {
    console.log("Email marketing data seeding complete.");
  }); 