// Sample data generator for WhatsApp campaigns
// NOTE: Prisma removed - using backend API (WhatsAppTemplate, WhatsAppCampaign, User, List, Contact, WhatsAppActivity exist in backend)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';

import { CampaignStatus } from '@/types/prisma-types';

export async function createSampleWhatsAppData() {
  console.log('Creating sample WhatsApp data...');

  try {
    // First check if we already have templates
    const templateCountResponse = await fetch(`${BACKEND_URL}/api/v2/whatsapp-templates/count`);
    if (!templateCountResponse.ok) {
      throw new Error(`Failed to check templates: ${templateCountResponse.status}`);
    }
    const existingTemplateCount = await templateCountResponse.json();

    // Check if we already have campaigns
    const campaignCountResponse = await fetch(`${BACKEND_URL}/api/v2/whatsapp-campaigns/count`);
    if (!campaignCountResponse.ok) {
      throw new Error(`Failed to check campaigns: ${campaignCountResponse.status}`);
    }
    const existingCampaignCount = await campaignCountResponse.json();

    // Check if we need to create sample data
    if (existingTemplateCount > 0 && existingCampaignCount > 0) {
      console.log('Sample WhatsApp data already exists.');
      return;
    }

    // Get the first admin user (or create one if none exists)
    const adminUserResponse = await fetch(`${BACKEND_URL}/api/v2/users?role=ADMIN&role=SUPER_ADMIN&limit=1`);
    if (!adminUserResponse.ok) {
      throw new Error(`Failed to fetch admin user: ${adminUserResponse.status}`);
    }
    const adminUsers = await adminUserResponse.json();
    let adminUser = adminUsers[0];

    if (!adminUser) {
      console.log('No admin user found. Creating a default admin user.');
      const createUserResponse = await fetch(`${BACKEND_URL}/api/v2/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'ADMIN',
        }),
      });
      if (!createUserResponse.ok) {
        throw new Error(`Failed to create admin user: ${createUserResponse.status}`);
      }
      adminUser = await createUserResponse.json();
    }
    
    // Create WhatsApp templates if none exist
    let templates = [];

    if (existingTemplateCount === 0) {
      const templateData = [
        {
          name: 'Welcome Message',
          content: 'Hello {{1}}, welcome to our service! We\'re excited to have you on board.',
          status: 'APPROVED',
          createdById: adminUser.id,
        },
        {
          name: 'Order Confirmation',
          content: 'Hi {{1}}, your order #{{2}} has been confirmed and is being processed. Thank you for shopping with us!',
          status: 'APPROVED',
          createdById: adminUser.id,
        },
        {
          name: 'Appointment Reminder',
          content: 'Reminder: You have an appointment scheduled for {{1}} at {{2}}. Please reply YES to confirm or NO to reschedule.',
          status: 'APPROVED',
          createdById: adminUser.id,
        }
      ];

      templates = await Promise.all(
        templateData.map(async (data) => {
          const response = await fetch(`${BACKEND_URL}/api/v2/whatsapp-templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!response.ok) {
            throw new Error(`Failed to create template: ${response.status}`);
          }
          return response.json();
        })
      );

      console.log(`Created ${templates.length} WhatsApp templates.`);
    } else {
      const templatesResponse = await fetch(`${BACKEND_URL}/api/v2/whatsapp-templates`);
      if (!templatesResponse.ok) {
        throw new Error(`Failed to fetch templates: ${templatesResponse.status}`);
      }
      templates = await templatesResponse.json();
    }
    
    // Get or create a contact list
    const listsResponse = await fetch(`${BACKEND_URL}/api/v2/lists?limit=1`);
    if (!listsResponse.ok) {
      throw new Error(`Failed to fetch lists: ${listsResponse.status}`);
    }
    const lists = await listsResponse.json();
    let contactList = lists[0];

    if (!contactList) {
      const createListResponse = await fetch(`${BACKEND_URL}/api/v2/lists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Sample Contact List',
          description: 'A sample list of contacts for testing',
          createdById: adminUser.id,
        }),
      });
      if (!createListResponse.ok) {
        throw new Error(`Failed to create list: ${createListResponse.status}`);
      }
      contactList = await createListResponse.json();

      // Add some sample contacts
      const contactData = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          listIds: [contactList.id],
          createdById: adminUser.id,
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '+1987654321',
          listIds: [contactList.id],
          createdById: adminUser.id,
        }
      ];

      await Promise.all(
        contactData.map(async (data) => {
          const response = await fetch(`${BACKEND_URL}/api/v2/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!response.ok) {
            throw new Error(`Failed to create contact: ${response.status}`);
          }
          return response.json();
        })
      );
    }
    
    // Create sample WhatsApp campaigns if none exist
    if (existingCampaignCount === 0) {
      // Create campaigns with different statuses
      const campaignData = [
        // Draft campaign
        {
          name: 'Welcome Campaign',
          description: 'A campaign to welcome new users',
          from: '+19876543210',
          status: CampaignStatus.DRAFT,
          templateId: templates[0].id,
          content: templates[0].content,
          createdById: adminUser.id,
          listIds: [contactList.id]
        },

        // Scheduled campaign
        {
          name: 'Order Follow-up',
          description: 'Follow up on recent orders',
          from: '+19876543210',
          status: CampaignStatus.SCHEDULED,
          templateId: templates[1].id,
          content: templates[1].content,
          createdById: adminUser.id,
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          listIds: [contactList.id]
        },

        // Sent campaign
        {
          name: 'Appointment Reminder',
          description: 'Reminder for upcoming appointments',
          from: '+19876543210',
          status: CampaignStatus.SENT,
          templateId: templates[2].id,
          content: templates[2].content,
          createdById: adminUser.id,
          sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          listIds: [contactList.id]
        }
      ];

      const campaigns = await Promise.all(
        campaignData.map(async (data) => {
          const response = await fetch(`${BACKEND_URL}/api/v2/whatsapp-campaigns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!response.ok) {
            throw new Error(`Failed to create campaign: ${response.status}`);
          }
          return response.json();
        })
      );
      
      // Add some activities for the sent campaign
      const sentCampaign = campaigns[2];
      const contactsResponse = await fetch(`${BACKEND_URL}/api/v2/contacts?listId=${contactList.id}`);
      if (!contactsResponse.ok) {
        throw new Error(`Failed to fetch contacts: ${contactsResponse.status}`);
      }
      const contacts = await contactsResponse.json();

      await Promise.all(
        contacts.map(async (contact: any) => {
          const response = await fetch(`${BACKEND_URL}/api/v2/whatsapp-activities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaignId: sentCampaign.id,
              contactId: contact.id,
              status: 'DELIVERED',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 1000 * 60 * 5), // 5 minutes after sent
            }),
          });
          if (!response.ok) {
            throw new Error(`Failed to create activity: ${response.status}`);
          }
          return response.json();
        })
      );

      console.log(`Created ${campaigns.length} WhatsApp campaigns with activities.`);
    }

    console.log('Sample WhatsApp data created successfully.');

  } catch (error) {
    console.error('Error creating sample WhatsApp data:', error);
  }
} 