import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting password update...");

  const users = [
    // Official users from README
    {
      email: "supreme@marketsage.africa",
      password: "MS_Super2025!"
    },
    {
      email: "anita@marketsage.africa", 
      password: "MS_Admin2025!"
    },
    {
      email: "kola@marketsage.africa",
      password: "MS_ITAdmin2025!"
    },
    {
      email: "user@marketsage.africa",
      password: "MS_User2025!"
    },
    // Test users with simple passwords
    {
      email: "admin@marketsage.local",
      password: "password1234" 
    },
    {
      email: "user@marketsage.local",
      password: "Password123"
    },
    {
      email: "testadmin@marketsage.local",
      password: "test1234"
    },
    {
      email: "test@marketsage.local",
      password: "password123"
    }
  ];

  for (const user of users) {
    try {
      const existing = await prisma.user.findUnique({
        where: { email: user.email }
      });

      if (existing) {
        await prisma.user.update({
          where: { email: user.email },
          data: { password: user.password }
        });
        console.log(`Updated password for ${user.email}`);
      } else {
        // Create user if it doesn't exist
        await prisma.user.create({
          data: {
            email: user.email,
            name: user.email.split('@')[0],
            password: user.password,
            role: user.email.includes('admin') ? 'ADMIN' : 'USER'
          }
        });
        console.log(`Created user ${user.email}`);
      }
    } catch (error) {
      console.error(`Error processing user ${user.email}:`, error);
    }
  }

  console.log("Password update completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 