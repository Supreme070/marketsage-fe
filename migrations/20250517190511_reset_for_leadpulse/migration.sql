-- CreateEnum
CREATE TYPE "ConversionStatus" AS ENUM ('ANONYMOUS', 'ENGAGED', 'QUALIFIED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "FormType" AS ENUM ('STANDARD', 'EXIT_INTENT', 'EMBEDDED', 'POPUP', 'CHATBOT', 'PROGRESSIVE');

-- CreateTable
CREATE TABLE "AnonymousVisitor" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "firstVisitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVisitedAt" TIMESTAMP(3) NOT NULL,
    "visits" INTEGER NOT NULL DEFAULT 1,
    "conversionStatus" "ConversionStatus" NOT NULL DEFAULT 'ANONYMOUS',
    "ipAddress" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "contactId" TEXT,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,

    CONSTRAINT "AnonymousVisitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseTouchpoint" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pageUrl" TEXT NOT NULL,
    "pageTitle" TEXT,
    "duration" INTEGER,
    "clickData" JSONB,
    "scrollDepth" INTEGER,
    "exitIntent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LeadPulseTouchpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseForm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "formType" "FormType" NOT NULL DEFAULT 'STANDARD',
    "fields" JSONB NOT NULL,
    "conditionalLogic" JSONB,
    "designSettings" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "conversionRate" DOUBLE PRECISION,
    "submissions" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LeadPulseForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseJourney" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "touchpoints" JSONB NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "predictedConversion" DOUBLE PRECISION,
    "predictedValue" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(3) NOT NULL,
    "convertedAt" TIMESTAMP(3),

    CONSTRAINT "LeadPulseJourney_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseWebhook" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[],
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LeadPulseWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseConfig" (
    "id" TEXT NOT NULL,
    "pixelId" TEXT NOT NULL,
    "websiteUrl" TEXT NOT NULL,
    "websiteName" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB NOT NULL,

    CONSTRAINT "LeadPulseConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPulseWhatsAppQR" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "message" TEXT,
    "qrCodeUrl" TEXT NOT NULL,
    "scans" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadPulseWhatsAppQR_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AnonymousVisitorToLeadPulseForm" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AnonymousVisitorToLeadPulseForm_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousVisitor_fingerprint_key" ON "AnonymousVisitor"("fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "LeadPulseConfig_pixelId_key" ON "LeadPulseConfig"("pixelId");

-- CreateIndex
CREATE INDEX "_AnonymousVisitorToLeadPulseForm_B_index" ON "_AnonymousVisitorToLeadPulseForm"("B");

-- AddForeignKey
ALTER TABLE "LeadPulseTouchpoint" ADD CONSTRAINT "LeadPulseTouchpoint_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "AnonymousVisitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPulseForm" ADD CONSTRAINT "LeadPulseForm_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPulseJourney" ADD CONSTRAINT "LeadPulseJourney_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "AnonymousVisitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPulseWebhook" ADD CONSTRAINT "LeadPulseWebhook_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPulseConfig" ADD CONSTRAINT "LeadPulseConfig_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPulseWhatsAppQR" ADD CONSTRAINT "LeadPulseWhatsAppQR_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AnonymousVisitorToLeadPulseForm" ADD CONSTRAINT "_AnonymousVisitorToLeadPulseForm_A_fkey" FOREIGN KEY ("A") REFERENCES "AnonymousVisitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AnonymousVisitorToLeadPulseForm" ADD CONSTRAINT "_AnonymousVisitorToLeadPulseForm_B_fkey" FOREIGN KEY ("B") REFERENCES "LeadPulseForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
