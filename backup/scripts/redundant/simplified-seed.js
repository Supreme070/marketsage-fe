const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');

async function main() {
  console.log('Starting simplified seeding process...');
  
  try {
    // Get the admin user ID
    const adminUser = await prisma.user.findUnique({
      where: {
        id: '574c1069-9130-4fdc-9e1c-a02994e4d047',
      },
    });

    if (!adminUser) {
      console.error('Admin user not found, please ensure it was created');
      return;
    }

    console.log('Admin user found:', adminUser.email);

    // Create a sample contact
    const contact = await prisma.contact.create({
      data: {
        id: uuidv4(),
        firstName: 'Sample',
        lastName: 'Contact',
        email: 'sample@example.com',
        phoneNumber: '+2347012345678',
        createdBy: {
          connect: {
            id: adminUser.id,
          },
        },
      },
    });
    console.log('Created sample contact:', contact.email);

    // Create a sample list
    const list = await prisma.contactList.create({
      data: {
        id: uuidv4(),
        name: 'Sample List',
        description: 'A sample contact list',
        createdBy: {
          connect: {
            id: adminUser.id,
          },
        },
      },
    });
    console.log('Created sample list:', list.name);

    // Add contact to list
    await prisma.contactList.update({
      where: {
        id: list.id,
      },
      data: {
        contacts: {
          connect: {
            id: contact.id,
          },
        },
      },
    });
    console.log('Added contact to list');

    // Create a sample segment
    const segment = await prisma.segment.create({
      data: {
        id: uuidv4(),
        name: 'Sample Segment',
        description: 'A sample segment',
        conditions: JSON.stringify([
          { field: 'email', operator: 'contains', value: '@example.com' }
        ]),
        createdBy: {
          connect: {
            id: adminUser.id,
          },
        },
      },
    });
    console.log('Created sample segment:', segment.name);

    console.log('Simplified seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 