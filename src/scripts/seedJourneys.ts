/**
 * Script to seed sample customer journeys into the database
 * Run with: npx ts-node src/scripts/seedJourneys.ts
 */

import prisma from '@/lib/db/prisma';
import { seedSampleJourneys } from '@/data/sampleJourneys';

async function main() {
  try {
    // Get or create admin user
    let adminUser = await (prisma as any).user.findFirst({
      where: {
        role: 'ADMIN'
      }
    });

    if (!adminUser) {
      console.log("No admin user found, creating one...");
      adminUser = await (prisma as any).user.create({
        data: {
          name: "Admin User",
          email: "admin@example.com",
          role: "ADMIN",
          isActive: true,
          password: "$2b$10$vfhPXgoLQzaHDn6Se7Llge2ePEW.JHw3lLd7OwKnOkh9rnpHT32rO" // Hashed password for 'password123'
        }
      });
      console.log("Created admin user:", adminUser.email);
    }

    // Seed journeys using admin user ID
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