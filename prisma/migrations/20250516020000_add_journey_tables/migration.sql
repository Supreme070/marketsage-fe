-- CreateTable
CREATE TABLE IF NOT EXISTS "Journey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Journey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "JourneyStage" (
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
CREATE TABLE IF NOT EXISTS "JourneyTransition" (
    "id" TEXT NOT NULL,
    "fromStageId" TEXT NOT NULL,
    "toStageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggerType" TEXT NOT NULL,
    "triggerDetails" JSONB,
    "conditions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JourneyTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ContactJourney" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "currentStageId" TEXT,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "completionDate" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "properties" JSONB,

    CONSTRAINT "ContactJourney_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ContactJourneyStage" (
    "id" TEXT NOT NULL,
    "contactJourneyId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitDate" TIMESTAMP(3),
    "duration" INTEGER,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "ContactJourneyStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ContactJourneyTransition" (
    "id" TEXT NOT NULL,
    "contactJourneyId" TEXT NOT NULL,
    "transitionId" TEXT NOT NULL,
    "fromStageId" TEXT NOT NULL,
    "toStageId" TEXT NOT NULL,
    "transitionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triggerDetails" JSONB,

    CONSTRAINT "ContactJourneyTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "JourneyMetric" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metricType" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION,
    "aggregationType" TEXT,
    "formula" TEXT,
    "isSuccess" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JourneyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "JourneyStageMetric" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metricType" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION,
    "aggregationType" TEXT,
    "formula" TEXT,
    "isSuccess" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JourneyStageMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "JourneyAnalytics" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalContacts" INTEGER NOT NULL DEFAULT 0,
    "stageDistribution" JSONB,
    "averageDuration" INTEGER,
    "conversionRate" DOUBLE PRECISION,
    "dropoffPoints" JSONB,
    "metrics" JSONB,

    CONSTRAINT "JourneyAnalytics_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'JourneyStage_journeyId_fkey'
    ) THEN
        ALTER TABLE "JourneyStage" ADD CONSTRAINT "JourneyStage_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'JourneyTransition_fromStageId_fkey'
    ) THEN
        ALTER TABLE "JourneyTransition" ADD CONSTRAINT "JourneyTransition_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "JourneyStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'JourneyTransition_toStageId_fkey'
    ) THEN
        ALTER TABLE "JourneyTransition" ADD CONSTRAINT "JourneyTransition_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "JourneyStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'ContactJourney_contactId_fkey'
    ) THEN
        ALTER TABLE "ContactJourney" ADD CONSTRAINT "ContactJourney_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'ContactJourney_journeyId_fkey'
    ) THEN
        ALTER TABLE "ContactJourney" ADD CONSTRAINT "ContactJourney_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'ContactJourney_currentStageId_fkey'
    ) THEN
        ALTER TABLE "ContactJourney" ADD CONSTRAINT "ContactJourney_currentStageId_fkey" FOREIGN KEY ("currentStageId") REFERENCES "JourneyStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'ContactJourneyStage_contactJourneyId_fkey'
    ) THEN
        ALTER TABLE "ContactJourneyStage" ADD CONSTRAINT "ContactJourneyStage_contactJourneyId_fkey" FOREIGN KEY ("contactJourneyId") REFERENCES "ContactJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'ContactJourneyStage_stageId_fkey'
    ) THEN
        ALTER TABLE "ContactJourneyStage" ADD CONSTRAINT "ContactJourneyStage_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "JourneyStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'ContactJourneyTransition_contactJourneyId_fkey'
    ) THEN
        ALTER TABLE "ContactJourneyTransition" ADD CONSTRAINT "ContactJourneyTransition_contactJourneyId_fkey" FOREIGN KEY ("contactJourneyId") REFERENCES "ContactJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'ContactJourneyTransition_transitionId_fkey'
    ) THEN
        ALTER TABLE "ContactJourneyTransition" ADD CONSTRAINT "ContactJourneyTransition_transitionId_fkey" FOREIGN KEY ("transitionId") REFERENCES "JourneyTransition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'ContactJourneyTransition_fromStageId_fkey'
    ) THEN
        ALTER TABLE "ContactJourneyTransition" ADD CONSTRAINT "ContactJourneyTransition_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "JourneyStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'ContactJourneyTransition_toStageId_fkey'
    ) THEN
        ALTER TABLE "ContactJourneyTransition" ADD CONSTRAINT "ContactJourneyTransition_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "JourneyStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'JourneyMetric_journeyId_fkey'
    ) THEN
        ALTER TABLE "JourneyMetric" ADD CONSTRAINT "JourneyMetric_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'JourneyStageMetric_stageId_fkey'
    ) THEN
        ALTER TABLE "JourneyStageMetric" ADD CONSTRAINT "JourneyStageMetric_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "JourneyStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'JourneyAnalytics_journeyId_fkey'
    ) THEN
        ALTER TABLE "JourneyAnalytics" ADD CONSTRAINT "JourneyAnalytics_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'Journey_createdById_fkey'
    ) THEN
        ALTER TABLE "Journey" ADD CONSTRAINT "Journey_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$; 