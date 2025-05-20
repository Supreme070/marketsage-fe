// Insert sample WhatsApp data
require('dotenv').config();
const { exec } = require('child_process');

// Function to run the command
function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { env: process.env }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      console.log(`stdout: ${stdout}`);
      resolve(stdout);
    });
  });
}

// Run Prisma seed
async function main() {
  try {
    console.log("Creating sample WhatsApp data...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    
    // Create a temporary file with the database URL pointing to the Docker container
    await runCommand(`
      cat > /tmp/whatsapp-seed.js << EOL
const { PrismaClient, CampaignStatus } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('Running WhatsApp seed script...');
  
  try {
    // Get admin user or create one
    let adminUser = await prisma.user.findFirst({
      where: { 
        OR: [{ role: 'ADMIN' }, { role: 'SUPER_ADMIN' }] 
      }
    });
    
    if (!adminUser) {
      console.log('Creating admin user...');
      adminUser = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'ADMIN',
        }
      });
    }

    // Create WhatsApp templates
    const welcomeTemplate = await prisma.whatsAppTemplate.upsert({
      where: { name: 'Welcome Message' },
      update: {},
      create: {
        name: 'Welcome Message',
        content: 'Hello {{1}}, welcome to our service! We\\'re excited to have you on board.',
        status: 'APPROVED',
        createdById: adminUser.id,
        variables: ['name']
      }
    });

    const orderTemplate = await prisma.whatsAppTemplate.upsert({
      where: { name: 'Order Confirmation' },
      update: {},
      create: {
        name: 'Order Confirmation',
        content: 'Hi {{1}}, your order #{{2}} has been confirmed. Thank you for shopping with us!',
        status: 'APPROVED',
        createdById: adminUser.id,
        variables: ['name', 'orderNumber']
      }
    });

    const appointmentTemplate = await prisma.whatsAppTemplate.upsert({
      where: { name: 'Appointment Reminder' },
      update: {},
      create: {
        name: 'Appointment Reminder',
        content: 'Reminder: You have an appointment scheduled for {{1}} at {{2}}. Please reply YES to confirm.',
        status: 'APPROVED',
        createdById: adminUser.id,
        variables: ['date', 'time']
      }
    });

    const templates = [welcomeTemplate, orderTemplate, appointmentTemplate];
    console.log(\`\${templates.length} WhatsApp templates created/updated\`);

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
      
      // Add sample contacts
      const john = await prisma.contact.create({
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          createdById: adminUser.id
        }
      });
      
      const jane = await prisma.contact.create({
        data: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '+1987654321',
          createdById: adminUser.id
        }
      });
      
      // Connect contacts to list
      await prisma.listMember.createMany({
        data: [
          { listId: contactList.id, contactId: john.id },
          { listId: contactList.id, contactId: jane.id }
        ]
      });
    }

    // Create WhatsApp campaigns
    const draftCampaign = await prisma.whatsAppCampaign.upsert({
      where: { name_createdById: { name: 'Welcome Campaign', createdById: adminUser.id } },
      update: {},
      create: {
        name: 'Welcome Campaign',
        description: 'A campaign to welcome new users',
        from: '+19876543210',
        status: 'DRAFT',
        templateId: welcomeTemplate.id,
        content: welcomeTemplate.content,
        createdById: adminUser.id,
        lists: { connect: { id: contactList.id } }
      }
    });

    const scheduledCampaign = await prisma.whatsAppCampaign.upsert({
      where: { name_createdById: { name: 'Order Follow-up', createdById: adminUser.id } },
      update: {},
      create: {
        name: 'Order Follow-up',
        description: 'Follow up on recent orders',
        from: '+19876543210',
        status: 'SCHEDULED',
        templateId: orderTemplate.id,
        content: orderTemplate.content,
        createdById: adminUser.id,
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
        lists: { connect: { id: contactList.id } }
      }
    });

    const sentCampaign = await prisma.whatsAppCampaign.upsert({
      where: { name_createdById: { name: 'Appointment Reminder', createdById: adminUser.id } },
      update: {},
      create: {
        name: 'Appointment Reminder',
        description: 'Reminder for upcoming appointments',
        from: '+19876543210',
        status: 'SENT',
        templateId: appointmentTemplate.id,
        content: appointmentTemplate.content,
        createdById: adminUser.id,
        sentAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        lists: { connect: { id: contactList.id } }
      }
    });

    console.log('WhatsApp campaigns created/updated successfully');

    // Add some activities for the sent campaign
    const contacts = await prisma.contact.findMany({
      where: {
        members: {
          some: {
            listId: contactList.id
          }
        }
      }
    });
    
    // Check if activities already exist
    const activityCount = await prisma.whatsAppActivity.count({
      where: { campaignId: sentCampaign.id }
    });
    
    if (activityCount === 0 && contacts.length > 0) {
      // Add activities
      await Promise.all(
        contacts.map(contact => 
          prisma.whatsAppActivity.create({
            data: {
              campaignId: sentCampaign.id,
              contactId: contact.id,
              messageStatus: 'DELIVERED',
              timestamp: new Date(Date.now() - 47 * 60 * 60 * 1000)
            }
          })
        )
      );
      console.log(\`Added \${contacts.length} activities for sent campaign\`);
    }
    
    console.log('Sample data created successfully!');
  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
EOL
    `);
    
    // Run the script using npx so it uses the project's environment
    console.log("Running sample data script with docker's database URL...");
    await runCommand("npx node /tmp/whatsapp-seed.js");
    
    console.log("Completed successfully!");
  } catch (err) {
    console.error("Failed to run script:", err);
  }
}

main(); 