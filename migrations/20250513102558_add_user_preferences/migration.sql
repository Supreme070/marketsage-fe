-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "company" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferences" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
DROP INDEX IF EXISTS "UserPreference_userId_key";
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- Check if foreign key exists before adding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'UserPreference_userId_fkey'
    ) THEN
        ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
