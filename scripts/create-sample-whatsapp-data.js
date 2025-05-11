// Script to create sample WhatsApp data in the database

const { PrismaClient, CampaignStatus } = require('@prisma/client');
// Use the right database URL for local development
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://marketsage:password@localhost:5432/marketsage"
    }
  }
});

async function createSampleWhatsAppData() {
  console.log('Creating sample WhatsApp data...');
  
  try {
    // First check if we already have templates
    const existingTemplateCount = await prisma.whatsAppTemplate.count();
    
    // Check if we already have campaigns
    const existingCampaignCount = await prisma.whatsAppCampaign.count();
    
    // Check if we need to create sample data
    if (existingTemplateCount > 0 && existingCampaignCount > 0) {
      console.log('Sample WhatsApp data already exists.');
      return;
    }
    
    // Get the first admin user (or create one if none exists)
    let adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { role: 'ADMIN' },
          { role: 'SUPER_ADMIN' }
        ]
      }
    });
    
    if (!adminUser) {
      console.log('No admin user found. Creating a default admin user.');
      adminUser = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'ADMIN',
        }
      });
    }
    
    // Create WhatsApp templates if none exist
    let templates = [];
    
    if (existingTemplateCount === 0) {
      templates = await Promise.all([
        prisma.whatsAppTemplate.create({
          data: {
            name: 'Welcome Message',
            content: 'Hello {{1}}, welcome to our service! We\'re excited to have you on board.',
            status: 'APPROVED',
            createdById: adminUser.id,
            variables: ['name']
          }
        }),
        prisma.whatsAppTemplate.create({
          data: {
            name: 'Order Confirmation',
            content: 'Hi {{1}}, your order #{{2}} has been confirmed and is being processed. Thank you for shopping with us!',
            status: 'APPROVED',
            createdById: adminUser.id,
            variables: ['name', 'orderNumber']
          }
        }),
        prisma.whatsAppTemplate.create({
          data: {
            name: 'Appointment Reminder',
            content: 'Reminder: You have an appointment scheduled for {{1}} at {{2}}. Please reply YES to confirm or NO to reschedule.',
            status: 'APPROVED',
            createdById: adminUser.id,
            variables: ['date', 'time']
          }
        })
      ]);
      
      console.log(`Created ${templates.length} WhatsApp templates.`);
    } else {
      templates = await prisma.whatsAppTemplate.findMany();
    }
    
    // Get or create a contact list
    let contactList = await prisma.list.findFirst();
    if (!contactList) {
      contactList = await prisma.list.create({
        data: {
          name: 'Sample Contact List',
          description: 'A sample list of contacts for testing',
          createdById: adminUser.id,
        }
      });
      
      // Add some sample contacts - using "members" for contact list relationship
      await Promise.all([
        prisma.contact.create({
          data: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890',
            createdById: adminUser.id,
            members: {
              create: {
                listId: contactList.id
              }
            }
          }
        }),
        prisma.contact.create({
          data: {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            phone: '+1987654321',
            createdById: adminUser.id,
            members: {
              create: {
                listId: contactList.id
              }
            }
          }
        })
      ]);
    }
    
    // Create sample WhatsApp campaigns if none exist
    if (existingCampaignCount === 0) {
      // Create campaigns with different statuses
      const campaigns = await Promise.all([
        // Draft campaign
        prisma.whatsAppCampaign.create({
          data: {
            name: 'Welcome Campaign',
            description: 'A campaign to welcome new users',
            from: '+19876543210',
            status: CampaignStatus.DRAFT,
            templateId: templates[0].id,
            content: templates[0].content,
            createdById: adminUser.id,
            lists: {
              connect: { id: contactList.id }
            }
          }
        }),
        
        // Scheduled campaign
        prisma.whatsAppCampaign.create({
          data: {
            name: 'Order Follow-up',
            description: 'Follow up on recent orders',
            from: '+19876543210',
            status: CampaignStatus.SCHEDULED,
            templateId: templates[1].id,
            content: templates[1].content,
            createdById: adminUser.id,
            scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            lists: {
              connect: { id: contactList.id }
            }
          }
        }),
        
        // Sent campaign
        prisma.whatsAppCampaign.create({
          data: {
            name: 'Appointment Reminder',
            description: 'Reminder for upcoming appointments',
            from: '+19876543210',
            status: CampaignStatus.SENT,
            templateId: templates[2].id,
            content: templates[2].content,
            createdById: adminUser.id,
            sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            lists: {
              connect: { id: contactList.id }
            }
          }
        })
      ]);
      
      // Add some activities for the sent campaign
      const sentCampaign = campaigns[2];
      const contacts = await prisma.contact.findMany({
        where: {
          members: {
            some: {
              listId: contactList.id
            }
          }
        }
      });
      
      await Promise.all(
        contacts.map(contact => 
          prisma.whatsAppActivity.create({
            data: {
              campaignId: sentCampaign.id,
              contactId: contact.id,
              messageStatus: 'DELIVERED',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 1000 * 60 * 5), // 5 minutes after sent
            }
          })
        )
      );
      
      console.log(`Created ${campaigns.length} WhatsApp campaigns with activities.`);
    }
    
    console.log('Sample WhatsApp data created successfully.');
    
  } catch (error) {
    console.error('Error creating sample WhatsApp data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createSampleWhatsAppData()
  .then(() => console.log('Done!'))
  .catch(error => console.error('Script failed:', error)); 