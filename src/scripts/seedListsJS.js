const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

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

// Sample list data
const sampleLists = [
  {
    name: "Nigerian Businesses",
    description: "Business contacts from Nigeria",
    type: "STATIC",
  },
  {
    name: "Individual Customers",
    description: "All individual customer contacts",
    type: "STATIC",
  }
];

async function seedLists() {
  console.log("Starting to seed contact lists...");

  // Get the first admin user
  let adminUser = await prisma.user.findFirst({
    where: {
      role: "ADMIN",
    },
  });

  if (!adminUser) {
    adminUser = await prisma.user.findFirst({});

    if (!adminUser) {
      console.error("No users found in the database. Please create a user first.");
      return;
    }
  }

  console.log(`Using user ${adminUser.email} (${adminUser.id}) as the list creator.`);

  // Create lists
  const createdLists = [];
  for (const listData of sampleLists) {
    try {
      const list = await prisma.list.create({
        data: {
          name: listData.name,
          description: listData.description,
          type: listData.type,
          createdById: adminUser.id,
        },
      });
      createdLists.push(list);
      console.log(`Created list: ${list.name} (${list.id})`);
    } catch (error) {
      console.error(`Error creating list "${listData.name}":`, error);
    }
  }

  if (createdLists.length === 0) {
    console.log("No lists were created. Exiting.");
    await prisma.$disconnect();
    return;
  }

  console.log(`Successfully created ${createdLists.length} lists.`);

  await prisma.$disconnect();
}

// Run the seed function
seedLists()
  .catch((error) => {
    console.error("Error running seed script:", error);
    process.exit(1);
  })
  .finally(() => {
    console.log("List seeding complete.");
  }); 