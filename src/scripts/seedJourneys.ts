/**
 * Script to seed sample customer journeys into the database
 * Run with: npx ts-node src/scripts/seedJourneys.ts
 */

const { PrismaClient } = require('@prisma/client');
// Renamed to avoid conflict
const { randomUUID: genUUID } = require('crypto');
// Use dynamic require for path aliased import
const path = require('path');

// We need to pass our own UUID function to the sample journeys module
// to avoid redeclaring randomUUID
const sampleJourneysPath = path.join(process.cwd(), 'src/data/sampleJourneys');

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

// Define PrismaError interface to type check errors
interface PrismaError extends Error {
  meta?: {
    code?: string;
    message?: string;
  };
  code?: string;
}

/**
 * Check if TransitionTriggerType enum exists in the database
 * and create it if it doesn't
 */
async function ensureEnumExists() {
  try {
    console.log("Checking if TransitionTriggerType enum exists...");
    
    // Check if enum type exists using raw SQL
    const enumExists = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'transitiontriggertype'
      );
    `);
    
    const exists = Array.isArray(enumExists) ? 
      enumExists[0].exists : (enumExists).exists;
    
    if (!exists) {
      console.log("TransitionTriggerType enum doesn't exist. Creating it...");
      
      try {
        // Create the enum type with all the required values
        await prisma.$executeRawUnsafe(`
          CREATE TYPE "TransitionTriggerType" AS ENUM (
            'AUTOMATIC', 'EVENT', 'CONVERSION', 'CONDITION', 'MANUAL'
          );
        `);
        console.log("TransitionTriggerType enum created successfully");
      } catch (error: unknown) {
        // Type check and cast error
        const prismaError = error as PrismaError;
        
        // If the error is about the enum already existing, we can ignore it and proceed
        if (prismaError.meta && prismaError.meta.code === '42710') {
          console.log("TransitionTriggerType enum already exists. Continuing.");
          return true;
        }
        // For any other error, rethrow it
        throw error;
      }
    } else {
      console.log("TransitionTriggerType enum already exists");
    }
    
    return true;
  } catch (error: unknown) {
    // Type check and cast error
    const prismaError = error as PrismaError;
    
    // If the error is about the enum already existing, we can ignore it and proceed
    if (prismaError.meta && prismaError.meta.code === '42710') {
      console.log("TransitionTriggerType enum already exists. Continuing.");
      return true;
    }
    
    console.error("Error checking/creating enum:", error);
    return false;
  }
}

async function main() {
  try {
    console.log("Starting journey seeding process...");
    
    // Ensure the required enum exists
    const enumStatus = await ensureEnumExists();
    if (!enumStatus) {
      console.error("Failed to ensure enum existence. Aborting.");
      return;
    }
    
    // Get or create admin user
    let adminUser = await prisma.user.findFirst({
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
      adminUser = await prisma.user.create({
        data: {
          id: genUUID(),
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

    // Import the module and call the function directly 
    const sampleJourneysModule = require(sampleJourneysPath);
    
    // Seed journeys using admin user ID
    console.log("Seeding sample journeys with user ID:", adminUser.id);
    const result = await sampleJourneysModule.seedSampleJourneys(prisma, adminUser.id);
    
    if (result) {
      console.log("Successfully seeded sample journeys!");
    } else {
      console.error("Failed to seed sample journeys");
    }
  } catch (error: unknown) {
    console.error("Error running seed script:", error);
    
    // Type-safe error handling
    if (error instanceof Error && error.message.includes("TransitionTriggerType")) {
      console.error("This appears to be related to the TransitionTriggerType enum.");
      console.error("Try running the script again or manually create the enum in PostgreSQL with:");
      console.error(`
CREATE TYPE "TransitionTriggerType" AS ENUM (
  'AUTOMATIC', 'EVENT', 'CONVERSION', 'CONDITION', 'MANUAL'
);`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log("Seed script completed");
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error("Fatal error in seed script:", error);
    process.exit(1);
  });