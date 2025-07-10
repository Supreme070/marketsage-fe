-- CreateEnum
CREATE TYPE "AnalyticsRange" AS ENUM ('HOUR', 'DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WorkflowNodeType" ADD VALUE 'API_CALL';
ALTER TYPE "WorkflowNodeType" ADD VALUE 'CRM_ACTION';
ALTER TYPE "WorkflowNodeType" ADD VALUE 'PAYMENT_WEBHOOK';
ALTER TYPE "WorkflowNodeType" ADD VALUE 'DATABASE_ACTION';

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "autoTopUp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoTopUpAmount" DOUBLE PRECISION NOT NULL DEFAULT 100,
ADD COLUMN     "autoTopUpThreshold" DOUBLE PRECISION NOT NULL DEFAULT 10,
ADD COLUMN     "creditBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "messagingModel" TEXT NOT NULL DEFAULT 'customer_managed',
ADD COLUMN     "preferredProviders" TEXT,
ADD COLUMN     "region" TEXT NOT NULL DEFAULT 'us';

-- AlterTable
ALTER TABLE "Workflow" ADD COLUMN     "complexityRating" TEXT DEFAULT 'SIMPLE',
ADD COLUMN     "performanceScore" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "successRate" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "totalExecutions" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "SMSHistory" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "from" TEXT,
    "message" TEXT NOT NULL,
    "originalMessage" TEXT,
    "contactId" TEXT,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "messageId" TEXT,
    "error" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SMSHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppHistory" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "originalMessage" TEXT,
    "contactId" TEXT,
    "templateId" TEXT,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "messageId" TEXT,
    "error" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowAnalytics" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "dateRange" "AnalyticsRange" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalExecutions" INTEGER NOT NULL DEFAULT 0,
    "completedExecutions" INTEGER NOT NULL DEFAULT 0,
    "failedExecutions" INTEGER NOT NULL DEFAULT 0,
    "avgCompletionTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "errorRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mostCommonError" TEXT,
    "performanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowQueueMetrics" (
    "id" TEXT NOT NULL,
    "queueName" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "waitingJobs" INTEGER NOT NULL DEFAULT 0,
    "activeJobs" INTEGER NOT NULL DEFAULT 0,
    "completedJobs" INTEGER NOT NULL DEFAULT 0,
    "failedJobs" INTEGER NOT NULL DEFAULT 0,
    "processingRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgProcessingTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "memoryUsageMb" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "WorkflowQueueMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "approvalLevel" TEXT NOT NULL,
    "operationData" JSONB NOT NULL,
    "justification" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyViolation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyViolation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessagingUsage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "messageCount" INTEGER NOT NULL,
    "credits" DOUBLE PRECISION NOT NULL,
    "provider" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "MessagingUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "paymentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SMSHistory_userId_idx" ON "SMSHistory"("userId");

-- CreateIndex
CREATE INDEX "SMSHistory_messageId_idx" ON "SMSHistory"("messageId");

-- CreateIndex
CREATE INDEX "SMSHistory_status_idx" ON "SMSHistory"("status");

-- CreateIndex
CREATE INDEX "SMSHistory_createdAt_idx" ON "SMSHistory"("createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppHistory_userId_idx" ON "WhatsAppHistory"("userId");

-- CreateIndex
CREATE INDEX "WhatsAppHistory_messageId_idx" ON "WhatsAppHistory"("messageId");

-- CreateIndex
CREATE INDEX "WhatsAppHistory_status_idx" ON "WhatsAppHistory"("status");

-- CreateIndex
CREATE INDEX "WhatsAppHistory_createdAt_idx" ON "WhatsAppHistory"("createdAt");

-- CreateIndex
CREATE INDEX "WorkflowAnalytics_dateRange_periodStart_idx" ON "WorkflowAnalytics"("dateRange", "periodStart");

-- CreateIndex
CREATE INDEX "WorkflowAnalytics_performanceScore_idx" ON "WorkflowAnalytics"("performanceScore");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowAnalytics_workflowId_dateRange_periodStart_key" ON "WorkflowAnalytics"("workflowId", "dateRange", "periodStart");

-- CreateIndex
CREATE INDEX "WorkflowQueueMetrics_queueName_timestamp_idx" ON "WorkflowQueueMetrics"("queueName", "timestamp");

-- CreateIndex
CREATE INDEX "WorkflowQueueMetrics_timestamp_idx" ON "WorkflowQueueMetrics"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalRequest_operationId_key" ON "ApprovalRequest"("operationId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_requesterId_idx" ON "ApprovalRequest"("requesterId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_approvedBy_idx" ON "ApprovalRequest"("approvedBy");

-- CreateIndex
CREATE INDEX "ApprovalRequest_status_idx" ON "ApprovalRequest"("status");

-- CreateIndex
CREATE INDEX "ApprovalRequest_expiresAt_idx" ON "ApprovalRequest"("expiresAt");

-- CreateIndex
CREATE INDEX "SafetyViolation_userId_idx" ON "SafetyViolation"("userId");

-- CreateIndex
CREATE INDEX "SafetyViolation_ruleId_idx" ON "SafetyViolation"("ruleId");

-- CreateIndex
CREATE INDEX "SafetyViolation_riskLevel_idx" ON "SafetyViolation"("riskLevel");

-- CreateIndex
CREATE INDEX "SafetyViolation_resolved_idx" ON "SafetyViolation"("resolved");

-- CreateIndex
CREATE INDEX "MessagingUsage_organizationId_idx" ON "MessagingUsage"("organizationId");

-- CreateIndex
CREATE INDEX "MessagingUsage_channel_idx" ON "MessagingUsage"("channel");

-- CreateIndex
CREATE INDEX "MessagingUsage_timestamp_idx" ON "MessagingUsage"("timestamp");

-- CreateIndex
CREATE INDEX "MessagingUsage_provider_idx" ON "MessagingUsage"("provider");

-- CreateIndex
CREATE INDEX "CreditTransaction_organizationId_idx" ON "CreditTransaction"("organizationId");

-- CreateIndex
CREATE INDEX "CreditTransaction_type_idx" ON "CreditTransaction"("type");

-- CreateIndex
CREATE INDEX "CreditTransaction_status_idx" ON "CreditTransaction"("status");

-- CreateIndex
CREATE INDEX "CreditTransaction_createdAt_idx" ON "CreditTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "AnonymousVisitor_lastVisit_isActive_idx" ON "AnonymousVisitor"("lastVisit", "isActive");

-- CreateIndex
CREATE INDEX "AnonymousVisitor_engagementScore_lastVisit_idx" ON "AnonymousVisitor"("engagementScore", "lastVisit");

-- CreateIndex
CREATE INDEX "LeadPulseTouchpoint_timestamp_type_idx" ON "LeadPulseTouchpoint"("timestamp", "type");

-- CreateIndex
CREATE INDEX "LeadPulseTouchpoint_visitorId_type_timestamp_idx" ON "LeadPulseTouchpoint"("visitorId", "type", "timestamp");

-- CreateIndex
CREATE INDEX "LeadPulseTouchpoint_type_timestamp_visitorId_idx" ON "LeadPulseTouchpoint"("type", "timestamp", "visitorId");

-- CreateIndex
CREATE INDEX "LeadPulseVisitor_lastVisit_isActive_idx" ON "LeadPulseVisitor"("lastVisit", "isActive");

-- CreateIndex
CREATE INDEX "LeadPulseVisitor_engagementScore_lastVisit_idx" ON "LeadPulseVisitor"("engagementScore", "lastVisit");

-- CreateIndex
CREATE INDEX "LeadPulseVisitor_country_lastVisit_idx" ON "LeadPulseVisitor"("country", "lastVisit");

-- CreateIndex
CREATE INDEX "Workflow_status_createdAt_idx" ON "Workflow"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Workflow_performanceScore_status_idx" ON "Workflow"("performanceScore", "status");

-- CreateIndex
CREATE INDEX "Workflow_createdById_status_idx" ON "Workflow"("createdById", "status");

-- CreateIndex
CREATE INDEX "WorkflowExecutionStep_status_scheduledFor_idx" ON "WorkflowExecutionStep"("status", "scheduledFor");

-- AddForeignKey
ALTER TABLE "SMSHistory" ADD CONSTRAINT "SMSHistory_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMSHistory" ADD CONSTRAINT "SMSHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppHistory" ADD CONSTRAINT "WhatsAppHistory_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppHistory" ADD CONSTRAINT "WhatsAppHistory_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WhatsAppTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppHistory" ADD CONSTRAINT "WhatsAppHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowAnalytics" ADD CONSTRAINT "WorkflowAnalytics_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyViolation" ADD CONSTRAINT "SafetyViolation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyViolation" ADD CONSTRAINT "SafetyViolation_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessagingUsage" ADD CONSTRAINT "MessagingUsage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
