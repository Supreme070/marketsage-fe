// Define TransitionTriggerType enum directly in this file to avoid import issues
const TransitionTriggerType = {
  AUTOMATIC: 'AUTOMATIC',
  EVENT: 'EVENT',
  CONVERSION: 'CONVERSION',
  CONDITION: 'CONDITION',
  MANUAL: 'MANUAL'
};

// Use a different variable name than crypto to avoid conflict
// with the global crypto variable
const nodeCrypto = require('crypto');
const generateUUID = nodeCrypto.randomUUID;

// Define interface for prisma parameter
interface PrismaClient {
  Journey: any;
  JourneyStage: any;
  JourneyTransition: any;
  $queryRaw: any;
  $executeRaw: any;
  $queryRawUnsafe: any;
  $disconnect: () => Promise<void>;
}

// Define shared interface properties that all transitions have
interface BaseTransition {
  fromStageId: string;
  toStageId: string;
  triggerType: string;
  name: string;
  description?: string;
  // All transitions can optionally have trigger details
  triggerDetails?: any;
}

// Event transition - specific to EVENT trigger type
interface EventTransition extends BaseTransition {
  triggerType: 'EVENT';
  triggerDetails: {
    eventName: string;
    occurrences?: number;
    afterDays?: number;
  };
}

// Automatic transition - specific to AUTOMATIC trigger type
interface AutomaticTransition extends BaseTransition {
  triggerType: 'AUTOMATIC';
  triggerDetails: {
    delayHours: number;
  };
}

// Condition transition - specific to CONDITION trigger type
interface ConditionTransition extends BaseTransition {
  triggerType: 'CONDITION';
  // Condition transitions may have empty triggerDetails
  triggerDetails?: any;
  conditions: {
    operator: string;
    conditions: Array<{
      key: string;
      operator: string;
      value: any;
    }>;
  };
}

// Union type for all transition types
type JourneyTransition = EventTransition | AutomaticTransition | ConditionTransition;

// Interface for journey stages
interface JourneyStage {
  id: string;
  name: string;
  description: string;
  order: number;
  isEntryPoint: boolean;
  isExitPoint: boolean;
  expectedDuration: number;
  conversionGoal: number;
  transitions?: JourneyTransition[];
}

// Interface for journeys
interface Journey {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  createdById: string;
  stages: JourneyStage[];
  metrics: any[];
}

/**
 * Helper function to safely get trigger details
 * @param transition Any transition type
 * @returns JSON string of triggerDetails or null
 */
function getTransitionTriggerDetails(transition: JourneyTransition): string | null {
  if (transition.triggerDetails) {
    return JSON.stringify(transition.triggerDetails);
  }
  return null;
}

/**
 * Function to safely check and handle transition conditions
 * @param transition Any transition type
 * @returns JSON string of conditions or null
 */
function getTransitionConditions(transition: JourneyTransition): string | null {
  // Check if this is a condition transition
  if (transition.triggerType === 'CONDITION' && 'conditions' in transition) {
    return JSON.stringify(transition.conditions);
  }
  return null;
}

/**
 * Sample journey data for testing and demonstration
 */
const sampleJourneys: Journey[] = [
  // Email Nurture Journey
  {
    id: generateUUID(),
    name: "Product Onboarding Journey",
    description: "Guide new users through product features and setup process to ensure successful adoption",
    isActive: true,
    createdAt: new Date(),
    createdById: "user_id_here", // Replace with an actual user ID when using
    stages: [
      {
        id: generateUUID(),
        name: "Welcome",
        description: "Initial welcome and account setup guidance",
        order: 0,
        isEntryPoint: true,
        isExitPoint: false,
        expectedDuration: 24, // hours
        conversionGoal: 0.9, // 90%
        transitions: [
          {
            fromStageId: "placeholder", // Will be replaced with actual stage ID
            toStageId: "placeholder", // Will be replaced with actual stage ID
            triggerType: TransitionTriggerType.AUTOMATIC as 'AUTOMATIC',
            name: "Welcome Email Sent",
            description: "Automatic transition after welcome email is sent",
            triggerDetails: {
              delayHours: 0
            }
          } as AutomaticTransition
        ]
      },
      {
        id: generateUUID(),
        name: "Initial Setup",
        description: "User completes basic profile and application settings",
        order: 1,
        isEntryPoint: false,
        isExitPoint: false,
        expectedDuration: 48, // hours
        conversionGoal: 0.75, // 75%
        transitions: [
          {
            fromStageId: "placeholder",
            toStageId: "placeholder",
            triggerType: TransitionTriggerType.EVENT as 'EVENT',
            name: "Setup Completed",
            description: "Triggered when profile setup is completed",
            triggerDetails: {
              eventName: "profile_completed"
            }
          } as EventTransition
        ]
      },
      {
        id: generateUUID(),
        name: "Feature Exploration",
        description: "Introduction to key product features with guided walkthroughs",
        order: 2,
        isEntryPoint: false,
        isExitPoint: false,
        expectedDuration: 72, // hours
        conversionGoal: 0.6, // 60%
        transitions: [
          {
            fromStageId: "placeholder",
            toStageId: "placeholder",
            triggerType: TransitionTriggerType.CONDITION as 'CONDITION',
            name: "Features Explored",
            description: "Transition when user has explored enough features",
            triggerDetails: {}, // Empty trigger details for condition transition
            conditions: {
              operator: "AND",
              conditions: [
                { key: "features_explored", operator: ">=", value: 3 },
                { key: "time_in_app", operator: ">", value: 10 } // minutes
              ]
            }
          } as ConditionTransition
        ]
      },
      {
        id: generateUUID(),
        name: "Advanced Features",
        description: "Deeper dive into advanced capabilities and integration options",
        order: 3,
        isEntryPoint: false,
        isExitPoint: false,
        expectedDuration: 120, // hours
        conversionGoal: 0.4, // 40%
        transitions: [
          {
            fromStageId: "placeholder",
            toStageId: "placeholder",
            triggerType: TransitionTriggerType.EVENT as 'EVENT',
            name: "Advanced Usage",
            description: "User has used advanced features multiple times",
            triggerDetails: {
              eventName: "advanced_feature_used",
              occurrences: 2
            }
          } as EventTransition
        ]
      },
      {
        id: generateUUID(),
        name: "Active User",
        description: "Regular usage patterns established, focused on retention and expansion",
        order: 4,
        isEntryPoint: false,
        isExitPoint: true,
        expectedDuration: 168, // hours (1 week)
        conversionGoal: 0.3, // 30%
      }
    ],
    metrics: []
  },
  
  // E-commerce Customer Journey
  {
    id: generateUUID(),
    name: "E-commerce Purchase Journey",
    description: "Track and optimize the customer journey from first visit to purchase and retention",
    isActive: true,
    createdAt: new Date(),
    createdById: "user_id_here", // Replace with an actual user ID when using
    stages: [
      {
        id: generateUUID(),
        name: "First Visit",
        description: "Initial website visit and browsing behavior",
        order: 0,
        isEntryPoint: true,
        isExitPoint: false,
        expectedDuration: 1, // hours
        conversionGoal: 0.6, // 60%
        transitions: [
          {
            fromStageId: "placeholder",
            toStageId: "placeholder",
            triggerType: TransitionTriggerType.EVENT as 'EVENT',
            name: "Product View",
            description: "User has viewed multiple products",
            triggerDetails: {
              eventName: "product_view",
              occurrences: 2
            }
          } as EventTransition
        ]
      },
      {
        id: generateUUID(),
        name: "Product Interest",
        description: "Shows interest in specific product categories or items",
        order: 1,
        isEntryPoint: false,
        isExitPoint: false,
        expectedDuration: 24, // hours
        conversionGoal: 0.4, // 40%
        transitions: [
          {
            fromStageId: "placeholder",
            toStageId: "placeholder",
            triggerType: TransitionTriggerType.EVENT as 'EVENT',
            name: "Add to Cart",
            description: "User has added item to cart",
            triggerDetails: {
              eventName: "add_to_cart"
            }
          } as EventTransition
        ]
      },
      {
        id: generateUUID(),
        name: "Cart Addition",
        description: "Products added to cart but purchase not yet completed",
        order: 2,
        isEntryPoint: false,
        isExitPoint: false,
        expectedDuration: 48, // hours
        conversionGoal: 0.3, // 30%
        transitions: [
          {
            fromStageId: "placeholder",
            toStageId: "placeholder",
            triggerType: TransitionTriggerType.EVENT as 'EVENT',
            name: "Checkout Started",
            description: "User has begun checkout process",
            triggerDetails: {
              eventName: "begin_checkout"
            }
          } as EventTransition,
          {
            fromStageId: "placeholder",
            toStageId: "placeholder", // Will point to Abandonment Recovery stage
            triggerType: TransitionTriggerType.CONDITION as 'CONDITION',
            name: "Cart Abandoned",
            description: "Cart has been inactive for specified time",
            triggerDetails: {}, // Empty trigger details for condition transition
            conditions: {
              operator: "AND",
              conditions: [
                { key: "cart_last_updated", operator: ">", value: 24 }, // hours
                { key: "checkout_completed", operator: "=", value: false }
              ]
            }
          } as ConditionTransition
        ]
      },
      {
        id: generateUUID(),
        name: "Abandonment Recovery",
        description: "Cart abandoned, recovery emails and remarketing activated",
        order: 3,
        isEntryPoint: false,
        isExitPoint: false,
        expectedDuration: 72, // hours
        conversionGoal: 0.15, // 15%
        transitions: [
          {
            fromStageId: "placeholder",
            toStageId: "placeholder", // Back to Cart Addition
            triggerType: TransitionTriggerType.EVENT as 'EVENT',
            name: "Return to Cart",
            description: "User returns to cart from email",
            triggerDetails: {
              eventName: "cart_view_from_email"
            }
          } as EventTransition
        ]
      },
      {
        id: generateUUID(),
        name: "Checkout",
        description: "Active checkout process",
        order: 4,
        isEntryPoint: false,
        isExitPoint: false,
        expectedDuration: 1, // hours
        conversionGoal: 0.85, // 85%
        transitions: [
          {
            fromStageId: "placeholder",
            toStageId: "placeholder",
            triggerType: TransitionTriggerType.EVENT as 'EVENT',
            name: "Purchase Completed",
            description: "User completes purchase",
            triggerDetails: {
              eventName: "purchase_complete"
            }
          } as EventTransition
        ]
      },
      {
        id: generateUUID(),
        name: "First Purchase",
        description: "Completed first purchase",
        order: 5,
        isEntryPoint: false,
        isExitPoint: false,
        expectedDuration: 0, // immediate
        conversionGoal: 1.0, // 100%
        transitions: [
          {
            fromStageId: "placeholder",
            toStageId: "placeholder",
            triggerType: TransitionTriggerType.AUTOMATIC as 'AUTOMATIC',
            name: "Post-Purchase Flow",
            description: "Automatic transition after purchase",
            triggerDetails: {
              delayHours: 24 // Wait 24 hours before moving to next stage
            }
          } as AutomaticTransition
        ]
      },
      {
        id: generateUUID(),
        name: "Post-Purchase Engagement",
        description: "Follow-up with order confirmations, shipment tracking, and cross-sell opportunities",
        order: 6,
        isEntryPoint: false,
        isExitPoint: false,
        expectedDuration: 168, // hours (1 week)
        conversionGoal: 0.3, // 30%
        transitions: [
          {
            fromStageId: "placeholder",
            toStageId: "placeholder",
            triggerType: TransitionTriggerType.EVENT as 'EVENT',
            name: "Return Visit",
            description: "User returns after week from purchase",
            triggerDetails: {
              eventName: "site_revisit",
              afterDays: 7
            }
          } as EventTransition
        ]
      },
      {
        id: generateUUID(),
        name: "Repeat Customer",
        description: "Multiple purchases completed, focus on retention and loyalty",
        order: 7,
        isEntryPoint: false,
        isExitPoint: true,
        expectedDuration: 720, // hours (30 days)
        conversionGoal: 0.2, // 20%
      }
    ],
    metrics: []
  }
];

/**
 * This function connects stage IDs in the transitions to create a complete journey
 */
function getConnectedJourneys(): Journey[] {
  return sampleJourneys.map(journey => {
    const stages = [...journey.stages];
    
    // Connect transitions with proper stage IDs
    stages.forEach((stage, i) => {
      if (!stage.transitions) return;
      
      stage.transitions.forEach(transition => {
        transition.fromStageId = stage.id;
        
        // Find the appropriate target stage based on the transition name/purpose
        if (transition.name?.includes("Abandoned")) {
          // Point to abandonment recovery stage
          const recoveryStage = stages.find(s => s.name.includes("Abandonment"));
          if (recoveryStage) transition.toStageId = recoveryStage.id;
        } else if (transition.name?.includes("Return to Cart")) {
          // Point back to cart addition stage
          const cartStage = stages.find(s => s.name.includes("Cart Addition"));
          if (cartStage) transition.toStageId = cartStage.id;
        } else {
          // Default: point to the next stage in sequence
          const nextIndex = i + 1;
          if (nextIndex < stages.length) {
            transition.toStageId = stages[nextIndex].id;
          }
        }
      });
    });
    
    return {
      ...journey,
      stages
    };
  });
}

/**
 * Function to seed the sample journeys to the database
 */
async function seedSampleJourneys(prisma: PrismaClient, userId: string) {
  try {
    console.log("Seeding sample journeys...");
    const journeys = getConnectedJourneys();
    
    // First check if the TransitionTriggerType enum is available
    let enumAvailable = true;
    try {
      // Try to perform a simple query that would fail if the enum doesn't exist
      await prisma.$queryRaw`SELECT 'AUTOMATIC'::TransitionTriggerType`;
      console.log("TransitionTriggerType enum is available");
    } catch (error) {
      console.warn("TransitionTriggerType enum check failed, will use string values");
      enumAvailable = false;
    }
    
    for (const journey of journeys) {
      // Create the journey
      const createdJourney = await prisma.Journey.create({
        data: {
          id: journey.id,
          name: journey.name,
          description: journey.description,
          isActive: journey.isActive,
          createdAt: journey.createdAt,
          createdById: userId,
          updatedAt: new Date()
        }
      });
      
      console.log(`Created journey: ${createdJourney.name}`);
      
      // Create stages
      for (const stage of journey.stages) {
        await prisma.JourneyStage.create({
          data: {
            id: stage.id,
            journeyId: createdJourney.id,
            name: stage.name,
            description: stage.description,
            order: stage.order,
            expectedDuration: stage.expectedDuration,
            conversionGoal: stage.conversionGoal,
            isEntryPoint: stage.isEntryPoint || false,
            isExitPoint: stage.isExitPoint || false,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
      
      // Create transitions between stages
      for (const stage of journey.stages) {
        if (!stage.transitions) continue;
        
        for (const transition of stage.transitions) {
          try {
            // Ensure required properties exist or set defaults
            const description = transition.description || '';
            // Use our safe getter function for trigger details
            const triggerDetails = getTransitionTriggerDetails(transition);
            // Use our safe getter function for conditions
            const conditions = getTransitionConditions(transition);
            
            await prisma.JourneyTransition.create({
              data: {
                id: generateUUID(),
                fromStageId: transition.fromStageId,
                toStageId: transition.toStageId,
                name: transition.name,
                description: description,
                triggerType: transition.triggerType,
                triggerDetails: triggerDetails,
                conditions: conditions,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
          } catch (error: any) { // Use 'any' type to handle unknown error
            if (error.message && error.message.includes('TransitionTriggerType')) {
              console.warn(`TransitionTriggerType enum error, trying with raw query instead`);
              
              // Fallback to using raw SQL if the enum doesn't exist
              const transitionId = generateUUID();
              const triggerType = String(transition.triggerType); // Convert enum to string
              const description = transition.description || '';
              // Use our safe getter functions
              const triggerDetails = getTransitionTriggerDetails(transition);
              const conditions = getTransitionConditions(transition);
              
              await prisma.$executeRaw`
                INSERT INTO "JourneyTransition" (
                  "id", "fromStageId", "toStageId", "name", "description",
                  "triggerType", "triggerDetails", "conditions",
                  "createdAt", "updatedAt"
                ) VALUES (
                  ${transitionId}, ${transition.fromStageId}, ${transition.toStageId},
                  ${transition.name}, ${description},
                  ${triggerType}, ${triggerDetails}::jsonb, ${conditions}::jsonb,
                  NOW(), NOW()
                )
              `;
            } else {
              // Re-throw any other error
              throw error;
            }
          }
        }
      }
      
      console.log(`Created all stages and transitions for journey: ${createdJourney.name}`);
    }
    
    console.log("Sample journeys seeded successfully!");
    return true;
  } catch (error) {
    console.error("Error seeding sample journeys:", error);
    return false;
  }
}

// Export functions and data using CommonJS syntax
module.exports = {
  sampleJourneys,
  getConnectedJourneys,
  seedSampleJourneys,
  TransitionTriggerType
};