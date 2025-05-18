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

-- The rest of the CreateTable statements and AddForeignKey statements are removed
-- as they likely already exist and would cause conflicts
