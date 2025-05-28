import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import { randomUUID } from "crypto";

// Load environment variables
dotenv.config();

// Use the same fallback pattern as other seed scripts
const databaseUrl = process.env.DATABASE_URL || "postgresql://marketsage:marketsage_password@localhost:5432/marketsage?schema=public";

// Create Prisma client with direct connection to database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

async function checkTaskModelsExist() {
  try {
    // Check if Task table exists using raw SQL
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Task'
      );
    `;
    return Array.isArray(result) && result[0] && result[0].exists;
  } catch (error) {
    console.error("Error checking for Task table:", error);
    return false;
  }
}

async function createTaskModelsIfNeeded() {
  const tablesExist = await checkTaskModelsExist();
  
  if (!tablesExist) {
    console.log("Task tables don't exist. Creating them...");
    
    // Create Task table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Task" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "status" TEXT NOT NULL DEFAULT 'TODO',
        "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
        "dueDate" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "creatorId" TEXT NOT NULL,
        "assigneeId" TEXT,
        "contactId" TEXT,
        "segmentId" TEXT,
        "campaignId" TEXT,
        "regionId" TEXT,
        CONSTRAINT "Task_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "Task_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `;

    // Create TaskDependency table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "TaskDependency" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "taskId" TEXT NOT NULL,
        "dependsOnTaskId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "TaskDependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "TaskDependency_dependsOnTaskId_fkey" FOREIGN KEY ("dependsOnTaskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE ("taskId", "dependsOnTaskId")
      );
    `;

    // Create TaskComment table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "TaskComment" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "taskId" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdById" TEXT NOT NULL,
        CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "TaskComment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `;

    console.log("✅ Task tables created successfully");
  } else {
    console.log("✅ Task tables already exist");
  }
}

// Nigerian business-focused task data
const TASK_CATEGORIES = {
  MARKETING: [
    {
      title: "Lagos SME Email Campaign",
      description: "Create targeted email campaign for Lagos-based small and medium enterprises focusing on digital transformation",
      priority: "HIGH",
      estimatedDays: 7,
      team: "Marketing"
    },
    {
      title: "Abuja Government Sector Outreach",
      description: "Develop marketing materials for government agencies in Abuja focusing on MarketSage's compliance features",
      priority: "MEDIUM",
      estimatedDays: 10,
      team: "Marketing"
    },
    {
      title: "Social Media Campaign - Nigerian Fintech",
      description: "Launch social media campaign targeting Nigerian fintech companies with messaging automation focus",
      priority: "HIGH",
      estimatedDays: 5,
      team: "Marketing"
    },
    {
      title: "Content Marketing - Case Studies",
      description: "Create case studies featuring successful Nigerian clients like Garment Care LTD and others",
      priority: "MEDIUM",
      estimatedDays: 14,
      team: "Content"
    },
    {
      title: "WhatsApp Business Integration Promotion",
      description: "Promote WhatsApp Business integration targeting Nigerian SMEs who rely heavily on WhatsApp",
      priority: "HIGH",
      estimatedDays: 3,
      team: "Marketing"
    }
  ],
  SALES: [
    {
      title: "Enterprise Client Follow-up - Kano",
      description: "Follow up with large enterprise prospects in Kano market focusing on manufacturing sector",
      priority: "URGENT",
      estimatedDays: 2,
      team: "Sales"
    },
    {
      title: "Port Harcourt Oil & Gas Outreach",
      description: "Reach out to oil and gas companies in Port Harcourt for B2B messaging solutions",
      priority: "HIGH",
      estimatedDays: 5,
      team: "Sales"
    },
    {
      title: "Lagos Island Financial District Pitch",
      description: "Prepare and deliver presentations to financial institutions in Lagos Island",
      priority: "HIGH",
      estimatedDays: 4,
      team: "Sales"
    },
    {
      title: "Ibadan University Partnership",
      description: "Establish partnership with University of Ibadan for student communication platform",
      priority: "MEDIUM",
      estimatedDays: 21,
      team: "Sales"
    },
    {
      title: "Delta State Agriculture Cooperative",
      description: "Present MarketSage solutions to agricultural cooperatives in Delta State",
      priority: "MEDIUM",
      estimatedDays: 7,
      team: "Sales"
    }
  ],
  TECHNICAL: [
    {
      title: "Naira Payment Gateway Integration",
      description: "Integrate local Nigerian payment gateways (Paystack, Flutterwave) for subscription billing",
      priority: "URGENT",
      estimatedDays: 14,
      team: "Technical"
    },
    {
      title: "WhatsApp Business API Upgrade",
      description: "Upgrade WhatsApp Business API integration to support more concurrent connections",
      priority: "HIGH",
      estimatedDays: 10,
      team: "Technical"
    },
    {
      title: "Nigerian Phone Number Validation",
      description: "Implement proper validation for Nigerian phone number formats (+234, 070, 080, 081, 090, 091)",
      priority: "HIGH",
      estimatedDays: 3,
      team: "Technical"
    },
    {
      title: "Performance Optimization - Lagos Traffic",
      description: "Optimize server response times during peak Lagos business hours (9 AM - 5 PM WAT)",
      priority: "MEDIUM",
      estimatedDays: 7,
      team: "Technical"
    },
    {
      title: "SMS Provider Redundancy",
      description: "Implement multiple SMS providers (MTN, Airtel, Glo, 9mobile) for better delivery rates",
      priority: "HIGH",
      estimatedDays: 12,
      team: "Technical"
    }
  ],
  CONTENT: [
    {
      title: "Nigerian Business Success Stories",
      description: "Write blog series featuring successful Nigerian businesses using MarketSage",
      priority: "MEDIUM",
      estimatedDays: 10,
      team: "Content"
    },
    {
      title: "Hausa Language Support Documentation",
      description: "Create user documentation and help materials in Hausa language for Northern Nigeria",
      priority: "LOW",
      estimatedDays: 21,
      team: "Content"
    },
    {
      title: "Video Tutorials - Nigerian Context",
      description: "Create video tutorials using Nigerian business examples and local use cases",
      priority: "MEDIUM",
      estimatedDays: 14,
      team: "Content"
    },
    {
      title: "Email Templates - Nigerian Holidays",
      description: "Design email templates for Nigerian holidays (Independence Day, Democracy Day, Eid, Christmas)",
      priority: "LOW",
      estimatedDays: 5,
      team: "Content"
    },
    {
      title: "LinkedIn Articles - Nigerian Market",
      description: "Write thought leadership articles about marketing automation in the Nigerian market",
      priority: "MEDIUM",
      estimatedDays: 7,
      team: "Content"
    }
  ],
  OPERATIONS: [
    {
      title: "Lagos Office Setup",
      description: "Set up physical office presence in Victoria Island, Lagos for enterprise client meetings",
      priority: "HIGH",
      estimatedDays: 30,
      team: "Operations"
    },
    {
      title: "Nigerian Compliance Audit",
      description: "Ensure MarketSage complies with Nigerian Data Protection Regulation (NDPR)",
      priority: "URGENT",
      estimatedDays: 21,
      team: "Operations"
    },
    {
      title: "Local Support Team Hiring",
      description: "Hire Nigerian support team members to provide local time zone customer support",
      priority: "HIGH",
      estimatedDays: 45,
      team: "Operations"
    },
    {
      title: "Banking Setup - CBN Requirements",
      description: "Set up local Nigerian banking to comply with Central Bank of Nigeria regulations",
      priority: "HIGH",
      estimatedDays: 14,
      team: "Operations"
    }
  ]
};

const TASK_STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

// Nigerian team members data
const TEAM_MEMBERS = [
  { name: "Adebayo Ogundimu", email: "adebayo.ogundimu@marketsage.com", role: "Marketing Manager", team: "Marketing" },
  { name: "Fatima Abdullahi", email: "fatima.abdullahi@marketsage.com", role: "Content Specialist", team: "Content" },
  { name: "Chinedu Okwu", email: "chinedu.okwu@marketsage.com", role: "Technical Lead", team: "Technical" },
  { name: "Tunde Bakare", email: "tunde.bakare@marketsage.com", role: "Sales Manager", team: "Sales" },
  { name: "Ngozi Okafor", email: "ngozi.okafor@marketsage.com", role: "Sales Representative", team: "Sales" },
  { name: "Kemi Adeyemi", email: "kemi.adeyemi@marketsage.com", role: "Operations Manager", team: "Operations" },
  { name: "Ibrahim Musa", email: "ibrahim.musa@marketsage.com", role: "Frontend Developer", team: "Technical" },
  { name: "Oluwaseun Johnson", email: "oluwaseun.johnson@marketsage.com", role: "Marketing Specialist", team: "Marketing" },
  { name: "Chioma Nwankwo", email: "chioma.nwankwo@marketsage.com", role: "Content Writer", team: "Content" },
  { name: "Aliyu Hassan", email: "aliyu.hassan@marketsage.com", role: "Backend Developer", team: "Technical" }
];

// Task comments data
const TASK_COMMENTS = [
  "Updated the targeting criteria based on Lagos demographics",
  "Added integration with local payment providers",
  "Reviewed compliance requirements with legal team",
  "Scheduled meeting with stakeholders for next week",
  "Completed initial research phase",
  "Need approval for budget allocation",
  "Identified potential roadblocks in implementation",
  "Updated timeline based on resource availability",
  "Integrated feedback from Nigerian clients",
  "Scheduled testing phase for next sprint",
  "Added Hausa language support to requirements",
  "Coordinating with MTN for SMS gateway access",
  "Updated documentation with local examples",
  "Received positive feedback from Lagos pilot",
  "Adjusting strategy based on market response"
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(daysAgo: number, daysFuture: number): Date {
  const now = new Date();
  const start = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
  const end = new Date(now.getTime() + (daysFuture * 24 * 60 * 60 * 1000));
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateTaskTitle(category: string, index: number): string {
  const titles = TASK_CATEGORIES[category as keyof typeof TASK_CATEGORIES];
  if (titles && titles[index]) {
    return titles[index].title;
  }
  return `${category} Task ${index + 1}`;
}

function generateTaskDescription(category: string, index: number): string {
  const titles = TASK_CATEGORIES[category as keyof typeof TASK_CATEGORIES];
  if (titles && titles[index]) {
    return titles[index].description;
  }
  return `Detailed description for ${category.toLowerCase()} task ${index + 1}`;
}

function getTaskPriority(category: string, index: number): string {
  const titles = TASK_CATEGORIES[category as keyof typeof TASK_CATEGORIES];
  if (titles && titles[index]) {
    return titles[index].priority;
  }
  return getRandomElement(PRIORITIES);
}

function getTaskDueDate(category: string, index: number): Date {
  const titles = TASK_CATEGORIES[category as keyof typeof TASK_CATEGORIES];
  const estimatedDays = titles && titles[index] ? titles[index].estimatedDays : 7;
  
  // Randomly assign some tasks as completed, some as in progress, some as future
  const random = Math.random();
  if (random < 0.3) {
    // 30% completed tasks (past due dates)
    return getRandomDate(estimatedDays + 5, -1);
  } else if (random < 0.6) {
    // 30% current tasks (due soon)
    return getRandomDate(-2, estimatedDays);
  } else {
    // 40% future tasks
    return getRandomDate(estimatedDays, estimatedDays * 2);
  }
}

function getTaskStatus(dueDate: Date): string {
  const now = new Date();
  const random = Math.random();
  
  if (dueDate < now) {
    // Past due - mostly completed
    return random < 0.8 ? "DONE" : random < 0.9 ? "REVIEW" : "IN_PROGRESS";
  } else {
    // Future due - various statuses
    return random < 0.2 ? "DONE" : random < 0.4 ? "REVIEW" : random < 0.7 ? "IN_PROGRESS" : "TODO";
  }
}

async function seedTaskManagement() {
  console.log("Starting to seed task management data...");

  try {
    // Clear existing task data using raw SQL
    console.log("Clearing existing task data...");
    await prisma.$executeRaw`DELETE FROM "TaskComment"`;
    await prisma.$executeRaw`DELETE FROM "TaskDependency"`;
    await prisma.$executeRaw`DELETE FROM "Task"`;

    // Get or create users
    console.log("Setting up team members...");
    const users = [];
    
    for (const member of TEAM_MEMBERS) {
      let user = await prisma.user.findUnique({
        where: { email: member.email }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: randomUUID(),
            name: member.name,
            email: member.email,
            role: "USER",
            createdAt: getRandomDate(90, 0),
            updatedAt: new Date()
          }
        });
      }
      users.push({ ...user, team: member.team, role: member.role });
    }

    console.log(`Created/found ${users.length} team members`);

    // Get some email campaigns to link tasks to
    const campaigns = await prisma.emailCampaign.findMany({
      take: 10
    });

    // Create tasks for each category
    const allTasks = [];
    let taskCount = 0;

    for (const [category, tasks] of Object.entries(TASK_CATEGORIES)) {
      console.log(`Creating ${tasks.length} tasks for ${category}...`);
      
      for (let i = 0; i < tasks.length; i++) {
        const dueDate = getTaskDueDate(category, i);
        const status = getTaskStatus(dueDate);
        const priority = getTaskPriority(category, i);
        
        // Assign to team member from same team
        const teamMembers = users.filter(u => u.team === tasks[i].team);
        const creator = getRandomElement(users);
        const assignee = teamMembers.length > 0 ? getRandomElement(teamMembers) : creator;

        const taskId = randomUUID();
        const title = generateTaskTitle(category, i);
        const description = generateTaskDescription(category, i);
        const campaignId = campaigns.length > 0 && Math.random() < 0.3 ? getRandomElement(campaigns).id : null;
        const createdAt = getRandomDate(30, 0);
        const updatedAt = getRandomDate(5, 0);

        // Insert task using raw SQL
        await prisma.$executeRaw`
          INSERT INTO "Task" (
            "id", "title", "description", "status", "priority", "dueDate", 
            "createdAt", "updatedAt", "creatorId", "assigneeId", "campaignId"
          ) VALUES (
            ${taskId}, ${title}, ${description}, ${status}, ${priority}, ${dueDate},
            ${createdAt}, ${updatedAt}, ${creator.id}, ${assignee.id}, ${campaignId}
          )
        `;

        allTasks.push({ id: taskId, title, description, status, priority, dueDate });
        taskCount++;

        // Add comments to some tasks
        if (Math.random() < 0.6) {
          const commentCount = Math.floor(Math.random() * 5) + 1;
          for (let j = 0; j < commentCount; j++) {
            const commenter = getRandomElement(users);
            const commentId = randomUUID();
            const content = getRandomElement(TASK_COMMENTS);
            const commentCreatedAt = getRandomDate(10, 0);
            const commentUpdatedAt = getRandomDate(2, 0);

            await prisma.$executeRaw`
              INSERT INTO "TaskComment" (
                "id", "taskId", "content", "createdAt", "updatedAt", "createdById"
              ) VALUES (
                ${commentId}, ${taskId}, ${content}, ${commentCreatedAt}, ${commentUpdatedAt}, ${commenter.id}
              )
            `;
          }
        }
      }
    }

    // Create additional random tasks to fill up the board
    console.log("Creating additional tasks for comprehensive data...");
    const additionalTasksCount = 30;
    
    for (let i = 0; i < additionalTasksCount; i++) {
      const category = getRandomElement(Object.keys(TASK_CATEGORIES));
      const taskIndex = Math.floor(Math.random() * TASK_CATEGORIES[category as keyof typeof TASK_CATEGORIES].length);
      
      const dueDate = getRandomDate(60, 30);
      const status = getTaskStatus(dueDate);
      const priority = getRandomElement(PRIORITIES);
      
      const creator = getRandomElement(users);
      const assignee = getRandomElement(users);

      const taskId = randomUUID();
      const title = `${generateTaskTitle(category, taskIndex)} - Phase ${i + 1}`;
      const description = `Extended task: ${generateTaskDescription(category, taskIndex)}`;
      const campaignId = campaigns.length > 0 && Math.random() < 0.2 ? getRandomElement(campaigns).id : null;
      const createdAt = getRandomDate(60, 0);
      const updatedAt = getRandomDate(10, 0);

      await prisma.$executeRaw`
        INSERT INTO "Task" (
          "id", "title", "description", "status", "priority", "dueDate", 
          "createdAt", "updatedAt", "creatorId", "assigneeId", "campaignId"
        ) VALUES (
          ${taskId}, ${title}, ${description}, ${status}, ${priority}, ${dueDate},
          ${createdAt}, ${updatedAt}, ${creator.id}, ${assignee.id}, ${campaignId}
        )
      `;

      allTasks.push({ id: taskId, title, description, status, priority, dueDate });
      taskCount++;

      // Add comments
      if (Math.random() < 0.4) {
        const commentCount = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < commentCount; j++) {
          const commenter = getRandomElement(users);
          const commentId = randomUUID();
          const content = getRandomElement(TASK_COMMENTS);
          const commentCreatedAt = getRandomDate(15, 0);
          const commentUpdatedAt = getRandomDate(3, 0);

          await prisma.$executeRaw`
            INSERT INTO "TaskComment" (
              "id", "taskId", "content", "createdAt", "updatedAt", "createdById"
            ) VALUES (
              ${commentId}, ${taskId}, ${content}, ${commentCreatedAt}, ${commentUpdatedAt}, ${commenter.id}
            )
          `;
        }
      }
    }

    // Create task dependencies
    console.log("Creating task dependencies...");
    const dependencyCount = Math.min(15, Math.floor(allTasks.length * 0.2));
    
    for (let i = 0; i < dependencyCount; i++) {
      const dependentTask = getRandomElement(allTasks);
      const prerequisiteTask = getRandomElement(allTasks.filter(t => t.id !== dependentTask.id));

      try {
        const dependencyId = randomUUID();
        const createdAt = getRandomDate(20, 0);

        await prisma.$executeRaw`
          INSERT INTO "TaskDependency" (
            "id", "taskId", "dependsOnTaskId", "createdAt"
          ) VALUES (
            ${dependencyId}, ${dependentTask.id}, ${prerequisiteTask.id}, ${createdAt}
          )
        `;
      } catch (error) {
        // Skip if dependency already exists
        console.log(`Skipping duplicate dependency`);
      }
    }

    console.log(`✅ Successfully seeded task management data:`);
    console.log(`   - ${taskCount} tasks created`);
    console.log(`   - ${users.length} team members`);
    console.log(`   - Comments added to ~60% of tasks`);
    console.log(`   - ${dependencyCount} task dependencies created`);
    console.log(`   - Tasks distributed across: TODO, IN_PROGRESS, REVIEW, DONE statuses`);
    console.log(`   - Priority levels: LOW, MEDIUM, HIGH, URGENT`);
    console.log(`   - Nigerian business context with realistic scenarios`);

  } catch (error) {
    console.error("Error seeding task management data:", error);
    throw error;
  }
}

async function main() {
  try {
    await createTaskModelsIfNeeded();
    await seedTaskManagement();
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { seedTaskManagement }; 