-- Add subscription tier enum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- Add tier and expiry to Organization table
ALTER TABLE "Organization" 
ADD COLUMN "subscriptionTier" "SubscriptionTier" DEFAULT 'FREE',
ADD COLUMN "subscriptionExpiresAt" TIMESTAMP,
ADD COLUMN "gracePeriodEndsAt" TIMESTAMP,
ADD COLUMN "featureUsage" JSONB DEFAULT '{}';

-- Add tier to SubscriptionPlan
ALTER TABLE "SubscriptionPlan" 
ADD COLUMN "tier" "SubscriptionTier" NOT NULL DEFAULT 'STARTER';

-- Create index for subscription checks
CREATE INDEX "Organization_subscriptionExpiresAt_idx" ON "Organization"("subscriptionExpiresAt");