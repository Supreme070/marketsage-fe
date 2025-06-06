/**
 * Migration script to add workflow execution models
 * Run with: npx tsx src/scripts/migrate-workflow-execution.ts
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      );
    `;
    return (result as any)[0].exists;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

async function createWorkflowExecutionTables() {
  console.log('Creating workflow execution tables...');

  // Create WorkflowExecution table
  const workflowExecutionExists = await checkTableExists('WorkflowExecution');
  if (!workflowExecutionExists) {
    await prisma.$executeRaw`
      CREATE TABLE "WorkflowExecution" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "workflowId" TEXT NOT NULL,
        "contactId" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'RUNNING',
        "currentStepId" TEXT,
        "context" TEXT NOT NULL DEFAULT '{}',
        "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "completedAt" TIMESTAMP(3),
        "lastExecutedAt" TIMESTAMP(3),
        "errorMessage" TEXT,
        "retryCount" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WorkflowExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "WorkflowExecution_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `;

    await prisma.$executeRaw`
      CREATE UNIQUE INDEX "WorkflowExecution_workflowId_contactId_key" ON "WorkflowExecution"("workflowId", "contactId");
    `;

    await prisma.$executeRaw`
      CREATE INDEX "WorkflowExecution_status_lastExecutedAt_idx" ON "WorkflowExecution"("status", "lastExecutedAt");
    `;

    console.log('✅ WorkflowExecution table created');
  } else {
    console.log('ℹ️ WorkflowExecution table already exists');
  }

  // Create WorkflowExecutionStep table
  const stepExists = await checkTableExists('WorkflowExecutionStep');
  if (!stepExists) {
    await prisma.$executeRaw`
      CREATE TABLE "WorkflowExecutionStep" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "executionId" TEXT NOT NULL,
        "stepId" TEXT NOT NULL,
        "stepType" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "startedAt" TIMESTAMP(3),
        "completedAt" TIMESTAMP(3),
        "scheduledFor" TIMESTAMP(3),
        "output" TEXT,
        "errorMessage" TEXT,
        "retryCount" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WorkflowExecutionStep_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "WorkflowExecution" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `;

    await prisma.$executeRaw`
      CREATE INDEX "WorkflowExecutionStep_status_scheduledFor_idx" ON "WorkflowExecutionStep"("status", "scheduledFor");
    `;

    console.log('✅ WorkflowExecutionStep table created');
  } else {
    console.log('ℹ️ WorkflowExecutionStep table already exists');
  }

  // Create WorkflowEvent table
  const eventExists = await checkTableExists('WorkflowEvent');
  if (!eventExists) {
    await prisma.$executeRaw`
      CREATE TABLE "WorkflowEvent" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "workflowId" TEXT,
        "contactId" TEXT,
        "eventType" TEXT NOT NULL,
        "eventData" TEXT NOT NULL DEFAULT '{}',
        "processed" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WorkflowEvent_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "WorkflowEvent_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `;

    await prisma.$executeRaw`
      CREATE INDEX "WorkflowEvent_eventType_processed_createdAt_idx" ON "WorkflowEvent"("eventType", "processed", "createdAt");
    `;

    console.log('✅ WorkflowEvent table created');
  } else {
    console.log('ℹ️ WorkflowEvent table already exists');
  }
}

async function updateContactTable() {
  console.log('Updating Contact table...');

  // Check if tags column exists and update to JSON format if needed
  try {
    const contactColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Contact' AND table_schema = 'public';
    `;

    const columns = contactColumns as { column_name: string; data_type: string }[];
    const hasTagsString = columns.some(col => col.column_name === 'tagsString');
    const hasTags = columns.some(col => col.column_name === 'tags');

    if (hasTagsString && !hasTags) {
      // Migrate from tagsString to tags
      await prisma.$executeRaw`
        ALTER TABLE "Contact" ADD COLUMN "tags" TEXT;
      `;

      // Migrate existing data
      await prisma.$executeRaw`
        UPDATE "Contact" SET "tags" = "tagsString" WHERE "tagsString" IS NOT NULL;
      `;

      console.log('✅ Added tags column to Contact table');
    }

    // Add other missing columns
    const hasCustomFields = columns.some(col => col.column_name === 'customFields');
    if (!hasCustomFields) {
      await prisma.$executeRaw`
        ALTER TABLE "Contact" ADD COLUMN "customFields" TEXT;
      `;
      console.log('✅ Added customFields column to Contact table');
    }

    const hasLastEngaged = columns.some(col => col.column_name === 'lastEngaged');
    if (!hasLastEngaged) {
      await prisma.$executeRaw`
        ALTER TABLE "Contact" ADD COLUMN "lastEngaged" TIMESTAMP(3);
      `;
      console.log('✅ Added lastEngaged column to Contact table');
    }

    const hasEmailVerified = columns.some(col => col.column_name === 'emailVerified');
    if (!hasEmailVerified) {
      await prisma.$executeRaw`
        ALTER TABLE "Contact" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
      `;
      console.log('✅ Added emailVerified column to Contact table');
    }

    const hasPhoneVerified = columns.some(col => col.column_name === 'phoneVerified');
    if (!hasPhoneVerified) {
      await prisma.$executeRaw`
        ALTER TABLE "Contact" ADD COLUMN "phoneVerified" BOOLEAN NOT NULL DEFAULT false;
      `;
      console.log('✅ Added phoneVerified column to Contact table');
    }

  } catch (error) {
    console.error('Error updating Contact table:', error);
  }
}

async function seedInitialData() {
  console.log('Seeding initial workflow execution data...');

  // Create sample workflow events for testing
  const activeWorkflows = await prisma.workflow.findMany({
    where: { status: 'ACTIVE' },
    take: 5,
  });

  if (activeWorkflows.length > 0) {
    const contacts = await prisma.contact.findMany({
      where: { status: 'ACTIVE' },
      take: 10,
    });

    for (let i = 0; i < Math.min(3, contacts.length); i++) {
      const contact = contacts[i];
      const workflow = activeWorkflows[i % activeWorkflows.length];

      try {
        await prisma.$executeRaw`
          INSERT INTO "WorkflowEvent" (
            "id", "workflowId", "contactId", "eventType", "eventData", "processed", "createdAt"
          ) VALUES (
            ${uuidv4()}, ${workflow.id}, ${contact.id}, 'contact_created', ${JSON.stringify({ source: 'migration' })}, false, ${new Date()}
          )
        `;
      } catch (error) {
        // Ignore duplicate errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes('unique constraint')) {
          console.error('Error creating sample event:', error);
        }
      }
    }

    console.log('✅ Created sample workflow events');
  }
}

async function runMigration() {
  try {
    console.log('🚀 Starting workflow execution migration...');

    await createWorkflowExecutionTables();
    await updateContactTable();
    await seedInitialData();

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Install Redis: docker run --name redis -p 6379:6379 -d redis:alpine');
    console.log('2. Install new dependencies: npm install bull ioredis node-cron');
    console.log('3. Start the workflow workers: npm run workers (when implemented)');
    console.log('4. Test workflow execution via API endpoints');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
runMigration(); 