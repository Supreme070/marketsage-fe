const { PrismaClient, UserRole } = require('@prisma/client');
const cryptoNode = require('crypto');

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Create Super Admin
  const superAdmin = await createUser(
    'Supreme Admin',
    'supreme@marketsage.africa',
    'MS_Super2025!',
    UserRole.SUPER_ADMIN
  );

  // Create Admin
  const admin = await createUser(
    'Anita Manager',
    'anita@marketsage.africa',
    'MS_Admin2025!',
    UserRole.ADMIN
  );

  // Create IT Admin
  const itAdmin = await createUser(
    'Kola Techleads',
    'kola@marketsage.africa',
    'MS_ITAdmin2025!',
    UserRole.IT_ADMIN
  );

  // Create Regular User
  const regularUser = await createUser(
    'Regular User',
    'user@marketsage.africa',
    'MS_User2025!',
    UserRole.USER
  );

  console.log(`Seeding finished.`);
}

async function createUser(name: string, email: string, password: string, role: any) {
  const userExists = await prisma.user.findUnique({
    where: { email },
  });

  if (userExists) {
    console.log(`User ${email} already exists, skipping.`);
    return userExists;
  }

  // Store password as plain text for development
  const user = await prisma.user.create({
    data: {
      id: cryptoNode.randomUUID(), // Generate a random UUID
      name,
      email,
      password, // Plain text for development only!
      role,
      emailVerified: new Date(),
      updatedAt: new Date(), // Required field
    },
  });

  console.log(`Created user ${email} with role ${role}`);
  return user;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 