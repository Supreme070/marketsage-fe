import { PrismaClient, type ContactStatus } from "@prisma/client";
import * as dotenv from "dotenv";
import { randomUUID } from "crypto";

// Load environment variables
dotenv.config();

// Allow connection to both Docker internal and local connections
const databaseUrl = process.env.DATABASE_URL || "postgresql://marketsage:marketsage_password@localhost:5432/marketsage?schema=public";

// Create Prisma client with direct connection to database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

// Nigerian names
const nigerianFirstNames = [
  "Adebayo", "Chioma", "Oluwaseun", "Ngozi", "Emeka", "Folake", "Olusegun", "Yewande", 
  "Chinedu", "Funmilayo", "Obinna", "Amara", "Ikenna", "Olufunke", "Tunde", "Blessing",
  "Oluwafemi", "Chinwe", "Adewale", "Chiamaka", "Tobi", "Adaeze", "Gbenga", "Nneka"
];

const nigerianLastNames = [
  "Adeyemi", "Okonkwo", "Eze", "Okafor", "Nwachukwu", "Obasanjo", "Abiodun", "Uzoma", 
  "Chukwu", "Okoye", "Adeleke", "Njoku", "Olawale", "Adeniyi", "Mohammed", "Ogunleye",
  "Nwosu", "Olanrewaju", "Adebisi", "Igwe", "Ayodele", "Okoro", "Afolabi", "Udeh"
];

// Other African names
const otherAfricanFirstNames = [
  "Kwame", "Aisha", "Abebe", "Zawadi", "Sekou", "Amina", "Kofi", "Zola", "Mandla", 
  "Fatima", "Tendai", "Nia", "Mohamed", "Mariam", "Thabo", "Nala"
];

const otherAfricanLastNames = [
  "Mensah", "Gueye", "Bekele", "Mandela", "Diallo", "Kimani", "Keita", "Nkosi", "Osei", 
  "Mwangi", "Diop", "Abdi", "Abebe", "Moyo", "Kamara", "Tutu"
];

// Company names
const companyNames = [
  "Dangote Group", "MTN Nigeria", "Globacom Limited", "First Bank Nigeria", "Zenith Bank", 
  "Safaricom", "Jumia Technologies", "Econet Wireless", "Ecobank", "Maroc Telecom"
];

// Nigerian cities
const nigerianCities = [
  "Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Benin City", "Kaduna", "Enugu", 
  "Owerri", "Calabar", "Jos", "Uyo", "Ilorin", "Akure", "Abeokuta"
];

// Other African cities
const otherAfricanCities = [
  "Accra", "Nairobi", "Cairo", "Cape Town", "Johannesburg", "Casablanca", "Addis Ababa", 
  "Kampala", "Dar es Salaam", "Tunis", "Dakar", "Rabat", "Algiers", "Kigali", "Lusaka"
];

// Job titles
const jobTitles = [
  "CEO", "Marketing Manager", "Financial Analyst", "Software Engineer", "Operations Director",
  "HR Manager", "Sales Executive", "Project Manager", "Business Development Officer",
  "Customer Service Representative", "Product Manager", "Administrative Assistant",
  "Research Analyst", "Legal Counsel", "Supply Chain Manager", "Social Media Manager"
];

// Tags for segmentation
const possibleTags = [
  "VIP", "Lead", "Customer", "Prospect", "Partner", "Supplier", "Cold-contact", "Referral",
  "Event-attendee", "Website", "Social-media", "Subscribed", "Tech", "Finance", "Healthcare",
  "Education", "Retail", "Real-estate", "Manufacturing", "Lagos-expo-2023", "Webinar-attendee"
];

// Random status values
const statuses: ContactStatus[] = ["ACTIVE", "UNSUBSCRIBED", "BOUNCED"];

// Helper function to get random element from array
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to get random subset of array
function getRandomSubset<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Generate a Nigerian person contact
function generateNigerianPersonContact() {
  const firstName = getRandomElement(nigerianFirstNames);
  const lastName = getRandomElement(nigerianLastNames);
  const uniqueId = Math.floor(Math.random() * 999999) + Date.now() % 100000; // Much larger range + timestamp component
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${uniqueId}@example.com`;
  const phone = `+234 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`;
  const city = getRandomElement(nigerianCities);
  
  return {
    email,
    phone,
    firstName,
    lastName,
    company: Math.random() > 0.7 ? getRandomElement(companyNames) : null,
    jobTitle: getRandomElement(jobTitles),
    address: `${Math.floor(Math.random() * 200) + 1} ${getRandomElement(["Adeola Odeku", "Awolowo", "Broad", "Marina", "Ligali Ayorinde", "Allen", "Herbert Macaulay", "Ahmadu Bello"])} Street`,
    city,
    state: city, // Using city as state for simplicity
    country: "Nigeria",
    postalCode: `${Math.floor(Math.random() * 900) + 100}${Math.floor(Math.random() * 100)}`,
    notes: Math.random() > 0.7 ? `Met at the ${getRandomElement(["Lagos Expo", "Tech Summit", "Business Conference", "Trade Fair", "Networking Event"])} in ${2020 + Math.floor(Math.random() * 4)}` : null,
    tags: getRandomSubset(possibleTags, Math.floor(Math.random() * 4) + 1),
    source: getRandomElement(["manual", "import", "website", "referral", "event"]),
    status: getRandomElement(statuses),
  };
}

// Generate an African (non-Nigerian) person contact
function generateOtherAfricanPersonContact() {
  const firstName = getRandomElement(otherAfricanFirstNames);
  const lastName = getRandomElement(otherAfricanLastNames);
  const uniqueId = Math.floor(Math.random() * 999999) + Date.now() % 100000; // Much larger range + timestamp component
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${uniqueId}@example.com`;
  const phone = `+${getRandomElement(["20", "27", "254", "251", "212", "233", "225", "260", "255", "221"])} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`;
  const city = getRandomElement(otherAfricanCities);
  
  // Map city to country
  const countryMap: Record<string, string> = {
    "Accra": "Ghana",
    "Nairobi": "Kenya",
    "Cairo": "Egypt",
    "Cape Town": "South Africa",
    "Johannesburg": "South Africa",
    "Casablanca": "Morocco",
    "Addis Ababa": "Ethiopia",
    "Kampala": "Uganda",
    "Dar es Salaam": "Tanzania",
    "Tunis": "Tunisia",
    "Dakar": "Senegal",
    "Rabat": "Morocco",
    "Algiers": "Algeria",
    "Kigali": "Rwanda",
    "Lusaka": "Zambia"
  };
  
  return {
    email,
    phone,
    firstName,
    lastName,
    company: Math.random() > 0.7 ? getRandomElement(companyNames) : null,
    jobTitle: getRandomElement(jobTitles),
    address: `${Math.floor(Math.random() * 200) + 1} ${getRandomElement(["Main", "Central", "Market", "Independence", "Republic", "Unity", "Liberty", "Victoria"])} Street`,
    city,
    state: city, // Using city as state for simplicity
    country: countryMap[city] || "Unknown",
    postalCode: `${Math.floor(Math.random() * 90000) + 10000}`,
    notes: Math.random() > 0.7 ? `Connected during ${getRandomElement(["Pan-African Summit", "Trade Exhibition", "Investment Forum", "Regional Conference", "Tech Meetup"])} in ${2020 + Math.floor(Math.random() * 4)}` : null,
    tags: getRandomSubset(possibleTags, Math.floor(Math.random() * 4) + 1),
    source: getRandomElement(["manual", "import", "website", "referral", "event"]),
    status: getRandomElement(statuses),
  };
}

// Generate a company contact
function generateCompanyContact() {
  const company = getRandomElement(companyNames);
  const isNigerian = Math.random() > 0.4; // 60% chance of being Nigerian
  const city = isNigerian ? getRandomElement(nigerianCities) : getRandomElement(otherAfricanCities);
  
  // Map city to country
  const countryMap: Record<string, string> = {
    "Accra": "Ghana",
    "Nairobi": "Kenya",
    "Cairo": "Egypt",
    "Cape Town": "South Africa",
    "Johannesburg": "South Africa",
    "Casablanca": "Morocco",
    "Addis Ababa": "Ethiopia",
    "Kampala": "Uganda",
    "Dar es Salaam": "Tanzania",
    "Tunis": "Tunisia",
    "Dakar": "Senegal",
    "Rabat": "Morocco",
    "Algiers": "Algeria",
    "Kigali": "Rwanda",
    "Lusaka": "Zambia"
  };
  
  const country = isNigerian ? "Nigeria" : (countryMap[city] || "Unknown");
  const uniqueId = Math.floor(Math.random() * 9999) + Date.now() % 10000; // Unique component for company emails
  const email = `info${uniqueId}@${company.toLowerCase().replace(/\s+/g, '')}.${isNigerian ? 'com.ng' : 'com'}`;
  const phone = isNigerian ?
    `+234 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}` : 
    `+${getRandomElement(["20", "27", "254", "251", "212", "233", "225", "260", "255", "221"])} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`;
  
  return {
    email,
    phone,
    firstName: company,
    lastName: null,
    company,
    jobTitle: null,
    address: `${Math.floor(Math.random() * 200) + 1} ${getRandomElement(["Business", "Corporate", "Industrial", "Commercial", "Enterprise", "Trade"])} Avenue`,
    city,
    state: city, // Using city as state for simplicity
    country,
    postalCode: isNigerian ? `${Math.floor(Math.random() * 900) + 100}${Math.floor(Math.random() * 100)}` : `${Math.floor(Math.random() * 90000) + 10000}`,
    notes: `${company} - ${getRandomElement(["Key Account", "Strategic Partner", "Major Client", "Service Provider", "Industry Leader"])}`,
    tags: [...getRandomSubset(possibleTags, Math.floor(Math.random() * 3) + 1), "Company"],
    source: getRandomElement(["manual", "import", "website", "referral", "event"]),
    status: getRandomElement(statuses),
  };
}

// Function to convert tags array to JSON string
function tagsToString(tags: string[] | undefined): string | null {
  if (!tags || tags.length === 0) return null;
  return JSON.stringify(tags);
}

async function seedContacts() {
  console.log("Starting to seed contacts...");

  // First, add VIP Test Contacts
  console.log("🌟 Adding VIP Test Contacts...");
  
  const vipContacts = [
    {
      email: 'supremeoye@outlook.com',
      firstName: 'Supreme',
      lastName: 'Oye',
      jobTitle: 'Founder & CEO',
      notes: 'VIP Test Contact - Supreme Oye',
      tags: ['VIP', 'Test', 'Founder'],
      source: 'manual'
    },
    {
      email: 'kolajosph87@gmail.com',
      firstName: 'Kola',
      lastName: 'Olatunde',
      jobTitle: 'Lead Developer',
      notes: 'VIP Test Contact - Kola Olatunde',
      tags: ['VIP', 'Test', 'Developer'],
      source: 'manual'
    },
    {
      email: 'anitaoyewumi@gmail.com',
      firstName: 'Anita',
      lastName: 'Oyewumi',
      jobTitle: 'Product Manager',
      notes: 'VIP Test Contact - Anita Oyewumi',
      tags: ['VIP', 'Test', 'Manager'],
      source: 'manual'
    },
    {
      email: 'myhomeculture@gmail.com',
      firstName: 'MyHomeCulture',
      lastName: 'Team',
      company: 'MyHomeCulture',
      jobTitle: 'Business Contact',
      notes: 'VIP Test Business Contact - MyHomeCulture',
      tags: ['VIP', 'Test', 'Business', 'Culture'],
      source: 'manual'
    },
    {
      email: 'marketsageltd@gmail.com',
      firstName: 'MarketSage',
      lastName: 'Ltd',
      company: 'MarketSage Ltd',
      jobTitle: 'Business Contact',
      notes: 'VIP Test Business Contact - MarketSage Ltd',
      tags: ['VIP', 'Test', 'Business', 'MarketSage'],
      source: 'manual'
    },
    {
      email: 'adewolemayowa@gmail.com',
      firstName: 'Mayowa',
      lastName: 'Ade',
      jobTitle: 'VIP Contact',
      notes: 'VIP Test Contact - Mayowa Ade',
      tags: ['VIP', 'Test', 'Contact'],
      source: 'manual'
    }
  ];

  // Delete existing contacts to avoid duplicates
  try {
    // Check if we should skip contact deletion
    const skipDelete = process.env.SKIP_CONTACT_DELETE === 'true';
    
    if (!skipDelete) {
      const deleteCount = await prisma.contact.deleteMany({});
      console.log(`Deleted ${deleteCount.count} existing contacts.`);
    } else {
      console.log("Skipping contact deletion as SKIP_CONTACT_DELETE is set to true.");
    }
  } catch (error) {
    console.error("Error deleting existing contacts:", error);
    return;
  }

  // Get the first admin user (or create one if none exists)
  let adminUser = await prisma.user.findFirst({
    where: {
      role: "ADMIN",
    },
    select: {
      id: true,
      email: true
    }
  });

  if (!adminUser) {
    adminUser = await prisma.user.findFirst({
      select: {
        id: true,
        email: true
      }
    });

    if (!adminUser) {
      console.error("No users found in the database. Please create a user first.");
      return;
    }
  }

  console.log(`Using user ${adminUser.email} (${adminUser.id}) as the contact creator.`);

  try {
    // Generate 30 Nigerian individual contacts
    const nigerianPersonContacts = Array.from({ length: 30 }, () => generateNigerianPersonContact());
    
    // Generate 10 other African individual contacts
    const otherAfricanPersonContacts = Array.from({ length: 10 }, () => generateOtherAfricanPersonContact());
    
    // Generate 10 company contacts
    const companyContacts = Array.from({ length: 10 }, () => generateCompanyContact());
    
    // Add VIP contacts first (check if they exist to avoid duplicates)
    const vipContactsToCreate = [];
    for (const vipContact of vipContacts) {
      const existingContact = await prisma.contact.findUnique({
        where: { email: vipContact.email }
      });
      
      if (!existingContact) {
        vipContactsToCreate.push(vipContact);
      } else {
        console.log(`  ℹ️ VIP contact ${vipContact.firstName} ${vipContact.lastName} already exists`);
      }
    }

    // Combine all contacts
    const allContacts = [...vipContactsToCreate, ...nigerianPersonContacts, ...otherAfricanPersonContacts, ...companyContacts];
    
    // Create contacts in database
    const createdContacts = [];
    for (const contact of allContacts) {
      const now = new Date();
      const result = await prisma.contact.create({
        data: {
          id: randomUUID(),
          email: contact.email,
          phone: contact.phone,
          firstName: contact.firstName,
          lastName: contact.lastName,
          company: contact.company,
          jobTitle: contact.jobTitle,
          address: contact.address,
          city: contact.city,
          state: contact.state,
          country: contact.country,
          postalCode: contact.postalCode,
          notes: contact.notes,
          source: contact.source,
          tagsString: tagsToString(contact.tags),
          status: contact.status,
          createdById: adminUser.id,
          createdAt: now,
          updatedAt: now
        },
      });
      createdContacts.push(result);
      console.log(`Created contact: ${contact.firstName} ${contact.lastName || ''} (${result.id})`);
    }
    
    console.log(`Successfully created ${createdContacts.length} contacts.`);
  } catch (error) {
    console.error("Error seeding contacts:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedContacts()
  .catch((error) => {
    console.error("Error running seed script:", error);
    process.exit(1);
  })
  .finally(() => {
    console.log("Seed script complete.");
  }); 