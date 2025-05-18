/**
 * Script to seed sample customer journeys into the database
 * Run with: npx ts-node src/scripts/seedJourneys.ts
 */

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { seedSampleJourneys } from '@/data/sampleJourneys';

// Allow connection to both Docker internal and local connections
// Try both db:5432 (Docker) and localhost:5432 (local development)
const databaseUrl = process.env.DATABASE_URL || 
  "postgresql://marketsage:marketsage_password@db:5432/marketsage?schema=public";

console.log(`Connecting to database with URL pattern: ${databaseUrl.replace(/password.*@/, "password@")}`);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

async function main() {
  try {
    console.log("Starting journey seeding process...");
    
    // Get or create admin user
    let adminUser = await (prisma as any).user.findFirst({
      where: { 
        role: "ADMIN" 
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!adminUser) {
      console.log("No admin user found, creating one...");
      adminUser = await (prisma as any).user.create({
        data: {
          id: randomUUID(),
          name: "Admin User",
          email: "admin@example.com",
          password: "password123",
          role: "ADMIN",
        },
      });
      console.log("Created admin user:", adminUser.email);
    } else {
      console.log("Using existing admin user:", adminUser.email);
    }

    // Seed journeys using admin user ID
    console.log("Seeding sample journeys with user ID:", adminUser.id);
    const result = await seedSampleJourneys(prisma as any, adminUser.id);
    
    if (result) {
      console.log("Successfully seeded sample journeys!");
    } else {
      console.error("Failed to seed sample journeys");
    }
  } catch (error) {
    console.error("Error running seed script:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log("Seed script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error in seed script:", error);
    process.exit(1);
  }); 