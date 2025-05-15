import { PrismaClient } from "@prisma/client";

// Create a type that includes UserPreference
type PrismaClientWithUserPreference = PrismaClient & {
  userPreference: any;
};

// Cast the PrismaClient instance to our extended type
const prisma = new PrismaClient() as PrismaClientWithUserPreference;

async function main() {
  console.log("Starting to seed user preferences...");

  try {
    // Get all users
    const users = await prisma.user.findMany();
    
    if (users.length === 0) {
      console.log("No users found. Create users first.");
      return;
    }
    
    console.log(`Found ${users.length} users. Adding preferences...`);
    
    // Generate random preferences for each user
    for (const user of users) {
      try {
        // Check if user already has preferences
        const existingPreferences = await prisma.userPreference.findUnique({
          where: { userId: user.id },
        });
        
        if (existingPreferences) {
          console.log(`User ${user.name || user.email} already has preferences. Skipping.`);
          continue;
        }
        
        // Generate random preferences
        const preferences = {
          theme: getRandomItem(['light', 'dark', 'system']),
          compactMode: Math.random() > 0.7, // 30% chance of enabling compact mode
          notifications: {
            email: Math.random() > 0.2, // 80% chance of enabling email notifications
            marketing: Math.random() > 0.7, // 30% chance of enabling marketing emails
            browser: Math.random() > 0.3, // 70% chance of enabling browser notifications
          },
          timezone: getRandomItem([
            'Africa/Lagos',
            'Africa/Cairo',
            'Europe/London',
            'America/New_York',
            'Asia/Tokyo'
          ]),
          language: getRandomItem(['en', 'fr', 'yo', 'ha', 'ig']),
        };
        
        // Save preferences to database
        await prisma.userPreference.create({
          data: {
            userId: user.id,
            preferences: JSON.stringify(preferences),
          },
        });
        
        console.log(`Created preferences for user ${user.name || user.email}`);
      } catch (error: any) {
        console.error(`Error processing user ${user.name || user.email}: ${error.message}`);
      }
    }
    
    console.log("User preferences seeding complete!");
  } catch (error: any) {
    console.error(`Error seeding user preferences: ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to get a random item from an array
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

main()
  .catch((e: any) => {
    console.error(`Uncaught error: ${e.message}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 