-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'IT_ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "ABTestStatus" AS ENUM ('DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ABTestType" AS ENUM ('SIMPLE_AB', 'MULTIVARIATE', 'ELEMENT');

-- CreateEnum
CREATE TYPE "ABTestMetric" AS ENUM ('OPEN_RATE', 'CLICK_RATE', 'CONVERSION_RATE', 'REVENUE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SecurityEventType" AS ENUM ('SUSPICIOUS_ACTIVITY', 'RATE_LIMIT_EXCEEDED', 'INVALID_INPUT', 'UNAUTHORIZED_ACCESS', 'DATA_BREACH_ATTEMPT', 'LOGIN_FAILURE', 'PERMISSION_DENIED', 'MALICIOUS_FILE_UPLOAD', 'XSS_ATTEMPT', 'SQL_INJECTION_ATTEMPT');

-- CreateEnum
CREATE TYPE "SecuritySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DataProcessingType" AS ENUM ('COLLECTION', 'PROCESSING', 'SHARING', 'DELETION', 'ACCESS', 'RECTIFICATION', 'RESTRICTION', 'PORTABILITY');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('MARKETING', 'ANALYTICS', 'FUNCTIONAL', 'NECESSARY', 'THIRD_PARTY_SHARING');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('ACTIVE', 'UNSUBSCRIBED', 'BOUNCED', 'SPAM');

-- CreateEnum
CREATE TYPE "ListType" AS ENUM ('STATIC', 'DYNAMIC');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'UNSUBSCRIBED', 'REPLIED', 'FAILED');

-- CreateEnum
CREATE TYPE "WATemplateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WorkflowNodeType" AS ENUM ('TRIGGER', 'CONDITION', 'ACTION', 'DELAY', 'EMAIL', 'SMS', 'WHATSAPP', 'NOTIFICATION', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('CONTACT_CREATED', 'CONTACT_UPDATED', 'EMAIL_OPENED', 'EMAIL_CLICKED', 'FORM_SUBMITTED', 'WEBHOOK', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('EMAIL_CAMPAIGN', 'SMS_CAMPAIGN', 'WHATSAPP_CAMPAIGN', 'WORKFLOW', 'LIST', 'SEGMENT');

-- CreateEnum
CREATE TYPE "AnalyticsPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('PENDING', 'ACTIVE', 'ERROR', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SmartSegmentStatus" AS ENUM ('PENDING', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentTemplateType" AS ENUM ('EMAIL_SUBJECT', 'EMAIL_BODY', 'SMS_MESSAGE', 'WHATSAPP_MESSAGE', 'PUSH_NOTIFICATION');

-- CreateEnum
CREATE TYPE "ConversionCategory" AS ENUM ('AWARENESS', 'CONSIDERATION', 'CONVERSION', 'RETENTION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ConversionValueType" AS ENUM ('COUNT', 'REVENUE', 'SCORE');

-- CreateEnum
CREATE TYPE "AttributionModel" AS ENUM ('FIRST_TOUCH', 'LAST_TOUCH', 'LINEAR', 'TIME_DECAY', 'POSITION_BASED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PredictionModelType" AS ENUM ('CHURN', 'LTV', 'CAMPAIGN_PERFORMANCE', 'SEND_TIME', 'OPEN_RATE', 'CLICK_RATE', 'CONVERSION_RATE');

-- CreateEnum
CREATE TYPE "ChurnRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "JourneyStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DROPPED', 'PAUSED');

-- CreateEnum
CREATE TYPE "TransitionTriggerType" AS ENUM ('AUTOMATIC', 'EVENT', 'CONVERSION', 'CONDITION', 'MANUAL');

-- CreateEnum
CREATE TYPE "JourneyMetricType" AS ENUM ('CONVERSION_RATE', 'CONTACTS_COUNT', 'DURATION', 'REVENUE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MetricAggregationType" AS ENUM ('SUM', 'AVERAGE', 'COUNT', 'MIN', 'MAX');

-- CreateEnum
CREATE TYPE "LeadPulseTouchpointType" AS ENUM ('PAGEVIEW', 'CLICK', 'FORM_VIEW', 'FORM_START', 'FORM_SUBMIT', 'CONVERSION');

-- CreateEnum
CREATE TYPE "LeadPulseInsightType" AS ENUM ('BEHAVIOR', 'PREDICTION', 'OPPORTUNITY', 'TREND');

-- CreateEnum
CREATE TYPE "LeadPulseImportance" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "FormStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FormLayout" AS ENUM ('SINGLE_COLUMN', 'TWO_COLUMN', 'MULTI_STEP', 'FLOATING_LABELS');

-- CreateEnum
CREATE TYPE "FormFieldType" AS ENUM ('TEXT', 'EMAIL', 'PHONE', 'NUMBER', 'TEXTAREA', 'SELECT', 'MULTISELECT', 'RADIO', 'CHECKBOX', 'DATE', 'TIME', 'DATETIME', 'FILE', 'HIDDEN', 'HTML', 'DIVIDER');

-- CreateEnum
CREATE TYPE "FormFieldWidth" AS ENUM ('QUARTER', 'THIRD', 'HALF', 'TWO_THIRDS', 'THREE_QUARTERS', 'FULL');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'SPAM', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "LeadQuality" AS ENUM ('UNKNOWN', 'COLD', 'WARM', 'HOT', 'QUALIFIED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED', 'TRIALING');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('CARD', 'BANK', 'USSD', 'BANK_TRANSFER', 'QR', 'MOBILE_MONEY');

-- CreateEnum
CREATE TYPE "WorkflowExecutionStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StepExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED', 'SCHEDULED');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "billingEmail" TEXT,
    "billingName" TEXT,
    "billingAddress" TEXT,
    "vatNumber" TEXT,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
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
    "organizationId" TEXT,
    "company" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferences" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "credentials" TEXT NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'PENDING',
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationSyncHistory" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "recordsProcessed" INTEGER,
    "error" TEXT,

    CONSTRAINT "IntegrationSyncHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
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
    "customFields" TEXT,
    "status" "ContactStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastEngaged" TIMESTAMP(3),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerProfile" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "totalTransactions" INTEGER NOT NULL DEFAULT 0,
    "totalValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "firstTransactionDate" TIMESTAMP(3),
    "lastTransactionDate" TIMESTAMP(3),
    "avgTimeBetweenTransactions" DOUBLE PRECISION,
    "avgTransactionValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementScore" INTEGER NOT NULL DEFAULT 0,
    "lastSeenDate" TIMESTAMP(3),
    "totalPageViews" INTEGER NOT NULL DEFAULT 0,
    "totalEmailOpens" INTEGER NOT NULL DEFAULT 0,
    "totalEmailClicks" INTEGER NOT NULL DEFAULT 0,
    "totalSMSResponses" INTEGER NOT NULL DEFAULT 0,
    "mostVisitedPage" TEXT,
    "preferredChannel" TEXT,
    "optimalContactTime" TEXT,
    "communicationFrequency" TEXT,
    "purchasePattern" TEXT,
    "engagementTrend" TEXT,
    "churnProbability" DOUBLE PRECISION DEFAULT 0,
    "churnRiskLevel" TEXT,
    "predictedLtv" DOUBLE PRECISION,
    "customerSegment" TEXT,
    "healthScore" INTEGER DEFAULT 50,
    "nextBestAction" JSONB,
    "lastActionDate" TIMESTAMP(3),
    "actionHistory" JSONB,
    "hasBirthday" BOOLEAN NOT NULL DEFAULT false,
    "nextBirthdayAction" TIMESTAMP(3),
    "specialDates" JSONB,
    "riskFactors" JSONB,
    "opportunities" JSONB,
    "aiConfidence" DOUBLE PRECISION DEFAULT 0.5,
    "modelVersion" TEXT DEFAULT '1.0',
    "lastPredictionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastCalculated" TIMESTAMP(3),

    CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIActionPlan" (
    "id" TEXT NOT NULL,
    "customerProfileId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduledFor" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "executedBy" TEXT,
    "executionResult" JSONB,
    "success" BOOLEAN,
    "customerResponse" JSONB,
    "impactMeasured" JSONB,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "riskLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIActionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerEvent" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "customerProfileId" TEXT,
    "organizationId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CustomerEvent_pkey" PRIMARY KEY ("id")
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
    "organizationId" TEXT,

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
CREATE TABLE "SegmentMember" (
    "id" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SegmentMember_pkey" PRIMARY KEY ("id")
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
    "organizationId" TEXT,

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
CREATE TABLE "ABTest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "status" "ABTestStatus" NOT NULL DEFAULT 'DRAFT',
    "testType" "ABTestType" NOT NULL,
    "testElements" TEXT NOT NULL,
    "winnerMetric" "ABTestMetric" NOT NULL,
    "winnerThreshold" DOUBLE PRECISION,
    "distributionPercent" DOUBLE PRECISION NOT NULL,
    "winnerVariantId" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "ABTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ABTestVariant" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "trafficPercent" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ABTestVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ABTestResult" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "metric" "ABTestMetric" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ABTestResult_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "WorkflowExecution" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "status" "WorkflowExecutionStatus" NOT NULL DEFAULT 'RUNNING',
    "currentStepId" TEXT,
    "context" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "lastExecutedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowExecutionStep" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "stepType" TEXT NOT NULL,
    "status" "StepExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "output" TEXT,
    "errorMessage" TEXT,

    CONSTRAINT "WorkflowExecutionStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseSecurityEvent" (
    "id" TEXT NOT NULL,
    "type" "SecurityEventType" NOT NULL,
    "severity" "SecuritySeverity" NOT NULL,
    "source" TEXT NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadPulseSecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseDataProcessingLog" (
    "id" TEXT NOT NULL,
    "type" "DataProcessingType" NOT NULL,
    "dataSubject" TEXT NOT NULL,
    "dataTypes" TEXT[],
    "purpose" TEXT NOT NULL,
    "legalBasis" TEXT NOT NULL,
    "processor" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retentionUntil" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadPulseDataProcessingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseAuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "changes" JSONB,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadPulseAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseConsent" (
    "id" TEXT NOT NULL,
    "contactId" TEXT,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "consentType" "ConsentType" NOT NULL,
    "purpose" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "grantedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "source" TEXT,
    "evidenceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadPulseConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseDataRetention" (
    "id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "retentionPeriod" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledDeletion" TIMESTAMP(3) NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LeadPulseDataRetention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowEvent" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT,
    "contactId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventData" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowEvent_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "EngagementTime" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "engagementType" "ActivityType" NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "hourOfDay" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngagementTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartSegment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rules" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "status" "SmartSegmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "industry" TEXT,
    "category" TEXT NOT NULL,
    "type" "ContentTemplateType" NOT NULL,
    "template" TEXT NOT NULL,
    "keywords" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentGeneration" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "prompt" TEXT,
    "result" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SendTimeOptimization" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "hourOfDay" INTEGER NOT NULL,
    "engagementScore" DOUBLE PRECISION NOT NULL,
    "confidenceLevel" DOUBLE PRECISION NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SendTimeOptimization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversionEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT NOT NULL,
    "category" "ConversionCategory" NOT NULL,
    "valueType" "ConversionValueType" NOT NULL DEFAULT 'COUNT',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "ConversionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversionTracking" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "contactId" TEXT,
    "value" DOUBLE PRECISION,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,
    "attributionModel" "AttributionModel" NOT NULL DEFAULT 'LAST_TOUCH',
    "touchPoints" TEXT,

    CONSTRAINT "ConversionTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversionFunnel" (
    "id" TEXT NOT NULL,
    "funnelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "steps" JSONB NOT NULL,
    "goalValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "ConversionFunnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversionFunnelReport" (
    "id" TEXT NOT NULL,
    "funnelId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversionFunnelReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributionSettings" (
    "id" TEXT NOT NULL,
    "defaultModel" "AttributionModel" NOT NULL DEFAULT 'LAST_TOUCH',
    "customWeights" TEXT,
    "lookbackWindow" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttributionSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentAnalysis" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "originalContent" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "ContentAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentRecommendation" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "originalContent" TEXT NOT NULL,
    "suggestedContent" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "impactScore" DOUBLE PRECISION NOT NULL,
    "isApplied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),
    "userId" TEXT,

    CONSTRAINT "ContentRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectLineTest" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "originalSubject" TEXT NOT NULL,
    "variants" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "winnerVariantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,

    CONSTRAINT "SubjectLineTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectLineTestResult" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "opens" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "sent" INTEGER NOT NULL DEFAULT 0,
    "openRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "clickRate" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "SubjectLineTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SentimentAnalysis" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "positive" TEXT NOT NULL,
    "negative" TEXT NOT NULL,
    "emotions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentimentAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPersonalization" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "originalContent" TEXT NOT NULL,
    "personalizedContent" TEXT NOT NULL,
    "replacements" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentPersonalization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionModel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PredictionModelType" NOT NULL,
    "description" TEXT,
    "algorithm" TEXT NOT NULL,
    "features" TEXT NOT NULL,
    "metrics" TEXT,
    "version" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PredictionModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "predictionType" "PredictionModelType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "features" TEXT,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChurnPrediction" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "riskLevel" "ChurnRiskLevel" NOT NULL,
    "topFactors" TEXT NOT NULL,
    "nextActionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChurnPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LifetimeValuePrediction" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "predictedValue" DOUBLE PRECISION NOT NULL,
    "confidenceLevel" DOUBLE PRECISION NOT NULL,
    "timeframe" INTEGER NOT NULL,
    "segments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LifetimeValuePrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignPerformancePrediction" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "openRate" DOUBLE PRECISION,
    "clickRate" DOUBLE PRECISION,
    "conversionRate" DOUBLE PRECISION,
    "revenue" DOUBLE PRECISION,
    "factors" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignPerformancePrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimalSendTime" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "channelType" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "hourOfDay" INTEGER NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "confidenceLevel" DOUBLE PRECISION NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptimalSendTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Journey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Journey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneyStage" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "expectedDuration" INTEGER,
    "conversionGoal" DOUBLE PRECISION,
    "isEntryPoint" BOOLEAN NOT NULL DEFAULT false,
    "isExitPoint" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JourneyStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneyTransition" (
    "id" TEXT NOT NULL,
    "fromStageId" TEXT NOT NULL,
    "toStageId" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "conditions" TEXT,
    "triggerType" "TransitionTriggerType" NOT NULL,
    "triggerDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JourneyTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactJourney" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "status" "JourneyStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "currentStageId" TEXT,

    CONSTRAINT "ContactJourney_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactJourneyStage" (
    "id" TEXT NOT NULL,
    "contactJourneyId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,

    CONSTRAINT "ContactJourneyStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactJourneyTransition" (
    "id" TEXT NOT NULL,
    "contactJourneyId" TEXT NOT NULL,
    "transitionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fromStageId" TEXT NOT NULL,
    "toStageId" TEXT NOT NULL,
    "triggerSource" TEXT,

    CONSTRAINT "ContactJourneyTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneyMetric" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metricType" "JourneyMetricType" NOT NULL,
    "targetValue" DOUBLE PRECISION,
    "aggregationType" "MetricAggregationType" NOT NULL DEFAULT 'SUM',
    "formula" TEXT,
    "isSuccess" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JourneyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneyStageMetric" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION,
    "actualValue" DOUBLE PRECISION,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JourneyStageMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneyAnalytics" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalContacts" INTEGER NOT NULL,
    "activeContacts" INTEGER NOT NULL,
    "completedContacts" INTEGER NOT NULL,
    "droppedContacts" INTEGER NOT NULL,
    "conversionRate" DOUBLE PRECISION NOT NULL,
    "averageDuration" INTEGER NOT NULL,
    "stageData" TEXT NOT NULL,

    CONSTRAINT "JourneyAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "contactId" TEXT,
    "segmentId" TEXT,
    "campaignId" TEXT,
    "regionId" TEXT,
    "organizationId" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskDependency" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "dependsOnTaskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AI_ContentAnalysis" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "supremeScore" INTEGER NOT NULL DEFAULT 0,
    "sentiment" DOUBLE PRECISION,
    "readability" INTEGER,
    "engagement" INTEGER,
    "analysis" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "AI_ContentAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AI_CustomerSegment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "criteria" TEXT,
    "customerCount" INTEGER NOT NULL DEFAULT 0,
    "churnRisk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lifetimeValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "AI_CustomerSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AI_ChatHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "context" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AI_ChatHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AI_Tool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "config" TEXT,
    "usage" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "AI_Tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseVisitor" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "firstVisit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVisit" TIMESTAMP(3) NOT NULL,
    "totalVisits" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "engagementScore" INTEGER NOT NULL DEFAULT 0,
    "engagementLevel" TEXT,
    "city" TEXT,
    "country" TEXT,
    "region" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "metadata" JSONB,
    "score" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadPulseVisitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnonymousVisitor" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "contactId" TEXT,
    "firstVisit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVisit" TIMESTAMP(3) NOT NULL,
    "totalVisits" INTEGER NOT NULL DEFAULT 1,
    "visitCount" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "engagementScore" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "city" TEXT,
    "country" TEXT,
    "region" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "AnonymousVisitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseJourney" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "lastUpdate" TIMESTAMP(3) NOT NULL,
    "stage" TEXT NOT NULL,
    "completionDate" TIMESTAMP(3),
    "score" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadPulseJourney_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseTouchpoint" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT,
    "anonymousVisitorId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "LeadPulseTouchpointType" NOT NULL,
    "url" TEXT,
    "duration" INTEGER,
    "value" INTEGER NOT NULL DEFAULT 1,
    "score" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadPulseTouchpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseSegment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "criteria" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadPulseSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseInsight" (
    "id" TEXT NOT NULL,
    "type" "LeadPulseInsightType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "importance" "LeadPulseImportance" NOT NULL,
    "metric" JSONB,
    "recommendation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadPulseInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseForm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "FormStatus" NOT NULL DEFAULT 'DRAFT',
    "theme" JSONB,
    "layout" "FormLayout" NOT NULL DEFAULT 'SINGLE_COLUMN',
    "settings" JSONB,
    "submitButtonText" TEXT NOT NULL DEFAULT 'Submit',
    "successMessage" TEXT NOT NULL DEFAULT 'Thank you for your submission!',
    "errorMessage" TEXT NOT NULL DEFAULT 'Something went wrong. Please try again.',
    "redirectUrl" TEXT,
    "isTrackingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "conversionGoal" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "embedCode" TEXT,
    "publicUrl" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadPulseForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseFormField" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "type" "FormFieldType" NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "placeholder" TEXT,
    "helpText" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "defaultValue" TEXT,
    "validation" JSONB,
    "options" JSONB,
    "fileTypes" TEXT[],
    "maxFileSize" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "width" "FormFieldWidth" NOT NULL DEFAULT 'FULL',
    "cssClasses" TEXT,
    "conditionalLogic" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadPulseFormField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseFormSubmission" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "visitorId" TEXT,
    "contactId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "score" INTEGER NOT NULL DEFAULT 0,
    "quality" "LeadQuality" NOT NULL DEFAULT 'UNKNOWN',
    "metadata" JSONB,

    CONSTRAINT "LeadPulseFormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseSubmissionData" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldType" "FormFieldType" NOT NULL,
    "value" TEXT,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadPulseSubmissionData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseFormAnalytics" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "uniqueViews" INTEGER NOT NULL DEFAULT 0,
    "fieldInteractions" INTEGER NOT NULL DEFAULT 0,
    "formStarts" INTEGER NOT NULL DEFAULT 0,
    "submissions" INTEGER NOT NULL DEFAULT 0,
    "completions" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageTime" INTEGER,
    "abandonmentRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fieldAnalytics" JSONB,
    "trafficSources" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadPulseFormAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "interval" TEXT NOT NULL DEFAULT 'monthly',
    "features" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paystackPlanId" TEXT,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "paystackSubscriptionId" TEXT,
    "paystackCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "paystackReference" TEXT NOT NULL,
    "paystackTransactionId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "last4" TEXT,
    "expMonth" INTEGER,
    "expYear" INTEGER,
    "brand" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "paystackAuthorizationCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "sentiment" TEXT,

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "productId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehavioralPrediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "predictions" TEXT NOT NULL,
    "segments" TEXT NOT NULL,
    "confidenceScores" TEXT NOT NULL,
    "explanatoryFactors" TEXT NOT NULL,
    "features" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BehavioralPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehavioralSegment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "criteria" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BehavioralSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseAlert" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dismissedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "LeadPulseAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulsePageView" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeOnPage" INTEGER,
    "metadata" JSONB,

    CONSTRAINT "LeadPulsePageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseAnalytics" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "userAgent" TEXT,
    "viewport" JSONB,
    "referrer" TEXT,
    "isNewVisitor" BOOLEAN NOT NULL DEFAULT false,
    "scrollAnalytics" JSONB,
    "clickHeatmap" JSONB,
    "behavioralInsights" JSONB,
    "engagementScore" INTEGER NOT NULL DEFAULT 0,
    "userIntent" TEXT NOT NULL DEFAULT 'browse',
    "conversionProbability" INTEGER NOT NULL DEFAULT 0,
    "frustrationSignals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadPulseAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SMSProvider" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "credentials" JSONB NOT NULL,
    "senderId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SMSProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppBusinessConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "businessAccountId" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "verifyToken" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "displayName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppBusinessConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDomainConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "spfVerified" BOOLEAN NOT NULL DEFAULT false,
    "dkimVerified" BOOLEAN NOT NULL DEFAULT false,
    "dmarcVerified" BOOLEAN NOT NULL DEFAULT false,
    "mxVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "lastChecked" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailDomainConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ContactToConversionEvent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ContactToConversionEvent_AB_pkey" PRIMARY KEY ("A","B")
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
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "UserSession_activityId_idx" ON "UserSession"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_email_key" ON "Contact"("email");

-- CreateIndex
CREATE INDEX "Contact_organizationId_idx" ON "Contact"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_contactId_key" ON "CustomerProfile"("contactId");

-- CreateIndex
CREATE INDEX "CustomerProfile_organizationId_idx" ON "CustomerProfile"("organizationId");

-- CreateIndex
CREATE INDEX "CustomerProfile_churnProbability_idx" ON "CustomerProfile"("churnProbability");

-- CreateIndex
CREATE INDEX "CustomerProfile_healthScore_idx" ON "CustomerProfile"("healthScore");

-- CreateIndex
CREATE INDEX "CustomerProfile_customerSegment_idx" ON "CustomerProfile"("customerSegment");

-- CreateIndex
CREATE INDEX "CustomerProfile_lastCalculated_idx" ON "CustomerProfile"("lastCalculated");

-- CreateIndex
CREATE INDEX "AIActionPlan_organizationId_status_idx" ON "AIActionPlan"("organizationId", "status");

-- CreateIndex
CREATE INDEX "AIActionPlan_customerProfileId_idx" ON "AIActionPlan"("customerProfileId");

-- CreateIndex
CREATE INDEX "AIActionPlan_scheduledFor_idx" ON "AIActionPlan"("scheduledFor");

-- CreateIndex
CREATE INDEX "CustomerEvent_organizationId_processed_idx" ON "CustomerEvent"("organizationId", "processed");

-- CreateIndex
CREATE INDEX "CustomerEvent_contactId_idx" ON "CustomerEvent"("contactId");

-- CreateIndex
CREATE INDEX "CustomerEvent_timestamp_idx" ON "CustomerEvent"("timestamp");

-- CreateIndex
CREATE INDEX "List_organizationId_idx" ON "List"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ListMember_listId_contactId_key" ON "ListMember"("listId", "contactId");

-- CreateIndex
CREATE UNIQUE INDEX "SegmentMember_segmentId_contactId_key" ON "SegmentMember"("segmentId", "contactId");

-- CreateIndex
CREATE INDEX "EmailCampaign_organizationId_idx" ON "EmailCampaign"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ABTestResult_testId_variantId_metric_key" ON "ABTestResult"("testId", "variantId", "metric");

-- CreateIndex
CREATE UNIQUE INDEX "Connection_sourceId_targetId_key" ON "Connection"("sourceId", "targetId");

-- CreateIndex
CREATE INDEX "WorkflowExecution_status_lastExecutedAt_idx" ON "WorkflowExecution"("status", "lastExecutedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowExecution_workflowId_contactId_key" ON "WorkflowExecution"("workflowId", "contactId");

-- CreateIndex
CREATE INDEX "WorkflowExecutionStep_executionId_stepId_idx" ON "WorkflowExecutionStep"("executionId", "stepId");

-- CreateIndex
CREATE INDEX "LeadPulseSecurityEvent_type_severity_timestamp_idx" ON "LeadPulseSecurityEvent"("type", "severity", "timestamp");

-- CreateIndex
CREATE INDEX "LeadPulseSecurityEvent_userId_timestamp_idx" ON "LeadPulseSecurityEvent"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "LeadPulseSecurityEvent_ipAddress_timestamp_idx" ON "LeadPulseSecurityEvent"("ipAddress", "timestamp");

-- CreateIndex
CREATE INDEX "LeadPulseDataProcessingLog_dataSubject_timestamp_idx" ON "LeadPulseDataProcessingLog"("dataSubject", "timestamp");

-- CreateIndex
CREATE INDEX "LeadPulseDataProcessingLog_type_timestamp_idx" ON "LeadPulseDataProcessingLog"("type", "timestamp");

-- CreateIndex
CREATE INDEX "LeadPulseDataProcessingLog_retentionUntil_idx" ON "LeadPulseDataProcessingLog"("retentionUntil");

-- CreateIndex
CREATE INDEX "LeadPulseAuditLog_resource_resourceId_timestamp_idx" ON "LeadPulseAuditLog"("resource", "resourceId", "timestamp");

-- CreateIndex
CREATE INDEX "LeadPulseAuditLog_userId_timestamp_idx" ON "LeadPulseAuditLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "LeadPulseAuditLog_action_timestamp_idx" ON "LeadPulseAuditLog"("action", "timestamp");

-- CreateIndex
CREATE INDEX "LeadPulseConsent_email_consentType_idx" ON "LeadPulseConsent"("email", "consentType");

-- CreateIndex
CREATE INDEX "LeadPulseConsent_contactId_idx" ON "LeadPulseConsent"("contactId");

-- CreateIndex
CREATE INDEX "LeadPulseConsent_granted_grantedAt_idx" ON "LeadPulseConsent"("granted", "grantedAt");

-- CreateIndex
CREATE INDEX "LeadPulseDataRetention_resource_resourceId_idx" ON "LeadPulseDataRetention"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "LeadPulseDataRetention_scheduledDeletion_deleted_idx" ON "LeadPulseDataRetention"("scheduledDeletion", "deleted");

-- CreateIndex
CREATE INDEX "LeadPulseDataRetention_dataType_scheduledDeletion_idx" ON "LeadPulseDataRetention"("dataType", "scheduledDeletion");

-- CreateIndex
CREATE INDEX "WorkflowEvent_eventType_processed_createdAt_idx" ON "WorkflowEvent"("eventType", "processed", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Analytics_entityType_entityId_period_key" ON "Analytics"("entityType", "entityId", "period");

-- CreateIndex
CREATE INDEX "EngagementTime_contactId_entityType_engagementType_idx" ON "EngagementTime"("contactId", "entityType", "engagementType");

-- CreateIndex
CREATE INDEX "EngagementTime_dayOfWeek_hourOfDay_idx" ON "EngagementTime"("dayOfWeek", "hourOfDay");

-- CreateIndex
CREATE UNIQUE INDEX "SendTimeOptimization_contactId_dayOfWeek_hourOfDay_key" ON "SendTimeOptimization"("contactId", "dayOfWeek", "hourOfDay");

-- CreateIndex
CREATE INDEX "ConversionTracking_entityType_entityId_idx" ON "ConversionTracking"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ConversionTracking_contactId_idx" ON "ConversionTracking"("contactId");

-- CreateIndex
CREATE INDEX "ConversionTracking_eventId_idx" ON "ConversionTracking"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversionFunnel_funnelId_key" ON "ConversionFunnel"("funnelId");

-- CreateIndex
CREATE INDEX "ConversionFunnel_organizationId_idx" ON "ConversionFunnel"("organizationId");

-- CreateIndex
CREATE INDEX "ConversionFunnel_funnelId_idx" ON "ConversionFunnel"("funnelId");

-- CreateIndex
CREATE INDEX "ConversionFunnel_isActive_idx" ON "ConversionFunnel"("isActive");

-- CreateIndex
CREATE INDEX "SubjectLineTest_campaignId_idx" ON "SubjectLineTest"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectLineTestResult_testId_variantId_key" ON "SubjectLineTestResult"("testId", "variantId");

-- CreateIndex
CREATE INDEX "SentimentAnalysis_entityType_entityId_idx" ON "SentimentAnalysis"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ContentPersonalization_campaignId_idx" ON "ContentPersonalization"("campaignId");

-- CreateIndex
CREATE INDEX "ContentPersonalization_contactId_idx" ON "ContentPersonalization"("contactId");

-- CreateIndex
CREATE INDEX "Prediction_entityType_entityId_idx" ON "Prediction"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Prediction_predictionType_idx" ON "Prediction"("predictionType");

-- CreateIndex
CREATE INDEX "ChurnPrediction_contactId_idx" ON "ChurnPrediction"("contactId");

-- CreateIndex
CREATE INDEX "ChurnPrediction_riskLevel_idx" ON "ChurnPrediction"("riskLevel");

-- CreateIndex
CREATE INDEX "LifetimeValuePrediction_contactId_idx" ON "LifetimeValuePrediction"("contactId");

-- CreateIndex
CREATE INDEX "CampaignPerformancePrediction_campaignId_idx" ON "CampaignPerformancePrediction"("campaignId");

-- CreateIndex
CREATE INDEX "OptimalSendTime_contactId_channelType_idx" ON "OptimalSendTime"("contactId", "channelType");

-- CreateIndex
CREATE UNIQUE INDEX "OptimalSendTime_contactId_channelType_dayOfWeek_hourOfDay_key" ON "OptimalSendTime"("contactId", "channelType", "dayOfWeek", "hourOfDay");

-- CreateIndex
CREATE UNIQUE INDEX "JourneyTransition_fromStageId_toStageId_key" ON "JourneyTransition"("fromStageId", "toStageId");

-- CreateIndex
CREATE INDEX "ContactJourney_journeyId_contactId_idx" ON "ContactJourney"("journeyId", "contactId");

-- CreateIndex
CREATE INDEX "ContactJourney_status_idx" ON "ContactJourney"("status");

-- CreateIndex
CREATE INDEX "ContactJourneyStage_contactJourneyId_idx" ON "ContactJourneyStage"("contactJourneyId");

-- CreateIndex
CREATE INDEX "ContactJourneyStage_stageId_enteredAt_idx" ON "ContactJourneyStage"("stageId", "enteredAt");

-- CreateIndex
CREATE INDEX "ContactJourneyTransition_contactJourneyId_idx" ON "ContactJourneyTransition"("contactJourneyId");

-- CreateIndex
CREATE INDEX "ContactJourneyTransition_transitionId_idx" ON "ContactJourneyTransition"("transitionId");

-- CreateIndex
CREATE UNIQUE INDEX "JourneyStageMetric_stageId_metricId_key" ON "JourneyStageMetric"("stageId", "metricId");

-- CreateIndex
CREATE UNIQUE INDEX "JourneyAnalytics_journeyId_date_key" ON "JourneyAnalytics"("journeyId", "date");

-- CreateIndex
CREATE INDEX "Task_organizationId_idx" ON "Task"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskDependency_taskId_dependsOnTaskId_key" ON "TaskDependency"("taskId", "dependsOnTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadPulseVisitor_fingerprint_key" ON "LeadPulseVisitor"("fingerprint");

-- CreateIndex
CREATE INDEX "LeadPulseVisitor_fingerprint_idx" ON "LeadPulseVisitor"("fingerprint");

-- CreateIndex
CREATE INDEX "LeadPulseVisitor_lastVisit_idx" ON "LeadPulseVisitor"("lastVisit");

-- CreateIndex
CREATE INDEX "LeadPulseVisitor_isActive_idx" ON "LeadPulseVisitor"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousVisitor_fingerprint_key" ON "AnonymousVisitor"("fingerprint");

-- CreateIndex
CREATE INDEX "AnonymousVisitor_fingerprint_idx" ON "AnonymousVisitor"("fingerprint");

-- CreateIndex
CREATE INDEX "AnonymousVisitor_lastVisit_idx" ON "AnonymousVisitor"("lastVisit");

-- CreateIndex
CREATE INDEX "LeadPulseJourney_visitorId_idx" ON "LeadPulseJourney"("visitorId");

-- CreateIndex
CREATE INDEX "LeadPulseJourney_stage_idx" ON "LeadPulseJourney"("stage");

-- CreateIndex
CREATE INDEX "LeadPulseTouchpoint_visitorId_timestamp_idx" ON "LeadPulseTouchpoint"("visitorId", "timestamp");

-- CreateIndex
CREATE INDEX "LeadPulseTouchpoint_anonymousVisitorId_timestamp_idx" ON "LeadPulseTouchpoint"("anonymousVisitorId", "timestamp");

-- CreateIndex
CREATE INDEX "LeadPulseTouchpoint_type_idx" ON "LeadPulseTouchpoint"("type");

-- CreateIndex
CREATE INDEX "LeadPulseForm_status_idx" ON "LeadPulseForm"("status");

-- CreateIndex
CREATE INDEX "LeadPulseForm_isPublished_idx" ON "LeadPulseForm"("isPublished");

-- CreateIndex
CREATE INDEX "LeadPulseForm_createdBy_idx" ON "LeadPulseForm"("createdBy");

-- CreateIndex
CREATE INDEX "LeadPulseFormField_formId_order_idx" ON "LeadPulseFormField"("formId", "order");

-- CreateIndex
CREATE INDEX "LeadPulseFormField_type_idx" ON "LeadPulseFormField"("type");

-- CreateIndex
CREATE INDEX "LeadPulseFormSubmission_formId_submittedAt_idx" ON "LeadPulseFormSubmission"("formId", "submittedAt");

-- CreateIndex
CREATE INDEX "LeadPulseFormSubmission_visitorId_idx" ON "LeadPulseFormSubmission"("visitorId");

-- CreateIndex
CREATE INDEX "LeadPulseFormSubmission_contactId_idx" ON "LeadPulseFormSubmission"("contactId");

-- CreateIndex
CREATE INDEX "LeadPulseFormSubmission_status_idx" ON "LeadPulseFormSubmission"("status");

-- CreateIndex
CREATE INDEX "LeadPulseSubmissionData_submissionId_idx" ON "LeadPulseSubmissionData"("submissionId");

-- CreateIndex
CREATE INDEX "LeadPulseSubmissionData_fieldId_idx" ON "LeadPulseSubmissionData"("fieldId");

-- CreateIndex
CREATE INDEX "LeadPulseSubmissionData_fieldName_idx" ON "LeadPulseSubmissionData"("fieldName");

-- CreateIndex
CREATE INDEX "LeadPulseFormAnalytics_formId_idx" ON "LeadPulseFormAnalytics"("formId");

-- CreateIndex
CREATE INDEX "LeadPulseFormAnalytics_date_idx" ON "LeadPulseFormAnalytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "LeadPulseFormAnalytics_formId_date_key" ON "LeadPulseFormAnalytics"("formId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_paystackReference_key" ON "Transaction"("paystackReference");

-- CreateIndex
CREATE INDEX "UserActivity_userId_timestamp_idx" ON "UserActivity"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "UserActivity_type_idx" ON "UserActivity"("type");

-- CreateIndex
CREATE INDEX "Purchase_activityId_idx" ON "Purchase"("activityId");

-- CreateIndex
CREATE INDEX "Interaction_activityId_idx" ON "Interaction"("activityId");

-- CreateIndex
CREATE INDEX "BehavioralPrediction_userId_createdAt_idx" ON "BehavioralPrediction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "BehavioralPrediction_modelId_idx" ON "BehavioralPrediction"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "BehavioralSegment_name_key" ON "BehavioralSegment"("name");

-- CreateIndex
CREATE INDEX "LeadPulseAlert_type_status_idx" ON "LeadPulseAlert"("type", "status");

-- CreateIndex
CREATE INDEX "LeadPulseAlert_priority_createdAt_idx" ON "LeadPulseAlert"("priority", "createdAt");

-- CreateIndex
CREATE INDEX "LeadPulsePageView_visitorId_timestamp_idx" ON "LeadPulsePageView"("visitorId", "timestamp");

-- CreateIndex
CREATE INDEX "LeadPulsePageView_url_idx" ON "LeadPulsePageView"("url");

-- CreateIndex
CREATE UNIQUE INDEX "LeadPulseAnalytics_sessionId_key" ON "LeadPulseAnalytics"("sessionId");

-- CreateIndex
CREATE INDEX "LeadPulseAnalytics_sessionId_idx" ON "LeadPulseAnalytics"("sessionId");

-- CreateIndex
CREATE INDEX "LeadPulseAnalytics_visitorId_startTime_idx" ON "LeadPulseAnalytics"("visitorId", "startTime");

-- CreateIndex
CREATE INDEX "LeadPulseAnalytics_page_startTime_idx" ON "LeadPulseAnalytics"("page", "startTime");

-- CreateIndex
CREATE INDEX "LeadPulseAnalytics_engagementScore_idx" ON "LeadPulseAnalytics"("engagementScore");

-- CreateIndex
CREATE INDEX "LeadPulseAnalytics_userIntent_idx" ON "LeadPulseAnalytics"("userIntent");

-- CreateIndex
CREATE INDEX "LeadPulseAnalytics_conversionProbability_idx" ON "LeadPulseAnalytics"("conversionProbability");

-- CreateIndex
CREATE UNIQUE INDEX "SMSProvider_organizationId_key" ON "SMSProvider"("organizationId");

-- CreateIndex
CREATE INDEX "SMSProvider_organizationId_idx" ON "SMSProvider"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppBusinessConfig_organizationId_key" ON "WhatsAppBusinessConfig"("organizationId");

-- CreateIndex
CREATE INDEX "WhatsAppBusinessConfig_organizationId_idx" ON "WhatsAppBusinessConfig"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailDomainConfig_organizationId_key" ON "EmailDomainConfig"("organizationId");

-- CreateIndex
CREATE INDEX "EmailDomainConfig_organizationId_idx" ON "EmailDomainConfig"("organizationId");

-- CreateIndex
CREATE INDEX "_ContactToConversionEvent_B_index" ON "_ContactToConversionEvent"("B");

-- CreateIndex
CREATE INDEX "_SMSCampaignLists_B_index" ON "_SMSCampaignLists"("B");

-- CreateIndex
CREATE INDEX "_WACampaignLists_B_index" ON "_WACampaignLists"("B");

-- CreateIndex
CREATE INDEX "_WACampaignSegments_B_index" ON "_WACampaignSegments"("B");

-- CreateIndex
CREATE INDEX "_CampaignLists_B_index" ON "_CampaignLists"("B");

-- CreateIndex
CREATE INDEX "_CampaignSegments_B_index" ON "_CampaignSegments"("B");

-- CreateIndex
CREATE INDEX "_SMSCampaignSegments_B_index" ON "_SMSCampaignSegments"("B");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "UserActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSyncHistory" ADD CONSTRAINT "IntegrationSyncHistory_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIActionPlan" ADD CONSTRAINT "AIActionPlan_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIActionPlan" ADD CONSTRAINT "AIActionPlan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIActionPlan" ADD CONSTRAINT "AIActionPlan_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIActionPlan" ADD CONSTRAINT "AIActionPlan_executedBy_fkey" FOREIGN KEY ("executedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerEvent" ADD CONSTRAINT "CustomerEvent_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerEvent" ADD CONSTRAINT "CustomerEvent_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "CustomerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerEvent" ADD CONSTRAINT "CustomerEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "List" ADD CONSTRAINT "List_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "List" ADD CONSTRAINT "List_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListMember" ADD CONSTRAINT "ListMember_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListMember" ADD CONSTRAINT "ListMember_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentMember" ADD CONSTRAINT "SegmentMember_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "Segment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentMember" ADD CONSTRAINT "SegmentMember_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Segment" ADD CONSTRAINT "Segment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailActivity" ADD CONSTRAINT "EmailActivity_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailActivity" ADD CONSTRAINT "EmailActivity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMSTemplate" ADD CONSTRAINT "SMSTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABTest" ADD CONSTRAINT "ABTest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABTestVariant" ADD CONSTRAINT "ABTestVariant_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ABTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABTestResult" ADD CONSTRAINT "ABTestResult_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ABTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABTestResult" ADD CONSTRAINT "ABTestResult_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ABTestVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowExecutionStep" ADD CONSTRAINT "WorkflowExecutionStep_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "WorkflowExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPulseSecurityEvent" ADD CONSTRAINT "LeadPulseSecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPulseAuditLog" ADD CONSTRAINT "LeadPulseAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPulseConsent" ADD CONSTRAINT "LeadPulseConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPulseConsent" ADD CONSTRAINT "LeadPulseConsent_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowEvent" ADD CONSTRAINT "WorkflowEvent_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowEvent" ADD CONSTRAINT "WorkflowEvent_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversionEvent" ADD CONSTRAINT "ConversionEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversionTracking" ADD CONSTRAINT "ConversionTracking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ConversionEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversionTracking" ADD CONSTRAINT "ConversionTracking_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversionFunnel" ADD CONSTRAINT "ConversionFunnel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversionFunnel" ADD CONSTRAINT "ConversionFunnel_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversionFunnelReport" ADD CONSTRAINT "ConversionFunnelReport_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "ConversionFunnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAnalysis" ADD CONSTRAINT "ContentAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRecommendation" ADD CONSTRAINT "ContentRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectLineTest" ADD CONSTRAINT "SubjectLineTest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectLineTestResult" ADD CONSTRAINT "SubjectLineTestResult_testId_fkey" FOREIGN KEY ("testId") REFERENCES "SubjectLineTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "PredictionModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journey" ADD CONSTRAINT "Journey_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyStage" ADD CONSTRAINT "JourneyStage_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyTransition" ADD CONSTRAINT "JourneyTransition_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "JourneyStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyTransition" ADD CONSTRAINT "JourneyTransition_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "JourneyStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactJourney" ADD CONSTRAINT "ContactJourney_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactJourney" ADD CONSTRAINT "ContactJourney_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactJourneyStage" ADD CONSTRAINT "ContactJourneyStage_contactJourneyId_fkey" FOREIGN KEY ("contactJourneyId") REFERENCES "ContactJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactJourneyStage" ADD CONSTRAINT "ContactJourneyStage_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "JourneyStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactJourneyTransition" ADD CONSTRAINT "ContactJourneyTransition_contactJourneyId_fkey" FOREIGN KEY ("contactJourneyId") REFERENCES "ContactJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactJourneyTransition" ADD CONSTRAINT "ContactJourneyTransition_transitionId_fkey" FOREIGN KEY ("transitionId") REFERENCES "JourneyTransition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyMetric" ADD CONSTRAINT "JourneyMetric_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyStageMetric" ADD CONSTRAINT "JourneyStageMetric_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "JourneyStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyStageMetric" ADD CONSTRAINT "JourneyStageMetric_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "JourneyMetric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_dependsOnTaskId_fkey" FOREIGN KEY ("dependsOnTaskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AI_ContentAnalysis" ADD CONSTRAINT "AI_ContentAnalysis_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AI_CustomerSegment" ADD CONSTRAINT "AI_CustomerSegment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AI_ChatHistory" ADD CONSTRAINT "AI_ChatHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AI_Tool" ADD CONSTRAINT "AI_Tool_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPulseJourney" ADD CONSTRAINT "LeadPulseJourney_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "AnonymousVisitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPulseTouchpoint" ADD CONSTRAINT "LeadPulseTouchpoint_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "LeadPulseVisitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPulseTouchpoint" ADD CONSTRAINT "LeadPulseTouchpoint_anonymousVisitorId_fkey" FOREIGN KEY ("anonymousVisitorId") REFERENCES "AnonymousVisitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPulseForm" ADD CONSTRAINT "LeadPulseForm_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPulseFormField" ADD CONSTRAINT "LeadPulseFormField_formId_fkey" FOREIGN KEY ("formId") REFERENCES "LeadPulseForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPulseFormSubmission" ADD CONSTRAINT "LeadPulseFormSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "LeadPulseForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPulseFormSubmission" ADD CONSTRAINT "LeadPulseFormSubmission_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "LeadPulseVisitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPulseFormSubmission" ADD CONSTRAINT "LeadPulseFormSubmission_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPulseSubmissionData" ADD CONSTRAINT "LeadPulseSubmissionData_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "LeadPulseFormSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPulseSubmissionData" ADD CONSTRAINT "LeadPulseSubmissionData_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "LeadPulseFormField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPulseFormAnalytics" ADD CONSTRAINT "LeadPulseFormAnalytics_formId_fkey" FOREIGN KEY ("formId") REFERENCES "LeadPulseForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "UserActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "UserActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehavioralPrediction" ADD CONSTRAINT "BehavioralPrediction_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "PredictionModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPulseAnalytics" ADD CONSTRAINT "LeadPulseAnalytics_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "LeadPulseVisitor"("fingerprint") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMSProvider" ADD CONSTRAINT "SMSProvider_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppBusinessConfig" ADD CONSTRAINT "WhatsAppBusinessConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDomainConfig" ADD CONSTRAINT "EmailDomainConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContactToConversionEvent" ADD CONSTRAINT "_ContactToConversionEvent_A_fkey" FOREIGN KEY ("A") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContactToConversionEvent" ADD CONSTRAINT "_ContactToConversionEvent_B_fkey" FOREIGN KEY ("B") REFERENCES "ConversionEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
