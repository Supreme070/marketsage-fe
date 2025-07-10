-- CreateTable
CREATE TABLE "ProviderMetrics" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "deliveryRate" DOUBLE PRECISION NOT NULL,
    "averageDeliveryTime" DOUBLE PRECISION NOT NULL,
    "errorRate" DOUBLE PRECISION NOT NULL,
    "totalMessagesSent" INTEGER NOT NULL DEFAULT 0,
    "totalSuccessful" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseRetentionRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "dataType" TEXT NOT NULL,
    "retentionPeriod" INTEGER NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "schedule" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadPulseRetentionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseComplianceAlert" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadPulseComplianceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseDataSubjectRequest" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "requestDetails" TEXT,
    "verificationMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "responseData" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadPulseDataSubjectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderMetrics_provider_idx" ON "ProviderMetrics"("provider");

-- CreateIndex
CREATE INDEX "ProviderMetrics_channel_idx" ON "ProviderMetrics"("channel");

-- CreateIndex
CREATE INDEX "ProviderMetrics_region_idx" ON "ProviderMetrics"("region");

-- CreateIndex
CREATE INDEX "ProviderMetrics_lastUpdated_idx" ON "ProviderMetrics"("lastUpdated");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderMetrics_provider_channel_region_key" ON "ProviderMetrics"("provider", "channel", "region");

-- CreateIndex
CREATE INDEX "LeadPulseRetentionRule_enabled_idx" ON "LeadPulseRetentionRule"("enabled");

-- CreateIndex
CREATE INDEX "LeadPulseRetentionRule_dataType_idx" ON "LeadPulseRetentionRule"("dataType");

-- CreateIndex
CREATE INDEX "LeadPulseRetentionRule_retentionPeriod_idx" ON "LeadPulseRetentionRule"("retentionPeriod");

-- CreateIndex
CREATE INDEX "LeadPulseComplianceAlert_type_idx" ON "LeadPulseComplianceAlert"("type");

-- CreateIndex
CREATE INDEX "LeadPulseComplianceAlert_severity_idx" ON "LeadPulseComplianceAlert"("severity");

-- CreateIndex
CREATE INDEX "LeadPulseComplianceAlert_resolved_idx" ON "LeadPulseComplianceAlert"("resolved");

-- CreateIndex
CREATE INDEX "LeadPulseComplianceAlert_createdAt_idx" ON "LeadPulseComplianceAlert"("createdAt");

-- CreateIndex
CREATE INDEX "LeadPulseDataSubjectRequest_type_idx" ON "LeadPulseDataSubjectRequest"("type");

-- CreateIndex
CREATE INDEX "LeadPulseDataSubjectRequest_email_idx" ON "LeadPulseDataSubjectRequest"("email");

-- CreateIndex
CREATE INDEX "LeadPulseDataSubjectRequest_status_idx" ON "LeadPulseDataSubjectRequest"("status");

-- CreateIndex
CREATE INDEX "LeadPulseDataSubjectRequest_createdAt_idx" ON "LeadPulseDataSubjectRequest"("createdAt");
