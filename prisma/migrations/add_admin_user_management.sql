-- Add Admin User Management Fields and Models

-- Add missing fields to User model for admin management
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP(3);

-- Update existing suspendedReason to suspensionReason for consistency
ALTER TABLE "User" RENAME COLUMN "suspendedReason" TO "suspensionReason";

-- Create NoteType enum
CREATE TYPE "NoteType" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- Create AdminNote table
CREATE TABLE "AdminNote" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT (gen_random_uuid()::text),
    "userId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "type" "NoteType" NOT NULL DEFAULT 'INFO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    
    CONSTRAINT "AdminNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AdminNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AdminNote_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create indexes for AdminNote
CREATE INDEX "AdminNote_userId_idx" ON "AdminNote"("userId");
CREATE INDEX "AdminNote_createdById_idx" ON "AdminNote"("createdById");
CREATE INDEX "AdminNote_type_idx" ON "AdminNote"("type");
CREATE INDEX "AdminNote_createdAt_idx" ON "AdminNote"("createdAt");

-- Add indexes for User admin management fields
CREATE INDEX "User_isSuspended_idx" ON "User"("isSuspended");
CREATE INDEX "User_lastActiveAt_idx" ON "User"("lastActiveAt");
CREATE INDEX "User_suspendedAt_idx" ON "User"("suspendedAt");