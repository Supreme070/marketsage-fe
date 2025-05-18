-- CreateEnum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
        CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'IT_ADMIN', 'SUPER_ADMIN');
    END IF;
END $$;

-- CreateEnum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContactStatus') THEN
        CREATE TYPE "ContactStatus" AS ENUM ('ACTIVE', 'UNSUBSCRIBED', 'BOUNCED', 'SPAM');
    END IF;
END $$;

-- CreateEnum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ListType') THEN
        CREATE TYPE "ListType" AS ENUM ('STATIC', 'DYNAMIC');
    END IF;
END $$;

-- CreateEnum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CampaignStatus') THEN
        CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'PAUSED', 'CANCELLED');
    END IF;
END $$;

-- CreateEnum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ActivityType') THEN
        CREATE TYPE "ActivityType" AS ENUM ('SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'UNSUBSCRIBED', 'REPLIED', 'FAILED');
    END IF;
END $$;

-- CreateEnum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WATemplateStatus') THEN
        CREATE TYPE "WATemplateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
    END IF;
END $$;

-- CreateEnum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkflowStatus') THEN
        CREATE TYPE "WorkflowStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PAUSED', 'ARCHIVED');
    END IF;
END $$;

-- CreateEnum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkflowNodeType') THEN
        CREATE TYPE "WorkflowNodeType" AS ENUM ('TRIGGER', 'CONDITION', 'ACTION', 'DELAY', 'EMAIL', 'SMS', 'WHATSAPP', 'NOTIFICATION', 'WEBHOOK');
    END IF;
END $$;

-- CreateEnum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TriggerType') THEN
        CREATE TYPE "TriggerType" AS ENUM ('CONTACT_CREATED', 'CONTACT_UPDATED', 'EMAIL_OPENED', 'EMAIL_CLICKED', 'FORM_SUBMITTED', 'WEBHOOK', 'SCHEDULED');
    END IF;
END $$;

-- CreateEnum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EntityType') THEN
        CREATE TYPE "EntityType" AS ENUM ('EMAIL_CAMPAIGN', 'SMS_CAMPAIGN', 'WHATSAPP_CAMPAIGN', 'WORKFLOW', 'LIST', 'SEGMENT');
    END IF;
END $$;

-- CreateEnum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AnalyticsPeriod') THEN
        CREATE TYPE "AnalyticsPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');
    END IF;
END $$;

-- CreateEnum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IntegrationType') THEN
        CREATE TYPE "IntegrationType" AS ENUM ('ECOMMERCE_WOOCOMMERCE', 'ECOMMERCE_SHOPIFY', 'CRM_SALESFORCE', 'CRM_HUBSPOT', 'PAYMENT_STRIPE', 'PAYMENT_PAYPAL', 'WEBHOOK', 'API');
    END IF;
END $$;

-- CreateEnum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConnectionStatus') THEN
        CREATE TYPE "ConnectionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR');
    END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "role" "UserRole" NOT NULL DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "company" TEXT,
    "jobTitle" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "notes" TEXT,
    "tagsString" TEXT,
    "source" TEXT,
    "status" "ContactStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "List" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ListType" NOT NULL DEFAULT 'STATIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "List_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListMember" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Segment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rules" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Segment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "design" TEXT,
    "previewText" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "replyTo" TEXT,
    "templateId" TEXT,
    "content" TEXT,
    "design" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailActivity" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,

    CONSTRAINT "EmailActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SMSTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "variables" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "SMSTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SMSCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "from" TEXT NOT NULL,
    "templateId" TEXT,
    "content" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "SMSCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SMSActivity" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,

    CONSTRAINT "SMSActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "variables" TEXT NOT NULL,
    "category" TEXT,
    "status" "WATemplateStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "WhatsAppTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "from" TEXT NOT NULL,
    "templateId" TEXT,
    "content" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "WhatsAppCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppActivity" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,

    CONSTRAINT "WhatsAppActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'INACTIVE',
    "definition" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowNode" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "type" "WorkflowNodeType" NOT NULL,
    "name" TEXT,
    "config" TEXT NOT NULL,
    "positionX" DOUBLE PRECISION,
    "positionY" DOUBLE PRECISION,

    CONSTRAINT "WorkflowNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connection" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "condition" TEXT,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTrigger" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "type" "TriggerType" NOT NULL,
    "config" TEXT NOT NULL,

    CONSTRAINT "WorkflowTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analytics" (
    "id" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "period" "AnalyticsPeriod" NOT NULL,
    "metrics" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "config" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'INACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SMSCampaignLists" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SMSCampaignLists_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_WACampaignLists" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_WACampaignLists_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_WACampaignSegments" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_WACampaignSegments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CampaignLists" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CampaignLists_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CampaignSegments" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CampaignSegments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SMSCampaignSegments" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SMSCampaignSegments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ListMember_listId_contactId_key" ON "ListMember"("listId", "contactId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Connection_sourceId_targetId_key" ON "Connection"("sourceId", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Analytics_entityType_entityId_period_key" ON "Analytics"("entityType", "entityId", "period");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_SMSCampaignLists_B_index" ON "_SMSCampaignLists"("B");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_WACampaignLists_B_index" ON "_WACampaignLists"("B");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_WACampaignSegments_B_index" ON "_WACampaignSegments"("B");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_CampaignLists_B_index" ON "_CampaignLists"("B");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_CampaignSegments_B_index" ON "_CampaignSegments"("B");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_SMSCampaignSegments_B_index" ON "_SMSCampaignSegments"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "List" ADD CONSTRAINT "List_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListMember" ADD CONSTRAINT "ListMember_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListMember" ADD CONSTRAINT "ListMember_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Segment" ADD CONSTRAINT "Segment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailActivity" ADD CONSTRAINT "EmailActivity_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailActivity" ADD CONSTRAINT "EmailActivity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMSTemplate" ADD CONSTRAINT "SMSTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMSCampaign" ADD CONSTRAINT "SMSCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMSCampaign" ADD CONSTRAINT "SMSCampaign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SMSTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMSActivity" ADD CONSTRAINT "SMSActivity_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "SMSCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMSActivity" ADD CONSTRAINT "SMSActivity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppTemplate" ADD CONSTRAINT "WhatsAppTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppCampaign" ADD CONSTRAINT "WhatsAppCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppCampaign" ADD CONSTRAINT "WhatsAppCampaign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WhatsAppTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppActivity" ADD CONSTRAINT "WhatsAppActivity_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "WhatsAppCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppActivity" ADD CONSTRAINT "WhatsAppActivity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowNode" ADD CONSTRAINT "WorkflowNode_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "WorkflowNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "WorkflowNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTrigger" ADD CONSTRAINT "WorkflowTrigger_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SMSCampaignLists" ADD CONSTRAINT "_SMSCampaignLists_A_fkey" FOREIGN KEY ("A") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SMSCampaignLists" ADD CONSTRAINT "_SMSCampaignLists_B_fkey" FOREIGN KEY ("B") REFERENCES "SMSCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WACampaignLists" ADD CONSTRAINT "_WACampaignLists_A_fkey" FOREIGN KEY ("A") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WACampaignLists" ADD CONSTRAINT "_WACampaignLists_B_fkey" FOREIGN KEY ("B") REFERENCES "WhatsAppCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WACampaignSegments" ADD CONSTRAINT "_WACampaignSegments_A_fkey" FOREIGN KEY ("A") REFERENCES "Segment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WACampaignSegments" ADD CONSTRAINT "_WACampaignSegments_B_fkey" FOREIGN KEY ("B") REFERENCES "WhatsAppCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignLists" ADD CONSTRAINT "_CampaignLists_A_fkey" FOREIGN KEY ("A") REFERENCES "EmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignLists" ADD CONSTRAINT "_CampaignLists_B_fkey" FOREIGN KEY ("B") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignSegments" ADD CONSTRAINT "_CampaignSegments_A_fkey" FOREIGN KEY ("A") REFERENCES "EmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignSegments" ADD CONSTRAINT "_CampaignSegments_B_fkey" FOREIGN KEY ("B") REFERENCES "Segment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SMSCampaignSegments" ADD CONSTRAINT "_SMSCampaignSegments_A_fkey" FOREIGN KEY ("A") REFERENCES "SMSCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SMSCampaignSegments" ADD CONSTRAINT "_SMSCampaignSegments_B_fkey" FOREIGN KEY ("B") REFERENCES "Segment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- LeadPulse Models
-- CreateTable
CREATE TABLE IF NOT EXISTS "AnonymousVisitor" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "firstVisit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVisit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitCount" INTEGER NOT NULL DEFAULT 1,
    "isIdentified" BOOLEAN NOT NULL DEFAULT false,
    "contactId" TEXT,
    "metadata" JSONB,
    "geo" JSONB,
    "device" JSONB,
    "score" INTEGER NOT NULL DEFAULT 0,
    "engagementLevel" TEXT,

    CONSTRAINT "AnonymousVisitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LeadPulseTouchpoint" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER,
    "metadata" JSONB,
    "score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LeadPulseTouchpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LeadPulseForm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fields" JSONB NOT NULL,
    "design" JSONB,
    "thankyouMessage" TEXT,
    "redirectUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "submissionCount" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION,

    CONSTRAINT "LeadPulseForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LeadPulseJourney" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stage" TEXT NOT NULL DEFAULT 'AWARENESS',
    "completionDate" TIMESTAMP(3),
    "score" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,

    CONSTRAINT "LeadPulseJourney_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LeadPulseConfig" (
    "id" TEXT NOT NULL,
    "websiteUrl" TEXT NOT NULL,
    "trackingDomains" JSONB,
    "excludedPaths" JSONB,
    "visitorExpiry" INTEGER NOT NULL DEFAULT 90,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LeadPulseConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LeadPulseWhatsAppQR" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "number" TEXT NOT NULL,
    "message" TEXT,
    "qrImageUrl" TEXT,
    "scanCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LeadPulseWhatsAppQR_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AnonymousVisitor_fingerprint_key" ON "AnonymousVisitor"("fingerprint");

-- Add Foreign Keys for LeadPulse models
ALTER TABLE "AnonymousVisitor" ADD CONSTRAINT "AnonymousVisitor_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LeadPulseTouchpoint" ADD CONSTRAINT "LeadPulseTouchpoint_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "AnonymousVisitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LeadPulseForm" ADD CONSTRAINT "LeadPulseForm_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LeadPulseJourney" ADD CONSTRAINT "LeadPulseJourney_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "AnonymousVisitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LeadPulseConfig" ADD CONSTRAINT "LeadPulseConfig_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LeadPulseWhatsAppQR" ADD CONSTRAINT "LeadPulseWhatsAppQR_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
