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

// Sample campaign data
const sampleCampaigns = [
  {
    name: "Welcome Series Kickoff",
    description: "First message in our welcome sequence for new customers",
    from: "+15551234567",
    status: CampaignStatus.DRAFT,
    scheduledFor: null, // Not scheduled yet
  },
  {
    name: "June Promotion Announcement",
    description: "Announcing our summer sale with special discounts",
    from: "+15551234567",
    status: CampaignStatus.SCHEDULED,
    scheduledFor: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
  },
  {
    name: "Order Confirmation Updates",
    description: "Automatic order confirmation for all new orders",
    from: "+15551234567",
    status: CampaignStatus.SENT,
    scheduledFor: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  },
  {
    name: "Appointment Reminder Service",
    description: "Automatic appointment reminders for scheduled consultations",
    from: "+15551234567",
    status: CampaignStatus.SCHEDULED,
    scheduledFor: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
  },
  {
    name: "Support Ticket Update System",
    description: "Automated updates for customer support tickets",
    from: "+15551234567",
    status: CampaignStatus.DRAFT,
    scheduledFor: null, // Not scheduled yet
  }
];

async function main() {
  try {
    console.log("Starting WhatsApp campaigns seeding process...");

    // Get admin user for association
    const adminUser = await prisma.user.findFirst({
      where: {
        role: "ADMIN"
      }
    });

    if (!adminUser) {
      throw new Error("Admin user not found. Create at least one admin user before running this script.");
    }

    // Get templates for use in campaigns
    const templates = await prisma.whatsAppTemplate.findMany({
      where: {
        status: "APPROVED"
      }
    });
    
    if (templates.length === 0) {
      console.warn("No WhatsApp templates found. Run seedWhatsAppTemplates.ts first.");
    }

    // Get lists and segments for association
    const lists = await prisma.list.findMany({
      take: 3
    });
    
    if (lists.length === 0) {
      console.warn("No lists found. Run seedLists.ts first.");
    }
    
    const segments = await prisma.segment.findMany({
      take: 2
    });

    // Create WhatsApp campaigns
    const createdCampaigns = [];
    for (let i = 0; i < sampleCampaigns.length; i++) {
      try {
        const campaignData = sampleCampaigns[i];
        const now = new Date();
        
        // Use template for some campaigns and custom content for others
        const templateToUse = i < templates.length ? templates[i] : null;
        
        // Use different lists for different campaigns
        const listsToUse = lists.slice(0, Math.min(lists.length, i + 1));
        
        const campaign = await prisma.whatsAppCampaign.create({
          data: {
            id: randomUUID(),
            name: campaignData.name,
            description: campaignData.description,
            from: campaignData.from,
            content: templateToUse ? null : `Hello! This is a custom WhatsApp message for campaign ${i + 1}.`,
            status: campaignData.status,
            scheduledFor: campaignData.scheduledFor,
            sentAt: campaignData.sentAt,
            createdAt: now,
            updatedAt: now,
            createdById: adminUser.id,
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
          include: {
            WhatsAppTemplate: true,
            List: true,
            Segment: true,
          },
        });
        
        createdCampaigns.push(campaign);
        console.log(`Created WhatsApp campaign: ${campaign.name} (${campaign.id})`);
        
        // For "SENT" campaigns, create some activities
        if (campaign.status === "SENT") {
          const contacts = await prisma.contact.findMany({
            take: 5,
          });
          
          if (contacts.length > 0) {
            console.log(`Creating activities for campaign: ${campaign.name}`);
            
            for (const contact of contacts) {
              // Create a "SENT" activity for each contact
              await prisma.whatsAppActivity.create({
                data: {
                  id: randomUUID(),
                  campaignId: campaign.id,
                  contactId: contact.id,
                  type: "SENT",
                  timestamp: campaign.sentAt || now,
                  metadata: JSON.stringify({
                    messageId: `msg_${randomUUID().split('-')[0]}`,
                    status: "sent"
                  }),
                },
              });
              
              // Create "DELIVERED" and "OPENED" activities for some contacts
              if (Math.random() > 0.2) {
                await prisma.whatsAppActivity.create({
                  data: {
                    id: randomUUID(),
                    campaignId: campaign.id,
                    contactId: contact.id,
                    type: "DELIVERED",
                    timestamp: new Date((campaign.sentAt || now).getTime() + 30000), // 30 seconds later
                    metadata: JSON.stringify({
                      messageId: `msg_${randomUUID().split('-')[0]}`,
                      status: "delivered"
                    }),
                  },
                });
                
                if (Math.random() > 0.4) {
                  await prisma.whatsAppActivity.create({
                    data: {
                      id: randomUUID(),
                      campaignId: campaign.id,
                      contactId: contact.id,
                      type: "OPENED",
                      timestamp: new Date((campaign.sentAt || now).getTime() + 300000), // 5 minutes later
                      metadata: JSON.stringify({
                        messageId: `msg_${randomUUID().split('-')[0]}`,
                        status: "read"
                      }),
                    },
                  });
                }
              }
              
              // Some will have failed
              if (Math.random() > 0.8) {
                await prisma.whatsAppActivity.create({
                  data: {
                    id: randomUUID(),
                    campaignId: campaign.id,
                    contactId: contact.id,
                    type: "FAILED",
                    timestamp: new Date((campaign.sentAt || now).getTime() + 10000), // 10 seconds later
                    metadata: JSON.stringify({
                      messageId: `msg_${randomUUID().split('-')[0]}`,
                      status: "failed",
                      reason: "Contact not available on WhatsApp"
                    }),
                  },
                });
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error creating WhatsApp campaign ${sampleCampaigns[i].name}:`, error);
      }
    }

    console.log(`Successfully created ${createdCampaigns.length} WhatsApp campaigns.`);
  } catch (error) {
    console.error("Error seeding WhatsApp campaigns:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 