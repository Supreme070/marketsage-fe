-- Docker Schema Fix: Add missing fields to AnonymousVisitor model
-- Run this in your Docker PostgreSQL database

-- Add the missing fields to AnonymousVisitor table
ALTER TABLE "AnonymousVisitor" 
ADD COLUMN IF NOT EXISTS "visitCount" INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS "city" TEXT,
ADD COLUMN IF NOT EXISTS "country" TEXT,
ADD COLUMN IF NOT EXISTS "region" TEXT,
ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

-- Update existing records to have visitCount = totalVisits (if they exist)
UPDATE "AnonymousVisitor" 
SET "visitCount" = "totalVisits" 
WHERE "visitCount" IS NULL;

-- Optional: Add some sample location data for testing
UPDATE "AnonymousVisitor" 
SET 
  "city" = 'Lagos',
  "country" = 'Nigeria',
  "latitude" = 6.5244,
  "longitude" = 3.3792
WHERE "city" IS NULL 
  AND "id" IN (SELECT "id" FROM "AnonymousVisitor" LIMIT 5);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'AnonymousVisitor' 
ORDER BY column_name; 