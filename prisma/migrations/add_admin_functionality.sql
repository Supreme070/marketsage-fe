-- Migration: Add admin functionality models and fields
-- Generated for MarketSage admin portal enhancement

-- Add admin management fields to User table
ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "lastActivityAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "suspendedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "suspendedBy" TEXT;
ALTER TABLE "User" ADD COLUMN "suspendedReason" TEXT;
ALTER TABLE "User" ADD COLUMN "adminNotes" TEXT;

-- Create indexes for admin fields on User table
CREATE INDEX "User_lastLoginAt_idx" ON "User"("lastLoginAt");
CREATE INDEX "User_lastActivityAt_idx" ON "User"("lastActivityAt");
CREATE INDEX "User_suspendedAt_idx" ON "User"("suspendedAt");
CREATE INDEX "User_suspendedBy_idx" ON "User"("suspendedBy");

-- Create AdminSession table for tracking admin sessions
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logoutAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint and indexes for AdminSession
CREATE UNIQUE INDEX "AdminSession_sessionToken_key" ON "AdminSession"("sessionToken");
CREATE INDEX "AdminSession_userId_idx" ON "AdminSession"("userId");
CREATE INDEX "AdminSession_loginAt_idx" ON "AdminSession"("loginAt");
CREATE INDEX "AdminSession_isActive_idx" ON "AdminSession"("isActive");
CREATE INDEX "AdminSession_ipAddress_idx" ON "AdminSession"("ipAddress");

-- Add foreign key constraint for AdminSession
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update MessageQueue table to add missing fields
ALTER TABLE "MessageQueue" ADD COLUMN "stuckJobs" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "MessageQueue" ADD COLUMN "isHealthy" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "MessageQueue" ADD COLUMN "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add indexes for new MessageQueue fields
CREATE INDEX "MessageQueue_timestamp_idx" ON "MessageQueue"("timestamp");
CREATE INDEX "MessageQueue_isHealthy_idx" ON "MessageQueue"("isHealthy");

-- Update SecurityEventType enum to include all values (if not already present)
-- Note: This might need manual adjustment based on existing enum values
-- ALTER TYPE "SecurityEventType" ADD VALUE IF NOT EXISTS 'LOGIN_ATTEMPT';
-- ALTER TYPE "SecurityEventType" ADD VALUE IF NOT EXISTS 'FAILED_LOGIN';
-- ALTER TYPE "SecurityEventType" ADD VALUE IF NOT EXISTS 'PRIVILEGE_ESCALATION';
-- ALTER TYPE "SecurityEventType" ADD VALUE IF NOT EXISTS 'MALICIOUS_REQUEST';
-- ALTER TYPE "SecurityEventType" ADD VALUE IF NOT EXISTS 'PASSWORD_RESET';
-- ALTER TYPE "SecurityEventType" ADD VALUE IF NOT EXISTS 'ACCOUNT_LOCKED';
-- ALTER TYPE "SecurityEventType" ADD VALUE IF NOT EXISTS 'API_ABUSE';

-- Update comments on existing tables to reflect admin functionality
COMMENT ON TABLE "AdminAuditLog" IS 'Tracks all admin actions for security auditing';
COMMENT ON TABLE "SecurityEvent" IS 'Records security incidents and threats';
COMMENT ON TABLE "SystemMetrics" IS 'Stores system health metrics for monitoring';
COMMENT ON TABLE "SupportTicket" IS 'Manages customer support tickets';
COMMENT ON TABLE "MessageQueue" IS 'Monitors message queue status and health';
COMMENT ON TABLE "AdminSession" IS 'Tracks admin login sessions and activities';

-- Add admin portal specific indexes for performance
CREATE INDEX "AdminAuditLog_timestamp_action_idx" ON "AdminAuditLog"("timestamp", "action");
CREATE INDEX "SecurityEvent_timestamp_severity_idx" ON "SecurityEvent"("timestamp", "severity");
CREATE INDEX "SystemMetrics_timestamp_metricType_idx" ON "SystemMetrics"("timestamp", "metricType");
CREATE INDEX "SupportTicket_createdAt_status_idx" ON "SupportTicket"("createdAt", "status");