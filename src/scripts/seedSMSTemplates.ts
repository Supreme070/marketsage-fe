import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import { randomUUID } from "crypto";

// Load environment variables
dotenv.config();

// Create Prisma client with direct connection to database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://marketsage:marketsage_password@postgres:5432/marketsage?schema=public"
    }
  }
});

// Sample SMS template data
const sampleTemplates = [
  {
    name: "Welcome Message",
    content: "Welcome to our service, {{1}}! Thank you for signing up. Reply HELP for assistance or STOP to unsubscribe.",
    variables: JSON.stringify(["firstName"]),
    category: "onboarding"
  },
  {
    name: "Order Confirmation",
    content: "Hello {{1}}, your order #{{2}} has been confirmed! It will be processed shortly. Thank you for your purchase.",
    variables: JSON.stringify(["firstName", "orderNumber"]),
    category: "transactional"
  },
  {
    name: "Appointment Reminder",
    content: "Reminder: You have an appointment scheduled for {{1}} at {{2}}. Please reply CONFIRM to confirm your attendance or RESCHEDULE to change.",
    variables: JSON.stringify(["date", "time"]),
    category: "reminder"
  },
  {
    name: "Special Promotion",
    content: "Hi {{1}}! We have a special offer just for you: {{2}}. This promotion ends on {{3}}. Visit our website or reply INFO for details.",
    variables: JSON.stringify(["firstName", "promoDetails", "endDate"]),
    category: "marketing"
  },
  {
    name: "Payment Reminder",
    content: "Dear {{1}}, this is a friendly reminder that your payment of {{2}} is due on {{3}}. Please make your payment to avoid service interruption.",
    variables: JSON.stringify(["firstName", "amount", "dueDate"]),
    category: "notification"
  }
];

async function main() {
  try {
    console.log("Starting SMS templates seeding process...");

    // Get admin user for association
    const adminUser = await prisma.user.findFirst({
      where: {
        role: "ADMIN"
      }
    });

    if (!adminUser) {
      throw new Error("Admin user not found. Create at least one admin user before running this script.");
    }

    // Create SMS templates
    const createdTemplates = [];
    for (const templateData of sampleTemplates) {
      try {
        const now = new Date();
        const template = await prisma.sMSTemplate.create({
          data: {
            id: randomUUID(),
            name: templateData.name,
            content: templateData.content,
            variables: templateData.variables,
            category: templateData.category,
            createdById: adminUser.id,
            createdAt: now,
            updatedAt: now,
          },
        });
        createdTemplates.push(template);
        console.log(`Created SMS template: ${template.name} (${template.id})`);
      } catch (error) {
        console.error(`Error creating SMS template ${templateData.name}:`, error);
      }
    }

    console.log(`Successfully created ${createdTemplates.length} SMS templates.`);
  } catch (error) {
    console.error("Error seeding SMS templates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 