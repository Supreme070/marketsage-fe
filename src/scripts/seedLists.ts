import { PrismaClient, ListType } from "@prisma/client";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create Prisma client with direct connection to database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://marketsage:marketsage_password@localhost:5432/marketsage?schema=public"
    }
  }
});

// Sample list data
const sampleLists = [
  {
    name: "Nigerian Businesses",
    description: "Business contacts from Nigeria",
    type: ListType.STATIC,
  },
  {
    name: "Individual Customers",
    description: "All individual customer contacts",
    type: ListType.STATIC,
  },
  {
    name: "Marketing Leads",
    description: "Potential leads for marketing campaigns",
    type: ListType.STATIC,
  },
  {
    name: "VIP Contacts",
    description: "High-priority and important contacts",
    type: ListType.STATIC,
  },
  {
    name: "Event Attendees",
    description: "People who attended our events",
    type: ListType.STATIC,
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

  // Get contacts to add to lists
  const contacts = await prisma.contact.findMany({
    take: 100,
  });

  if (contacts.length === 0) {
    console.log("No contacts found to add to lists.");
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${contacts.length} contacts to add to lists.`);

  // Add contacts to lists based on criteria
  const memberAssignments = [];

  // Nigerian Businesses list
  const nigerianBusinesses = createdLists.find(list => list.name === "Nigerian Businesses");
  if (nigerianBusinesses) {
    const nigerianCompanyContacts = contacts.filter(
      contact => contact.country === "Nigeria" && contact.company !== null
    );
    
    console.log(`Adding ${nigerianCompanyContacts.length} contacts to Nigerian Businesses list`);
    
    for (const contact of nigerianCompanyContacts) {
      try {
        const member = await prisma.listMember.create({
          data: {
            listId: nigerianBusinesses.id,
            contactId: contact.id,
          },
        });
        memberAssignments.push(member);
      } catch (error) {
        console.error(`Error adding contact ${contact.id} to list:`, error);
      }
    }
  }

  // Individual Customers list
  const individualCustomers = createdLists.find(list => list.name === "Individual Customers");
  if (individualCustomers) {
    const individualContacts = contacts.filter(
      contact => (contact.company === null || contact.company === "") && contact.firstName !== null
    ).slice(0, 30); // Limit to 30 contacts
    
    console.log(`Adding ${individualContacts.length} contacts to Individual Customers list`);
    
    for (const contact of individualContacts) {
      try {
        const member = await prisma.listMember.create({
          data: {
            listId: individualCustomers.id,
            contactId: contact.id,
          },
        });
        memberAssignments.push(member);
      } catch (error) {
        console.error(`Error adding contact ${contact.id} to list:`, error);
      }
    }
  }

  // Marketing Leads list
  const marketingLeads = createdLists.find(list => list.name === "Marketing Leads");
  if (marketingLeads) {
    // Get every 3rd contact for variety
    const leadContacts = contacts.filter((_, index) => index % 3 === 0).slice(0, 20);
    
    console.log(`Adding ${leadContacts.length} contacts to Marketing Leads list`);
    
    for (const contact of leadContacts) {
      try {
        const member = await prisma.listMember.create({
          data: {
            listId: marketingLeads.id,
            contactId: contact.id,
          },
        });
        memberAssignments.push(member);
      } catch (error) {
        console.error(`Error adding contact ${contact.id} to list:`, error);
      }
    }
  }

  // VIP Contacts list
  const vipContacts = createdLists.find(list => list.name === "VIP Contacts");
  if (vipContacts) {
    // Get every 7th contact for variety
    const vipContactsList = contacts.filter((_, index) => index % 7 === 0).slice(0, 10);
    
    console.log(`Adding ${vipContactsList.length} contacts to VIP Contacts list`);
    
    for (const contact of vipContactsList) {
      try {
        const member = await prisma.listMember.create({
          data: {
            listId: vipContacts.id,
            contactId: contact.id,
          },
        });
        memberAssignments.push(member);
      } catch (error) {
        console.error(`Error adding contact ${contact.id} to list:`, error);
      }
    }
  }

  // Event Attendees list
  const eventAttendees = createdLists.find(list => list.name === "Event Attendees");
  if (eventAttendees) {
    // Get every 5th contact for variety
    const attendeeContacts = contacts.filter((_, index) => index % 5 === 0).slice(0, 15);
    
    console.log(`Adding ${attendeeContacts.length} contacts to Event Attendees list`);
    
    for (const contact of attendeeContacts) {
      try {
        const member = await prisma.listMember.create({
          data: {
            listId: eventAttendees.id,
            contactId: contact.id,
          },
        });
        memberAssignments.push(member);
      } catch (error) {
        console.error(`Error adding contact ${contact.id} to list:`, error);
      }
    }
  }

  console.log(`Successfully created ${createdLists.length} lists and added ${memberAssignments.length} members.`);

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