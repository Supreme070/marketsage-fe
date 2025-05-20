const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

// Create sample contacts (100 contacts)
async function seedContacts() {
  console.log('Creating contacts...');
  
  const createdById = await getFirstUserId();
  
  if (!createdById) {
    console.error('No user found to assign as contact creator');
    return;
  }
  
  const states = ['Lagos', 'Abuja', 'Kano', 'Rivers', 'Oyo', 'Kaduna', 'Ondo'];
  const companies = ['TechDev Ltd', 'MarketFlex Inc', 'Savvy Solutions', 'Pinnacle Group', 'Horizon Enterprises'];
  const jobTitles = ['CEO', 'Marketing Manager', 'Sales Representative', 'IT Director', 'Customer Support'];
  const sources = ['Website', 'Referral', 'Event', 'Social Media', 'Cold Call'];
  
  for (let i = 1; i <= 100; i++) {
    const id = randomUUID();
    const firstName = `Contact${i}`;
    const lastName = `User${i}`;
    const email = `contact${i}@example.com`;
    const phone = `+234${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`;
    const company = companies[Math.floor(Math.random() * companies.length)];
    const jobTitle = jobTitles[Math.floor(Math.random() * jobTitles.length)];
    const state = states[Math.floor(Math.random() * states.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    
    // Check if contact already exists
    const existingContact = await prisma.contact.findFirst({
      where: { email },
    });
    
    if (!existingContact) {
      await prisma.contact.create({
        data: {
          id,
          email,
          phone,
          firstName,
          lastName,
          company,
          jobTitle,
          state,
          country: 'Nigeria',
          source,
          createdById,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`Created contact: ${firstName} ${lastName} (${email})`);
    }
  }
  
  console.log('Contacts seeding completed!');
}

// Create sample lists
async function seedLists() {
  console.log('Creating lists...');
  
  const createdById = await getFirstUserId();
  
  if (!createdById) {
    console.error('No user found to assign as list creator');
    return;
  }
  
  const lists = [
    { name: 'All Contacts', description: 'All contacts in the system' },
    { name: 'Lagos Customers', description: 'Customers from Lagos state' },
    { name: 'Abuja Customers', description: 'Customers from Abuja' },
    { name: 'CEOs', description: 'All CEOs in our database' },
    { name: 'Marketing Contacts', description: 'Marketing professionals' }
  ];
  
  for (const list of lists) {
    const existingList = await prisma.list.findFirst({
      where: { name: list.name },
    });
    
    if (!existingList) {
      const id = randomUUID();
      await prisma.list.create({
        data: {
          id,
          name: list.name,
          description: list.description,
          createdById,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`Created list: ${list.name}`);
    }
  }
  
  console.log('Lists seeding completed!');
}

// Helper function to get the first user ID
async function getFirstUserId() {
  const user = await prisma.user.findFirst();
  return user?.id;
}

// Create default users
async function seedUsers() {
  console.log('Creating users...');
  
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
          password: user.password,
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
  
  console.log('Users seeding completed!');
}

// Main function to run all seeding operations
async function main() {
  try {
    await seedUsers();
    await seedContacts();
    await seedLists();
    console.log('All seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 