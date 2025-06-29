-- Migration to add organizationId to all tenant-specific models
-- Run this migration to add organizationId columns to models that are missing them

-- Add organizationId to Contact table if not exists
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add organizationId to List table if not exists  
ALTER TABLE "List" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add organizationId to Segment table if not exists
ALTER TABLE "Segment" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add organizationId to EmailTemplate table if not exists
ALTER TABLE "EmailTemplate" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add organizationId to EmailCampaign table if not exists
ALTER TABLE "EmailCampaign" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add organizationId to SMSCampaign table if not exists
ALTER TABLE "SMSCampaign" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add organizationId to WhatsAppCampaign table if not exists
ALTER TABLE "WhatsAppCampaign" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add organizationId to Workflow table if not exists
ALTER TABLE "Workflow" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add organizationId to Task table if not exists
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add organizationId to Journey table if not exists
ALTER TABLE "Journey" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add organizationId to AI_ContentAnalysis table if not exists
ALTER TABLE "AI_ContentAnalysis" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add organizationId to AI_CustomerSegment table if not exists  
ALTER TABLE "AI_CustomerSegment" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add organizationId to AI_ChatHistory table if not exists
ALTER TABLE "AI_ChatHistory" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add organizationId to LeadPulseVisitor table if not exists
ALTER TABLE "LeadPulseVisitor" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add organizationId to LeadPulseTouchpoint table if not exists
ALTER TABLE "LeadPulseTouchpoint" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add organizationId to ConversionEvent table if not exists
ALTER TABLE "ConversionEvent" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add organizationId to ConversionTracking table if not exists
ALTER TABLE "ConversionTracking" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add organizationId to ConversionFunnel table if not exists
ALTER TABLE "ConversionFunnel" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add organizationId to PredictionModel table if not exists
ALTER TABLE "PredictionModel" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add organizationId to ChurnPrediction table if not exists
ALTER TABLE "ChurnPrediction" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add organizationId to LifetimeValuePrediction table if not exists
ALTER TABLE "LifetimeValuePrediction" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add organizationId to ContactJourney table if not exists
ALTER TABLE "ContactJourney" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add foreign key constraints
ALTER TABLE "Contact" ADD CONSTRAINT IF NOT EXISTS "Contact_organizationId_fkey" 
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;

ALTER TABLE "List" ADD CONSTRAINT IF NOT EXISTS "List_organizationId_fkey" 
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;

ALTER TABLE "Segment" ADD CONSTRAINT IF NOT EXISTS "Segment_organizationId_fkey" 
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;

ALTER TABLE "EmailTemplate" ADD CONSTRAINT IF NOT EXISTS "EmailTemplate_organizationId_fkey" 
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;

ALTER TABLE "EmailCampaign" ADD CONSTRAINT IF NOT EXISTS "EmailCampaign_organizationId_fkey" 
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;

ALTER TABLE "SMSCampaign" ADD CONSTRAINT IF NOT EXISTS "SMSCampaign_organizationId_fkey" 
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;

ALTER TABLE "WhatsAppCampaign" ADD CONSTRAINT IF NOT EXISTS "WhatsAppCampaign_organizationId_fkey" 
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;

ALTER TABLE "Workflow" ADD CONSTRAINT IF NOT EXISTS "Workflow_organizationId_fkey" 
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;

ALTER TABLE "Task" ADD CONSTRAINT IF NOT EXISTS "Task_organizationId_fkey" 
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;

ALTER TABLE "Journey" ADD CONSTRAINT IF NOT EXISTS "Journey_organizationId_fkey" 
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "Contact_organizationId_idx" ON "Contact"("organizationId");
CREATE INDEX IF NOT EXISTS "List_organizationId_idx" ON "List"("organizationId");
CREATE INDEX IF NOT EXISTS "Segment_organizationId_idx" ON "Segment"("organizationId");
CREATE INDEX IF NOT EXISTS "EmailCampaign_organizationId_idx" ON "EmailCampaign"("organizationId");
CREATE INDEX IF NOT EXISTS "SMSCampaign_organizationId_idx" ON "SMSCampaign"("organizationId");
CREATE INDEX IF NOT EXISTS "WhatsAppCampaign_organizationId_idx" ON "WhatsAppCampaign"("organizationId");
CREATE INDEX IF NOT EXISTS "Workflow_organizationId_idx" ON "Workflow"("organizationId");
CREATE INDEX IF NOT EXISTS "Task_organizationId_idx" ON "Task"("organizationId");
CREATE INDEX IF NOT EXISTS "Journey_organizationId_idx" ON "Journey"("organizationId");