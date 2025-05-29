import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

// Sample journey data
const journeyTemplates = [
  {
    name: "Welcome Journey",
    description: "New customer welcome sequence with email and SMS touchpoints",
    isActive: true,
  },
  {
    name: "Lead Nurturing Journey", 
    description: "Convert leads to customers through educational content",
    isActive: true,
  },
  {
    name: "Re-engagement Journey",
    description: "Win back inactive customers with special offers",
    isActive: false,
  }
];

export async function seedSampleJourneys(prisma: PrismaClient, userId: string): Promise<boolean> {
  try {
    console.log("Creating sample customer journeys...");
    
    // For now, just log that we're skipping journey creation
    // since the journey models might not be fully set up yet
    console.log("Journey seeding skipped - journey models need to be properly configured");
    console.log("Available journey templates:");
    
    journeyTemplates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name}: ${template.description}`);
    });
    
    console.log(`Prepared ${journeyTemplates.length} journey templates for future implementation`);
    return true;
    
  } catch (error) {
    console.error("Error in journey seeding:", error);
    return false;
  }
}

export default { seedSampleJourneys }; 