/**
 * Script to create a default user in the database
 * Run with: npx tsx src/scripts/createDefaultUser.js
 * or: node src/scripts/createDefaultUser.js
 */

const { randomUUID } = require('crypto');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createDefaultUser() {
  try {
    console.log('Starting to create default user...');

    // Check if default user already exists
    const existingUser = await prisma.$queryRaw`
      SELECT id FROM "User" WHERE email = 'admin@example.com' LIMIT 1
    `;

    if (Array.isArray(existingUser) && existingUser.length > 0) {
      console.log(`Default user already exists with ID: ${existingUser[0].id}`);
      return existingUser[0].id;
    }

    // Generate password hash
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Generate a random UUID for the user
    const userId = randomUUID();

    // Create user with raw SQL to handle any schema issues
    await prisma.$executeRaw`
      INSERT INTO "User" (
        "id", "name", "email", "emailVerified", "password", 
        "image", "role", "createdAt", "updatedAt"
      ) VALUES (
        ${userId}, 'Admin User', 'admin@example.com', now(), ${hashedPassword}, 
        null, 'ADMIN', now(), now()
      )
    `;

    console.log(`Created default user with ID: ${userId}`);
    return userId;
  } catch (error) {
    console.error('Error creating default user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function if called directly
if (require.main === module) {
  createDefaultUser()
    .then(() => {
      console.log('Default user creation complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to create default user:', error);
      process.exit(1);
    });
}

module.exports = { createDefaultUser }; 