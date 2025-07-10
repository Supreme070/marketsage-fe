-- CreateEnum for workflow version status
DO $$ BEGIN
 CREATE TYPE "WorkflowVersionStatus" AS ENUM ('draft', 'staging', 'production', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for deployment status
DO $$ BEGIN
 CREATE TYPE "DeploymentStatus" AS ENUM ('deploying', 'completed', 'failed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateTable for WorkflowVersion
CREATE TABLE "WorkflowVersion" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "description" TEXT,
    "status" "WorkflowVersionStatus" NOT NULL DEFAULT 'draft',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable for WorkflowDeployment
CREATE TABLE "WorkflowDeployment" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "fromVersionId" TEXT,
    "toVersionId" TEXT NOT NULL,
    "status" "DeploymentStatus" NOT NULL DEFAULT 'deploying',
    "deployedBy" TEXT NOT NULL,
    "deploymentNotes" TEXT,
    "affectedExecutions" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "rollbackPlan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable for WorkflowRollback
CREATE TABLE "WorkflowRollback" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "fromVersionId" TEXT NOT NULL,
    "toVersionId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "rolledBackBy" TEXT NOT NULL,
    "deploymentId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT DEFAULT '{}',

    CONSTRAINT "WorkflowRollback_pkey" PRIMARY KEY ("id")
);

-- CreateTable for WorkflowVersionComparison
CREATE TABLE "WorkflowVersionComparison" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "fromVersionId" TEXT NOT NULL,
    "toVersionId" TEXT NOT NULL,
    "comparison" TEXT NOT NULL,
    "riskAssessment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowVersionComparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable for WorkflowBranch (for development workflows)
CREATE TABLE "WorkflowBranch" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentVersionId" TEXT,
    "currentVersionId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable for WorkflowVersionTag
CREATE TABLE "WorkflowVersionTag" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowVersionTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable for WorkflowApproval (for governance)
CREATE TABLE "WorkflowApproval" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "approverUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "comments" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkflowVersion_workflowId_idx" ON "WorkflowVersion"("workflowId");
CREATE INDEX "WorkflowVersion_status_idx" ON "WorkflowVersion"("status");
CREATE INDEX "WorkflowVersion_version_idx" ON "WorkflowVersion"("version");
CREATE INDEX "WorkflowVersion_createdAt_idx" ON "WorkflowVersion"("createdAt");

CREATE INDEX "WorkflowDeployment_workflowId_idx" ON "WorkflowDeployment"("workflowId");
CREATE INDEX "WorkflowDeployment_status_idx" ON "WorkflowDeployment"("status");
CREATE INDEX "WorkflowDeployment_startedAt_idx" ON "WorkflowDeployment"("startedAt");

CREATE INDEX "WorkflowRollback_workflowId_idx" ON "WorkflowRollback"("workflowId");
CREATE INDEX "WorkflowRollback_timestamp_idx" ON "WorkflowRollback"("timestamp");

CREATE INDEX "WorkflowVersionComparison_workflowId_idx" ON "WorkflowVersionComparison"("workflowId");

CREATE INDEX "WorkflowBranch_workflowId_idx" ON "WorkflowBranch"("workflowId");
CREATE INDEX "WorkflowBranch_isActive_idx" ON "WorkflowBranch"("isActive");

CREATE INDEX "WorkflowVersionTag_versionId_idx" ON "WorkflowVersionTag"("versionId");
CREATE INDEX "WorkflowVersionTag_tag_idx" ON "WorkflowVersionTag"("tag");

CREATE INDEX "WorkflowApproval_versionId_idx" ON "WorkflowApproval"("versionId");
CREATE INDEX "WorkflowApproval_status_idx" ON "WorkflowApproval"("status");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "WorkflowVersion_workflowId_version_key" ON "WorkflowVersion"("workflowId", "version");
CREATE UNIQUE INDEX "WorkflowBranch_workflowId_name_key" ON "WorkflowBranch"("workflowId", "name");
CREATE UNIQUE INDEX "WorkflowVersionTag_versionId_tag_key" ON "WorkflowVersionTag"("versionId", "tag");
CREATE UNIQUE INDEX "WorkflowVersionComparison_fromVersionId_toVersionId_key" ON "WorkflowVersionComparison"("fromVersionId", "toVersionId");

-- AddForeignKey
ALTER TABLE "WorkflowVersion" ADD CONSTRAINT "WorkflowVersion_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowVersion" ADD CONSTRAINT "WorkflowVersion_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkflowDeployment" ADD CONSTRAINT "WorkflowDeployment_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowDeployment" ADD CONSTRAINT "WorkflowDeployment_fromVersionId_fkey" FOREIGN KEY ("fromVersionId") REFERENCES "WorkflowVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkflowDeployment" ADD CONSTRAINT "WorkflowDeployment_toVersionId_fkey" FOREIGN KEY ("toVersionId") REFERENCES "WorkflowVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkflowDeployment" ADD CONSTRAINT "WorkflowDeployment_deployedBy_fkey" FOREIGN KEY ("deployedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkflowRollback" ADD CONSTRAINT "WorkflowRollback_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowRollback" ADD CONSTRAINT "WorkflowRollback_fromVersionId_fkey" FOREIGN KEY ("fromVersionId") REFERENCES "WorkflowVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkflowRollback" ADD CONSTRAINT "WorkflowRollback_toVersionId_fkey" FOREIGN KEY ("toVersionId") REFERENCES "WorkflowVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkflowRollback" ADD CONSTRAINT "WorkflowRollback_rolledBackBy_fkey" FOREIGN KEY ("rolledBackBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkflowRollback" ADD CONSTRAINT "WorkflowRollback_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "WorkflowDeployment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WorkflowVersionComparison" ADD CONSTRAINT "WorkflowVersionComparison_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowVersionComparison" ADD CONSTRAINT "WorkflowVersionComparison_fromVersionId_fkey" FOREIGN KEY ("fromVersionId") REFERENCES "WorkflowVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowVersionComparison" ADD CONSTRAINT "WorkflowVersionComparison_toVersionId_fkey" FOREIGN KEY ("toVersionId") REFERENCES "WorkflowVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkflowBranch" ADD CONSTRAINT "WorkflowBranch_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowBranch" ADD CONSTRAINT "WorkflowBranch_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "WorkflowVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkflowBranch" ADD CONSTRAINT "WorkflowBranch_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "WorkflowVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkflowBranch" ADD CONSTRAINT "WorkflowBranch_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkflowVersionTag" ADD CONSTRAINT "WorkflowVersionTag_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "WorkflowVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowVersionTag" ADD CONSTRAINT "WorkflowVersionTag_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkflowApproval" ADD CONSTRAINT "WorkflowApproval_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "WorkflowVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowApproval" ADD CONSTRAINT "WorkflowApproval_approverUserId_fkey" FOREIGN KEY ("approverUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;