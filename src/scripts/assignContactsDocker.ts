import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create Prisma client with direct connection to database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://marketsage:marketsage_password@db:5432/marketsage?schema=public"
    }
  }
});

// Default user email
const DEFAULT_USER_EMAIL = "anita@marketsage.africa";

async function assignContactsToDefaultUser() {
  console.log("Starting automatic contact assignment process...");

  // Find the selected user
  const currentUser = await prisma.user.findUnique({
    where: {
      email: DEFAULT_USER_EMAIL,
    },
  });

  if (!currentUser) {
    console.error(`User with email ${DEFAULT_USER_EMAIL} not found in the database.`);
    return;
  }

  console.log(`Found user: ${currentUser.name || currentUser.email} (${currentUser.id})`);

  // Count contacts
  const contactCount = await prisma.contact.count();
  console.log(`Found ${contactCount} contacts to update.`);

  if (contactCount === 0) {
    console.log("No contacts to update. Make sure you've run the seed script first.");
    return;
  }

  // Update all contacts to be owned by the selected user
  try {
    const updatedCount = await prisma.contact.updateMany({
      data: {
        createdById: currentUser.id,
      },
    });

    console.log(`Successfully assigned ${updatedCount.count} contacts to ${currentUser.email}.`);
  } catch (error) {
    console.error("Error updating contacts:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update function
assignContactsToDefaultUser()
  .catch((error) => {
    console.error("Error running script:", error);
    process.exit(1);
  })
  .finally(() => {
    console.log("Assignment script complete.");
  }); 