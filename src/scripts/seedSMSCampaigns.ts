import { PrismaClient, CampaignStatus } from "@prisma/client";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create Prisma client with direct connection to database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://marketsage:marketsage_password@localhost:5432/marketsage?schema=public"
    }
  }
});

// Sample SMS campaign data
const sampleCampaigns = [
  {
    name: "Product Launch Announcement",
    description: "Notification about our new product launch",
    from: "+2348012345678",
    content: "Hello {{firstName}}, we are excited to announce our new product launch! Check it out at our website. Reply STOP to unsubscribe.",
    status: CampaignStatus.DRAFT,
  },
  {
    name: "Ramadan Sale",
    description: "Special offers for Ramadan",
    from: "+2347012345678",
    content: "Dear {{firstName}}, enjoy special discounts during Ramadan! Visit our store now for 30% off selected items. Valid until {{expiryDate}}.",
    status: CampaignStatus.SCHEDULED,
    scheduledFor: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 days from now
  },
  {
    name: "Order Confirmation",
    description: "SMS notification for order confirmations",
    from: "+2349012345678",
    content: "Hello {{firstName}}, your order #{{orderNumber}} has been confirmed. Expected delivery: {{deliveryDate}}. Thank you for shopping with us!",
    status: CampaignStatus.SENDING,
  },
  {
    name: "Customer Satisfaction Survey",
    description: "Follow-up survey after purchase",
    from: "+2348123456789",
    content: "Hello {{firstName}}, thank you for your recent purchase! We'd love to hear your feedback. Please take our quick survey: {{surveyLink}}",
    status: CampaignStatus.SENT,
  },
  {
    name: "Payment Reminder",
    description: "Reminder for pending payments",
    from: "+2348901234567",
    content: "Dear {{firstName}}, this is a friendly reminder that your payment of {{amount}} is due on {{dueDate}}. Please make your payment to avoid service interruption.",
    status: CampaignStatus.DRAFT,
  }
];

async function seedSMSCampaigns() {
  console.log("Starting to seed SMS campaigns...");

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

  console.log(`Using user ${adminUser.email} (${adminUser.id}) as the campaign creator.`);

  // Get at least one list to associate with campaigns
  const lists = await prisma.list.findMany({ take: 2 });
  if (lists.length === 0) {
    console.log("No lists found. Please create lists first or run seedLists.ts");
    return;
  }

  // Get at least one segment to associate with campaigns (optional)
  const segments = await prisma.segment.findMany({ take: 1 });

  // Create campaigns
  const createdCampaigns = [];
  for (const campaignData of sampleCampaigns) {
    try {
      const campaign = await prisma.sMSCampaign.create({
        data: {
          name: campaignData.name,
          description: campaignData.description,
          from: campaignData.from,
          content: campaignData.content,
          status: campaignData.status,
          scheduledFor: campaignData.scheduledFor,
          createdBy: {
            connect: { id: adminUser.id }
          },
          lists: {
            connect: [{ id: lists[0].id }] // Connect at least one list
          },
          ...(segments.length > 0 && {
            segments: {
              connect: [{ id: segments[0].id }]
            }
          }),
        },
      });
      createdCampaigns.push(campaign);
      console.log(`Created SMS campaign: ${campaign.name} (${campaign.id})`);
    } catch (error) {
      console.error(`Error creating SMS campaign "${campaignData.name}":`, error);
    }
  }

  console.log(`Successfully created ${createdCampaigns.length} SMS campaigns.`);
  
  // For the active campaigns, let's create some activity records
  const activeCampaigns = createdCampaigns.filter(
    campaign => campaign.status === CampaignStatus.SENDING || campaign.status === CampaignStatus.SENT
  );
  
  if (activeCampaigns.length > 0) {
    // Get some contacts to create activities for
    const contacts = await prisma.contact.findMany({ take: 20 });
    
    if (contacts.length > 0) {
      console.log("Creating SMS activities for active/completed campaigns...");
      
      for (const campaign of activeCampaigns) {
        // For each campaign, create different types of activities
        const activityTypes = ["SENT", "DELIVERED", "OPENED", "CLICKED", "FAILED"];
        let activityCount = 0;
        
        for (const contact of contacts) {
          // Randomly choose an activity type with higher chance for SENT and DELIVERED
          const typeIndex = Math.floor(Math.random() * (activityTypes.length + 3)); // Higher weight for first two types
          const type = activityTypes[Math.min(typeIndex, activityTypes.length - 1)];
          
          try {
            await prisma.sMSActivity.create({
              data: {
                campaign: { connect: { id: campaign.id } },
                contact: { connect: { id: contact.id } },
                type: type as any,
                timestamp: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 5))),
              }
            });
            activityCount++;
          } catch (error) {
            console.error("Error creating SMS activity:", error);
          }
        }
        
        console.log(`Created ${activityCount} activities for campaign "${campaign.name}"`);
      }
    }
  }

  await prisma.$disconnect();
}

// Run the seed function
seedSMSCampaigns()
  .catch((error) => {
    console.error("Error running seed script:", error);
    process.exit(1);
  })
  .finally(() => {
    console.log("SMS campaign seeding complete.");
  }); 