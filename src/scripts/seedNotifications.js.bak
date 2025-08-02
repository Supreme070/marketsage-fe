// CommonJS version of the notification seeding script
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting notification seeding...');
    
    // Get all users
    const users = await prisma.user.findMany({
      take: 5, // Limit to 5 users for seeding
    });
    
    if (users.length === 0) {
      console.log('No users found. Please seed users first.');
      return;
    }
    
    console.log(`Found ${users.length} users for seeding notifications.`);
    
    // Sample notification templates
    const notificationTemplates = [
      {
        type: 'info',
        category: 'system',
        title: 'System Maintenance',
        message: 'Scheduled maintenance will occur this weekend. No downtime expected.',
        link: '/support'
      },
      {
        type: 'success',
        category: 'campaigns',
        title: 'Campaign Completed',
        message: 'Your "Summer Promotion" campaign has completed successfully.',
        link: '/email/campaigns/summer-promotion'
      },
      {
        type: 'warning',
        category: 'system',
        title: 'API Key Expiring',
        message: 'Your WhatsApp API key will expire in 7 days. Please renew it.',
        link: '/settings/api'
      },
      {
        type: 'error',
        category: 'workflows',
        title: 'Workflow Error',
        message: 'Your "Lead Nurturing" workflow has encountered an error in the delay step.',
        link: '/workflows/lead-nurturing'
      },
      {
        type: 'success',
        category: 'contacts',
        title: 'Contacts Imported',
        message: '150 new contacts were successfully imported.',
        link: '/contacts'
      },
      {
        type: 'info',
        category: 'journeys',
        title: 'Journey Milestone',
        message: '50 contacts have completed the "Customer Onboarding" journey.',
        link: '/journeys/customer-onboarding'
      },
      {
        type: 'warning',
        category: 'campaigns',
        title: 'Low Open Rate',
        message: 'Your recent campaign has a lower than average open rate.',
        link: '/email/campaigns/analytics'
      },
      {
        type: 'success',
        category: 'segments',
        title: 'Segment Growth',
        message: 'Your "High Value" segment grew by 15% this month.',
        link: '/segments/high-value'
      }
    ];
    
    // Create notifications for each user
    for (const user of users) {
      console.log(`Creating notifications for user: ${user.email}`);
      
      // Create a random number of notifications for each user (3-8)
      const notificationCount = Math.floor(Math.random() * 6) + 3;
      
      for (let i = 0; i < notificationCount; i++) {
        // Select a random template
        const template = notificationTemplates[Math.floor(Math.random() * notificationTemplates.length)];
        
        // Determine if notification should be read (70% chance of being read)
        const read = Math.random() > 0.3;
        
        // Create a random timestamp within the last 7 days
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 7));
        
        // Create the notification using raw SQL since the model might not be recognized yet
        await prisma.$executeRaw`
          INSERT INTO "Notification" (
            "id", "userId", "title", "message", "type", "category", "read", "link", "timestamp"
          ) VALUES (
            ${randomUUID()}, ${user.id}, ${template.title}, ${template.message}, 
            ${template.type}, ${template.category}, ${read}, ${template.link}, ${timestamp}
          )
        `;
      }
    }
    
    console.log('Notification seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 