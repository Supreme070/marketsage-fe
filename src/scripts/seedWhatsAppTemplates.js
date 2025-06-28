/**
 * Script to seed sample WhatsApp templates into the database
 * Run with: docker exec -it marketsage-web node src/scripts/seedWhatsAppTemplates.js
 */

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const { randomUUID } = require('crypto');

// Load environment variables
dotenv.config();

// Create Prisma client with direct connection to database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://marketsage:marketsage_password@marketsage-db:5432/marketsage?schema=public"
    }
  }
});

// Sample WhatsApp template data
const sampleTemplates = [
  {
    name: "Welcome Message",
    content: "Welcome to MarketSage, {{1}}! Thank you for joining us. We'll help you connect with your customers through our marketing automation platform. Reply with 'HELP' for assistance or visit our website for more information.",
    variables: JSON.stringify(["firstName"]),
    category: "onboarding",
    status: "APPROVED"
  },
  {
    name: "Order Confirmation",
    content: "Hello {{1}}, your order #{{2}} has been confirmed! It will be processed shortly. Thank you for your purchase. For order status updates, visit our website. Reply with 'TRACK' for tracking information.",
    variables: JSON.stringify(["firstName", "orderNumber"]),
    category: "transactional",
    status: "APPROVED"
  },
  {
    name: "Appointment Reminder",
    content: "Reminder: You have an appointment scheduled for {{1}} at {{2}}. Please arrive 10 minutes early. Reply with 'CONFIRM' to confirm your attendance or 'RESCHEDULE' if you need to change the appointment.",
    variables: JSON.stringify(["date", "time"]),
    category: "reminders",
    status: "APPROVED"
  },
  {
    name: "Special Promotion",
    content: "Hi {{1}}! We have a special offer just for you: {{2}}. This promotion ends on {{3}}. Visit our website or reply with 'INFO' for more details. *Terms and conditions apply.",
    variables: JSON.stringify(["firstName", "promoDetails", "endDate"]),
    category: "marketing",
    status: "APPROVED"
  },
  {
    name: "Support Ticket Update",
    content: "Update on ticket #{{1}}: {{2}}. If you have any questions, please reply to this message or contact our support team directly. Thank you for your patience.",
    variables: JSON.stringify(["ticketNumber", "statusUpdate"]),
    category: "support",
    status: "APPROVED"
  }
];

async function main() {
  try {
    console.log("Starting WhatsApp templates seeding process...");

    // Get admin user for association
    const adminUser = await prisma.user.findFirst({
      where: {
        role: "ADMIN"
      },
      select: {
        id: true,
        email: true
      }
    });

    if (!adminUser) {
      throw new Error("Admin user not found. Create at least one admin user before running this script.");
    }

    console.log(`Using admin user: ${adminUser.email} (${adminUser.id})`);

    // Create WhatsApp templates
    const createdTemplates = [];
    for (const templateData of sampleTemplates) {
      try {
        const now = new Date();
        const template = await prisma.whatsAppTemplate.create({
          data: {
            id: randomUUID(),
            name: templateData.name,
            content: templateData.content,
            variables: templateData.variables,
            category: templateData.category,
            status: templateData.status,
            createdById: adminUser.id,
            createdAt: now,
            updatedAt: now,
          },
        });
        createdTemplates.push(template);
        console.log(`Created WhatsApp template: ${template.name} (${template.id})`);
      } catch (error) {
        console.error(`Error creating WhatsApp template ${templateData.name}:`, error);
      }
    }

    console.log(`Successfully created ${createdTemplates.length} WhatsApp templates.`);
  } catch (error) {
    console.error("Error seeding WhatsApp templates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});