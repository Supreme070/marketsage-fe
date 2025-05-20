const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function main() {
  // Create default users
  const users = [
    {
      id: randomUUID(),
      email: 'supreme@marketsage.africa',
      password: 'MS_Super2025!',
      name: 'Supreme Admin',
      role: 'SUPER_ADMIN',
    },
    {
      id: randomUUID(),
      email: 'anita@marketsage.africa',
      password: 'MS_Admin2025!',
      name: 'Anita Manager',
      role: 'ADMIN',
    },
    {
      id: randomUUID(),
      email: 'kola@marketsage.africa',
      password: 'MS_ITAdmin2025!',
      name: 'Kola Techleads',
      role: 'IT_ADMIN',
    },
    {
      id: randomUUID(),
      email: 'user@marketsage.africa',
      password: 'MS_User2025!',
      name: 'Regular User',
      role: 'USER',
    },
  ];

  for (const user of users) {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!existing) {
      // If not exists, create user
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          password: user.password, // In development, no need to hash
          name: user.name,
          role: user.role,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`Created user: ${user.name} (${user.email})`);
    } else {
      console.log(`User already exists: ${user.email}`);
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
