/**
 * AI Features Database Setup
 * 
 * This module provides functions to set up the necessary database tables and
 * indexes needed for AI features without requiring schema migrations.
 * 
 * This is a temporary approach until we can properly update the Prisma schema
 * and run migrations.
 */

import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

/**
 * Set up all required database tables for AI features
 */
export async function setupAIFeaturesTables(): Promise<void> {
  try {
    logger.info("Setting up AI features database tables");
    
    // Create ContentTemplateType enum if it doesn't exist
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contenttemplatetype') THEN
          CREATE TYPE "ContentTemplateType" AS ENUM (
            'EMAIL_SUBJECT',
            'EMAIL_BODY',
            'SMS_MESSAGE',
            'WHATSAPP_MESSAGE',
            'PUSH_NOTIFICATION'
          );
        END IF;
      END
      $$;
    `;
    
    // Create SmartSegmentStatus enum if it doesn't exist
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'smartsegmentstatus') THEN
          CREATE TYPE "SmartSegmentStatus" AS ENUM (
            'PENDING',
            'ACTIVE',
            'ARCHIVED'
          );
        END IF;
      END
      $$;
    `;
    
    // Create EngagementTime table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "EngagementTime" (
        "id" TEXT PRIMARY KEY,
        "contactId" TEXT NOT NULL,
        "entityType" "EntityType" NOT NULL,
        "entityId" TEXT NOT NULL,
        "engagementType" "ActivityType" NOT NULL,
        "dayOfWeek" INTEGER NOT NULL,
        "hourOfDay" INTEGER NOT NULL,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE
      );
    `;
    
    // Create indexes for EngagementTime
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'EngagementTime_contactId_idx') THEN
          CREATE INDEX "EngagementTime_contactId_idx" ON "EngagementTime"("contactId");
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'EngagementTime_entityType_entityId_idx') THEN
          CREATE INDEX "EngagementTime_entityType_entityId_idx" ON "EngagementTime"("entityType", "entityId");
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'EngagementTime_dayOfWeek_hourOfDay_idx') THEN
          CREATE INDEX "EngagementTime_dayOfWeek_hourOfDay_idx" ON "EngagementTime"("dayOfWeek", "hourOfDay");
        END IF;
      END
      $$;
    `;
    
    // Create SmartSegment table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "SmartSegment" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "rules" TEXT NOT NULL,
        "score" DOUBLE PRECISION NOT NULL,
        "status" "SmartSegmentStatus" NOT NULL DEFAULT 'PENDING',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Create ContentTemplate table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ContentTemplate" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "industry" TEXT,
        "category" TEXT NOT NULL,
        "type" "ContentTemplateType" NOT NULL,
        "template" TEXT NOT NULL,
        "keywords" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Create ContentGeneration table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ContentGeneration" (
        "id" TEXT PRIMARY KEY,
        "templateId" TEXT,
        "entityType" "EntityType" NOT NULL,
        "entityId" TEXT NOT NULL,
        "prompt" TEXT,
        "result" TEXT NOT NULL,
        "createdById" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("templateId") REFERENCES "ContentTemplate"("id") ON DELETE SET NULL,
        FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT
      );
    `;
    
    // Create SendTimeOptimization table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "SendTimeOptimization" (
        "id" TEXT PRIMARY KEY,
        "contactId" TEXT NOT NULL,
        "dayOfWeek" INTEGER NOT NULL,
        "hourOfDay" INTEGER NOT NULL,
        "engagementScore" DOUBLE PRECISION NOT NULL,
        "confidenceLevel" DOUBLE PRECISION NOT NULL,
        "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE,
        UNIQUE("contactId", "dayOfWeek", "hourOfDay")
      );
    `;
    
    // Create index for SendTimeOptimization
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'SendTimeOptimization_contactId_idx') THEN
          CREATE INDEX "SendTimeOptimization_contactId_idx" ON "SendTimeOptimization"("contactId");
        END IF;
      END
      $$;
    `;
    
    // Create default ContentTemplates if none exist
    const templateCount = await prisma.$queryRaw<Array<{count: number}>>`
      SELECT COUNT(*) as count FROM "ContentTemplate"
    `;
    
    if (templateCount[0].count === 0) {
      const defaultTemplates = [
        {
          name: "Welcome Email",
          description: "Standard welcome email for new subscribers",
          industry: null,
          category: "Onboarding",
          type: "EMAIL_BODY",
          template: "Welcome to our community! We're excited to have you join us. Here's what you can expect: {keyword1}, {keyword2}, and more!",
          keywords: JSON.stringify(["updates", "special offers", "exclusive content"])
        },
        {
          name: "Promotional Subject",
          description: "Attention-grabbing email subject for promotions",
          industry: null,
          category: "Marketing",
          type: "EMAIL_SUBJECT",
          template: "Don't miss our special {keyword} offer - Limited time only!",
          keywords: JSON.stringify(["sale", "discount", "promotion"])
        },
        {
          name: "Appointment Reminder",
          description: "SMS reminder for upcoming appointments",
          industry: null,
          category: "Transactional",
          type: "SMS_MESSAGE",
          template: "Reminder: Your {keyword} is scheduled for {date}. Reply Y to confirm or N to reschedule.",
          keywords: JSON.stringify(["appointment", "meeting", "consultation"])
        }
      ];
      
      for (const template of defaultTemplates) {
        await prisma.$executeRaw`
          INSERT INTO "ContentTemplate" (
            "id", "name", "description", "industry", "category", 
            "type", "template", "keywords", "createdAt", "updatedAt"
          )
          VALUES (
            gen_random_uuid(),
            ${template.name},
            ${template.description},
            ${template.industry},
            ${template.category},
            ${template.type}::ContentTemplateType,
            ${template.template},
            ${template.keywords},
            NOW(),
            NOW()
          )
        `;
      }
    }
    
    logger.info("Successfully set up AI features database tables");
  } catch (error) {
    logger.error("Error setting up AI features database tables", error);
    throw error;
  }
}

/**
 * Check if AI features tables exist
 */
export async function checkAIFeaturesTables(): Promise<boolean> {
  try {
    const engagementTimeTable = await prisma.$queryRaw<Array<{exists: boolean}>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'EngagementTime'
      ) as exists
    `;
    
    return engagementTimeTable[0].exists;
  } catch (error) {
    logger.error("Error checking AI features tables", error);
    return false;
  }
} 