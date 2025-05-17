import { JourneyData, JourneyStageData, TransitionTriggerType } from '@/lib/journey-mapping';
import { randomUUID } from 'crypto';

/**
 * Sample journey data for testing and demonstration
 */
export const sampleJourneys: JourneyData[] = [
  // Email Nurture Journey
  {
    id: randomUUID(),
    name: "Product Onboarding Journey",
    description: "Guide new users through product features and setup process to ensure successful adoption",
    isActive: true,
    createdAt: new Date(),
    createdById: "user_id_here", // Replace with an actual user ID when using
    stages: [
      {
        id: randomUUID(),
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
            triggerType: TransitionTriggerType.AUTOMATIC,
            name: "Welcome Email Sent",
            triggerDetails: {
              delayHours: 0
            }
          }
        ]
      },
      {
        id: randomUUID(),
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
            triggerType: TransitionTriggerType.EVENT,
            name: "Setup Completed",
            triggerDetails: {
              eventName: "profile_completed"
            }
          }
        ]
      },
      {
        id: randomUUID(),
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
            triggerType: TransitionTriggerType.CONDITION,
            name: "Features Explored",
            conditions: {
              operator: "AND",
              conditions: [
                { key: "features_explored", operator: ">=", value: 3 },
                { key: "time_in_app", operator: ">", value: 10 } // minutes
              ]
            }
          }
        ]
      },
      {
        id: randomUUID(),
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
            triggerType: TransitionTriggerType.EVENT,
            name: "Advanced Usage",
            triggerDetails: {
              eventName: "advanced_feature_used",
              occurrences: 2
            }
          }
        ]
      },
      {
        id: randomUUID(),
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
    id: randomUUID(),
    name: "E-commerce Purchase Journey",
    description: "Track and optimize the customer journey from first visit to purchase and retention",
    isActive: true,
    createdAt: new Date(),
    createdById: "user_id_here", // Replace with an actual user ID when using
    stages: [
      {
        id: randomUUID(),
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
            triggerType: TransitionTriggerType.EVENT,
            name: "Product View",
            triggerDetails: {
              eventName: "product_view",
              occurrences: 2
            }
          }
        ]
      },
      {
        id: randomUUID(),
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
            triggerType: TransitionTriggerType.EVENT,
            name: "Add to Cart",
            triggerDetails: {
              eventName: "add_to_cart"
            }
          }
        ]
      },
      {
        id: randomUUID(),
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
            triggerType: TransitionTriggerType.EVENT,
            name: "Checkout Started",
            triggerDetails: {
              eventName: "begin_checkout"
            }
          },
          {
            fromStageId: "placeholder",
            toStageId: "placeholder", // Will point to Abandonment Recovery stage
            triggerType: TransitionTriggerType.CONDITION,
            name: "Cart Abandoned",
            conditions: {
              operator: "AND",
              conditions: [
                { key: "cart_last_updated", operator: ">", value: 24 }, // hours
                { key: "checkout_completed", operator: "=", value: false }
              ]
            }
          }
        ]
      },
      {
        id: randomUUID(),
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
            triggerType: TransitionTriggerType.EVENT,
            name: "Return to Cart",
            triggerDetails: {
              eventName: "cart_view_from_email"
            }
          }
        ]
      },
      {
        id: randomUUID(),
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
            triggerType: TransitionTriggerType.EVENT,
            name: "Purchase Completed",
            triggerDetails: {
              eventName: "purchase_complete"
            }
          }
        ]
      },
      {
        id: randomUUID(),
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
            triggerType: TransitionTriggerType.AUTOMATIC,
            name: "Post-Purchase Flow",
            triggerDetails: {
              delayHours: 24 // Wait 24 hours before moving to next stage
            }
          }
        ]
      },
      {
        id: randomUUID(),
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
            triggerType: TransitionTriggerType.EVENT,
            name: "Return Visit",
            triggerDetails: {
              eventName: "site_revisit",
              afterDays: 7
            }
          }
        ]
      },
      {
        id: randomUUID(),
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
export function getConnectedJourneys(): JourneyData[] {
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
export async function seedSampleJourneys(prisma: any, userId: string) {
  try {
    console.log("Seeding sample journeys...");
    const journeys = getConnectedJourneys();
    
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
          await prisma.JourneyTransition.create({
            data: {
              id: randomUUID(),
              fromStageId: transition.fromStageId,
              toStageId: transition.toStageId,
              name: transition.name,
              description: transition.description,
              triggerType: transition.triggerType,
              triggerDetails: transition.triggerDetails ? JSON.stringify(transition.triggerDetails) : null,
              conditions: transition.conditions ? JSON.stringify(transition.conditions) : null,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
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