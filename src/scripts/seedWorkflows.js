/**
 * Script to seed sample workflows into the database
 * Run with: docker exec -it marketsage-web node src/scripts/seedWorkflows.js
 */

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const { randomUUID } = require('crypto');

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

// Sample workflow definitions
const sampleWorkflows = [
  {
    name: "Simple Welcome Sequence",
    description: "Basic 3-step welcome series for new subscribers",
    status: "ACTIVE", // Use string instead of enum
    definition: JSON.stringify({
      nodes: [
        {
          id: "trigger-1",
          type: "triggerNode",
          position: { x: 250, y: 100 },
          data: {
            label: "Contact added to list",
            description: "When a contact is added to a specified list",
            icon: "List",
            properties: {
              listId: "list-1",
              listName: "Newsletter Subscribers"
            }
          }
        },
        {
          id: "action-1",
          type: "actionNode",
          position: { x: 250, y: 220 },
          data: {
            label: "Send Email",
            description: "Send the welcome email immediately",
            icon: "Mail",
            properties: {
              templateId: "template-1",
              templateName: "Welcome Email",
              subject: "Welcome to our newsletter!",
              trackOpens: true,
              trackClicks: true
            }
          }
        },
        {
          id: "delay-1",
          type: "actionNode",
          position: { x: 250, y: 340 },
          data: {
            label: "Wait",
            description: "Wait for 2 days",
            icon: "Clock",
            properties: {
              waitAmount: 2,
              waitUnit: "days"
            }
          }
        },
        {
          id: "action-2",
          type: "actionNode",
          position: { x: 250, y: 460 },
          data: {
            label: "Send Email",
            description: "Send follow-up resources email",
            icon: "Mail",
            properties: {
              templateId: "template-2",
              templateName: "Resources Email",
              subject: "Useful resources to get started",
              trackOpens: true,
              trackClicks: true
            }
          }
        }
      ],
      edges: [
        {
          id: "edge-1",
          source: "trigger-1",
          target: "action-1",
          type: "custom"
        },
        {
          id: "edge-2",
          source: "action-1",
          target: "delay-1",
          type: "custom"
        },
        {
          id: "edge-3",
          source: "delay-1",
          target: "action-2",
          type: "custom"
        }
      ]
    })
  },
  {
    name: "Lead Nurturing Sequence",
    description: "Multi-step nurturing workflow for new leads with engagement tracking",
    status: "ACTIVE", // Use string instead of enum
    definition: JSON.stringify({
      nodes: [
        {
          id: "trigger-1",
          type: "triggerNode",
          position: { x: 250, y: 100 },
          data: {
            label: "Form submission",
            description: "When a lead submits a form",
            icon: "PlusCircle",
            properties: {
              formId: "form-1",
              formName: "Lead Magnet Download"
            }
          }
        },
        {
          id: "action-1",
          type: "actionNode",
          position: { x: 250, y: 220 },
          data: {
            label: "Send Email",
            description: "Send the lead magnet email",
            icon: "Mail",
            properties: {
              templateId: "template-3",
              templateName: "Lead Magnet Delivery",
              subject: "Your requested download is here!",
              trackOpens: true,
              trackClicks: true
            }
          }
        },
        {
          id: "delay-1",
          type: "actionNode",
          position: { x: 250, y: 340 },
          data: {
            label: "Wait",
            description: "Wait for 3 days",
            icon: "Clock",
            properties: {
              waitAmount: 3,
              waitUnit: "days"
            }
          }
        },
        {
          id: "condition-1",
          type: "conditionNode",
          position: { x: 250, y: 460 },
          data: {
            label: "If/Else",
            description: "Check if lead magnet was downloaded",
            icon: "GitBranch",
            properties: {
              conditionType: "custom",
              customCondition: "contact.events.includes('download_completed')"
            }
          }
        },
        {
          id: "action-2",
          type: "actionNode",
          position: { x: 100, y: 580 },
          data: {
            label: "Send Email",
            description: "Send follow-up case study",
            icon: "Mail",
            properties: {
              templateId: "template-4",
              templateName: "Case Study",
              subject: "See how others achieved success",
              trackOpens: true,
              trackClicks: true
            }
          }
        },
        {
          id: "action-3",
          type: "actionNode",
          position: { x: 400, y: 580 },
          data: {
            label: "Send Email",
            description: "Send reminder to download",
            icon: "Mail",
            properties: {
              templateId: "template-5",
              templateName: "Download Reminder",
              subject: "Don't forget your download",
              trackOpens: true,
              trackClicks: true
            }
          }
        },
        {
          id: "delay-2",
          type: "actionNode",
          position: { x: 100, y: 700 },
          data: {
            label: "Wait",
            description: "Wait for 4 days",
            icon: "Clock",
            properties: {
              waitAmount: 4,
              waitUnit: "days"
            }
          }
        },
        {
          id: "action-4",
          type: "actionNode",
          position: { x: 100, y: 820 },
          data: {
            label: "Send Email",
            description: "Send product introduction",
            icon: "Mail",
            properties: {
              templateId: "template-6",
              templateName: "Product Introduction",
              subject: "A solution you might be interested in",
              trackOpens: true,
              trackClicks: true
            }
          }
        },
        {
          id: "tag-1",
          type: "actionNode",
          position: { x: 400, y: 700 },
          data: {
            label: "Add tag",
            description: "Tag as 'Needs Follow-up'",
            icon: "Tag",
            properties: {
              tagId: "tag-1",
              tagName: "Needs Follow-up"
            }
          }
        }
      ],
      edges: [
        {
          id: "edge-1",
          source: "trigger-1",
          target: "action-1",
          type: "custom"
        },
        {
          id: "edge-2",
          source: "action-1",
          target: "delay-1",
          type: "custom"
        },
        {
          id: "edge-3",
          source: "delay-1",
          target: "condition-1",
          type: "custom"
        },
        {
          id: "edge-4",
          source: "condition-1",
          target: "action-2",
          type: "custom",
          label: "Yes",
          sourceHandle: "true",
          targetHandle: "in"
        },
        {
          id: "edge-5",
          source: "condition-1",
          target: "action-3",
          type: "custom",
          label: "No",
          sourceHandle: "false",
          targetHandle: "in"
        },
        {
          id: "edge-6",
          source: "action-2",
          target: "delay-2",
          type: "custom",
          sourceHandle: "out",
          targetHandle: "in"
        },
        {
          id: "edge-7",
          source: "delay-2",
          target: "action-4",
          type: "custom",
          sourceHandle: "out",
          targetHandle: "in"
        },
        {
          id: "edge-8",
          source: "action-3",
          target: "tag-1",
          type: "custom",
          sourceHandle: "out",
          targetHandle: "in"
        }
      ]
    })
  },
  {
    name: "Advanced Re-Engagement Campaign",
    description: "Complex workflow to win back inactive customers with multiple touchpoints and conditions",
    status: "INACTIVE", // Use string instead of enum
    definition: JSON.stringify({
      nodes: [
        {
          id: "trigger-1",
          type: "triggerNode",
          position: { x: 250, y: 100 },
          data: {
            label: "No activity for 30 days",
            description: "When a contact has been inactive for 30 days",
            icon: "Clock",
            properties: {
              days: 30
            }
          }
        },
        {
          id: "condition-pre",
          type: "conditionNode",
          position: { x: 250, y: 220 },
          data: {
            label: "If/Else",
            description: "Check if customer has purchased before",
            icon: "GitBranch",
            properties: {
              conditionType: "custom",
              customCondition: "contact.metrics.lifetime_value > 0"
            }
          }
        },
        {
          id: "action-1",
          type: "actionNode",
          position: { x: 250, y: 340 },
          data: {
            label: "Send Email",
            description: "Send we miss you email",
            icon: "Mail",
            properties: {
              templateId: "template-7",
              templateName: "We Miss You",
              subject: "We haven't seen you in a while",
              trackOpens: true,
              trackClicks: true
            }
          }
        },
        {
          id: "delay-1",
          type: "actionNode",
          position: { x: 250, y: 460 },
          data: {
            label: "Wait",
            description: "Wait for 2 days",
            icon: "Clock",
            properties: {
              waitAmount: 2,
              waitUnit: "days"
            }
          }
        },
        {
          id: "condition-1",
          type: "conditionNode",
          position: { x: 250, y: 580 },
          data: {
            label: "If/Else",
            description: "Check if email was opened",
            icon: "GitBranch",
            properties: {
              conditionType: "email",
              property: "opened",
              value: true
            }
          }
        },
        {
          id: "action-2",
          type: "actionNode",
          position: { x: 100, y: 700 },
          data: {
            label: "Send Email",
            description: "Send discount offer",
            icon: "Mail",
            properties: {
              templateId: "template-8",
              templateName: "Special Discount",
              subject: "Special offer just for you: 15% off",
              trackOpens: true,
              trackClicks: true
            }
          }
        },
        {
          id: "action-3",
          type: "actionNode",
          position: { x: 400, y: 700 },
          data: {
            label: "Send SMS",
            description: "Send SMS reminder",
            icon: "MessageSquare",
            properties: {
              templateId: "sms-template-1",
              templateName: "Re-engagement SMS"
            }
          }
        },
        {
          id: "delay-2",
          type: "actionNode",
          position: { x: 400, y: 820 },
          data: {
            label: "Wait",
            description: "Wait for 3 days",
            icon: "Clock",
            properties: {
              waitAmount: 3,
              waitUnit: "days"
            }
          }
        },
        {
          id: "action-4",
          type: "actionNode",
          position: { x: 400, y: 940 },
          data: {
            label: "Send Email",
            description: "Send final attempt email",
            icon: "Mail",
            properties: {
              templateId: "template-9",
              templateName: "Final Attempt",
              subject: "Last chance to stay connected",
              trackOpens: true,
              trackClicks: true
            }
          }
        },
        {
          id: "delay-3",
          type: "actionNode",
          position: { x: 100, y: 820 },
          data: {
            label: "Wait",
            description: "Wait for 5 days",
            icon: "Clock",
            properties: {
              waitAmount: 5,
              waitUnit: "days"
            }
          }
        },
        {
          id: "condition-2",
          type: "conditionNode",
          position: { x: 100, y: 940 },
          data: {
            label: "If/Else",
            description: "Check if customer made a purchase",
            icon: "GitBranch",
            properties: {
              conditionType: "custom",
              customCondition: "contact.events.includes('purchase')"
            }
          }
        },
        {
          id: "action-5",
          type: "actionNode",
          position: { x: 0, y: 1060 },
          data: {
            label: "Add tag",
            description: "Tag as 'Reactivated'",
            icon: "Tag",
            properties: {
              tagId: "tag-2",
              tagName: "Reactivated Customer"
            }
          }
        },
        {
          id: "action-6",
          type: "actionNode",
          position: { x: 200, y: 1060 },
          data: {
            label: "Send Email",
            description: "Send survey email",
            icon: "Mail",
            properties: {
              templateId: "template-10",
              templateName: "Feedback Survey",
              subject: "We'd like your feedback",
              trackOpens: true,
              trackClicks: true
            }
          }
        }
      ],
      edges: [
        {
          id: "edge-1",
          source: "trigger-1",
          target: "condition-pre",
          type: "custom"
        },
        {
          id: "edge-2",
          source: "condition-pre",
          target: "action-1",
          type: "custom",
          label: "Yes",
          sourceHandle: "true"
        },
        {
          id: "edge-3",
          source: "action-1",
          target: "delay-1",
          type: "custom"
        },
        {
          id: "edge-4",
          source: "delay-1",
          target: "condition-1",
          type: "custom"
        },
        {
          id: "edge-5",
          source: "condition-1",
          target: "action-2",
          type: "custom",
          label: "Yes",
          sourceHandle: "true"
        },
        {
          id: "edge-6",
          source: "condition-1",
          target: "action-3",
          type: "custom",
          label: "No",
          sourceHandle: "false"
        },
        {
          id: "edge-7",
          source: "action-2",
          target: "delay-3",
          type: "custom"
        },
        {
          id: "edge-8",
          source: "action-3",
          target: "delay-2",
          type: "custom"
        },
        {
          id: "edge-9",
          source: "delay-2",
          target: "action-4",
          type: "custom"
        },
        {
          id: "edge-10",
          source: "delay-3",
          target: "condition-2",
          type: "custom"
        },
        {
          id: "edge-11",
          source: "condition-2",
          target: "action-5",
          type: "custom",
          label: "Yes",
          sourceHandle: "true"
        },
        {
          id: "edge-12",
          source: "condition-2",
          target: "action-6",
          type: "custom",
          label: "No",
          sourceHandle: "false"
        }
      ]
    })
  }
];

async function seedWorkflows() {
  console.log("Seeding workflows...");

  // Check if workflows already exist
  const existingWorkflows = await prisma.workflow.count();
  console.log(`Found ${existingWorkflows} existing workflows`);

  // Find an admin user to associate with workflows
  const adminUser = await prisma.user.findFirst({
    where: {
      OR: [
        { role: "ADMIN" },
        { role: "SUPER_ADMIN" },
        { role: "IT_ADMIN" },
        {} // Fallback to any user if no admin found
      ]
    },
    select: { id: true, email: true }
  });

  let userId;
  if (!adminUser) {
    console.log("No user found to associate with workflows. Creating a default user...");
    // Create a default user if none exists
    const newUser = await prisma.user.create({
      data: {
        id: randomUUID(),
        name: "Default Admin",
        email: "admin@example.com",
        role: "ADMIN",
        password: "$2a$10$O8u2.lz1yvmFn4MjXHiRL.C56J6DNGbGw.kPjQZpJN/4DkwQH9THm", // hashed "password"
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
    console.log(`Created default user with ID: ${newUser.id}`);
    userId = newUser.id;
  } else {
    userId = adminUser.id;
    console.log(`Using existing user with ID: ${userId} for workflows`);
  }

  // Only seed if no workflows exist
  if (existingWorkflows === 0) {
    for (const workflow of sampleWorkflows) {
      const now = new Date();
      await prisma.workflow.create({
        data: {
          id: randomUUID(),
          name: workflow.name,
          description: workflow.description,
          status: workflow.status,
          definition: workflow.definition,
          createdById: userId,
          createdAt: now,
          updatedAt: now,
        },
      });
      console.log(`Created workflow: ${workflow.name}`);
    }
    console.log(`Created ${sampleWorkflows.length} workflows`);
  } else {
    console.log("Skipping workflow seeding as workflows already exist");
  }
}

// Execute the seeding function
seedWorkflows()
  .catch((e) => {
    console.error("Error seeding workflows:", e);
    process.exit(1);
  })
  .finally(async () => {
    // Close the Prisma client connection
    await prisma.$disconnect();
  });