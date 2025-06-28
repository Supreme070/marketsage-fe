/**
 * Script to seed sample customer segments into the database
 * Run with: docker exec -it marketsage-web node src/scripts/seedSegments.js
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

// Sample segment data
const sampleSegments = [
  {
    name: "High-Value Nigerian Customers",
    description: "Customers from Nigeria with high lifetime value",
    rules: JSON.stringify([
      { field: "country", operator: "=", value: "Nigeria" },
      { field: "lifetimeValue", operator: ">", value: "1000" }
    ])
  },
  {
    name: "Recent Email Openers",
    description: "Contacts who opened emails in the last 30 days",
    rules: JSON.stringify([
      { field: "emailActivity", operator: "=", value: "opened" },
      { field: "activityDate", operator: ">", value: "last 30 days" }
    ])
  },
  {
    name: "Lagos Tech Professionals",
    description: "Tech professionals based in Lagos",
    rules: JSON.stringify([
      { field: "city", operator: "=", value: "Lagos" },
      { field: "industry", operator: "=", value: "Technology" }
    ])
  }
];

async function seedSegments() {
  console.log("Starting to seed segments...");

  // Get the first admin user - avoid querying for organizationId which doesn't exist
  let adminUser = await prisma.user.findFirst({
    where: {
      role: "ADMIN",
    },
    select: {
      id: true,
      email: true,
      name: true
    }
  });

  if (!adminUser) {
    // Try to find any user if no admin is found
    adminUser = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!adminUser) {
      console.error("No users found in the database. Please create a user first.");
      return;
    }
  }

  console.log(`Using user ${adminUser.email} (${adminUser.id}) as the segment creator.`);

  // Create segments
  const createdSegments = [];
  for (const segmentData of sampleSegments) {
    try {
      const now = new Date();
      const segment = await prisma.segment.create({
        data: {
          id: randomUUID(),
          name: segmentData.name,
          description: segmentData.description,
          rules: segmentData.rules,
          createdById: adminUser.id,
          createdAt: now,
          updatedAt: now
        },
      });
      createdSegments.push(segment);
      console.log(`Created segment: ${segment.name} (${segment.id})`);
    } catch (error) {
      console.error(`Error creating segment "${segmentData.name}":`, error);
    }
  }

  console.log(`Successfully created ${createdSegments.length} segments.`);

  await prisma.$disconnect();
}

// Run the seed function
seedSegments()
  .catch((error) => {
    console.error("Error running seed script:", error);
    process.exit(1);
  })
  .finally(() => {
    console.log("Segment seeding complete.");
  });