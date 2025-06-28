import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as readline from 'readline';

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

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// List of available users from auth.ts
const availableUsers = [
  { email: "supreme@marketsage.africa", name: "Supreme Admin" },
  { email: "anita@marketsage.africa", name: "Anita Manager" },
  { email: "kola@marketsage.africa", name: "Kola Techleads" },
  { email: "user@marketsage.africa", name: "Regular User" }
];

async function promptForUser(): Promise<string> {
  console.log("Choose a user to assign contacts to:");
  availableUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (${user.email})`);
  });
  
  return new Promise((resolve) => {
    rl.question("Enter the number of the user (1-4): ", (answer) => {
      const choice = Number.parseInt(answer, 10);
      if (isNaN(choice) || choice < 1 || choice > availableUsers.length) {
        console.log("Invalid choice. Using default (anita@marketsage.africa).");
        resolve("anita@marketsage.africa");
      } else {
        const selectedUser = availableUsers[choice - 1];
        console.log(`Selected user: ${selectedUser.name} (${selectedUser.email})`);
        resolve(selectedUser.email);
      }
    });
  });
}

async function assignContactsToCurrentUser() {
  console.log("Starting contact assignment process...");
  
  // Let the user choose which account to assign contacts to
  const userEmail = await promptForUser();
  
  // Close the readline interface
  rl.close();

  // Find the selected user
  const currentUser = await prisma.user.findUnique({
    where: {
      email: userEmail,
    },
  });

  if (!currentUser) {
    console.error(`User with email ${userEmail} not found in the database.`);
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
assignContactsToCurrentUser()
  .catch((error) => {
    console.error("Error running script:", error);
    process.exit(1);
  })
  .finally(() => {
    console.log("Assignment script complete.");
  }); 