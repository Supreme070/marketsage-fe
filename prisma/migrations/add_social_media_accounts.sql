-- Add social media accounts table for multi-tenant OAuth connections
CREATE TABLE "SocialMediaAccount" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountName" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scope" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSync" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialMediaAccount_pkey" PRIMARY KEY ("id")
);

-- Add indexes for performance
CREATE INDEX "SocialMediaAccount_organizationId_idx" ON "SocialMediaAccount"("organizationId");
CREATE INDEX "SocialMediaAccount_userId_idx" ON "SocialMediaAccount"("userId");
CREATE INDEX "SocialMediaAccount_platform_idx" ON "SocialMediaAccount"("platform");
CREATE INDEX "SocialMediaAccount_organizationId_platform_idx" ON "SocialMediaAccount"("organizationId", "platform");

-- Add unique constraint to prevent duplicate active connections
CREATE UNIQUE INDEX "SocialMediaAccount_organizationId_platform_accountId_active_idx" 
ON "SocialMediaAccount"("organizationId", "platform", "accountId") 
WHERE "isActive" = true;