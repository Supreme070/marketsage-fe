-- Update official users with the README passwords
UPDATE "User" SET "password" = 'MS_Super2025!' WHERE "email" = 'supreme@marketsage.africa';
UPDATE "User" SET "password" = 'MS_Admin2025!' WHERE "email" = 'anita@marketsage.africa';
UPDATE "User" SET "password" = 'MS_ITAdmin2025!' WHERE "email" = 'kola@marketsage.africa';
UPDATE "User" SET "password" = 'MS_User2025!' WHERE "email" = 'user@marketsage.africa';

-- Update test users with the plaintext passwords
UPDATE "User" SET "password" = 'password1234' WHERE "email" = 'admin@marketsage.local';
UPDATE "User" SET "password" = 'Password123' WHERE "email" = 'user@marketsage.local';
UPDATE "User" SET "password" = 'test1234' WHERE "email" = 'testadmin@marketsage.local';
UPDATE "User" SET "password" = 'password123' WHERE "email" = 'test@marketsage.local';

-- Create any missing users
INSERT INTO "User" ("id", "email", "name", "password", "role", "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text, 
  'supreme@marketsage.africa',
  'Supreme Admin',
  'MS_Super2025!',
  'SUPER_ADMIN',
  true,
  NOW(),
  NOW()
WHERE 
  NOT EXISTS (SELECT 1 FROM "User" WHERE "email" = 'supreme@marketsage.africa');

INSERT INTO "User" ("id", "email", "name", "password", "role", "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text, 
  'anita@marketsage.africa',
  'Anita Manager',
  'MS_Admin2025!',
  'ADMIN',
  true,
  NOW(),
  NOW()
WHERE 
  NOT EXISTS (SELECT 1 FROM "User" WHERE "email" = 'anita@marketsage.africa');

INSERT INTO "User" ("id", "email", "name", "password", "role", "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text, 
  'kola@marketsage.africa',
  'Kola Techleads',
  'MS_ITAdmin2025!',
  'IT_ADMIN',
  true,
  NOW(),
  NOW()
WHERE 
  NOT EXISTS (SELECT 1 FROM "User" WHERE "email" = 'kola@marketsage.africa');

INSERT INTO "User" ("id", "email", "name", "password", "role", "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text, 
  'user@marketsage.africa',
  'Regular User',
  'MS_User2025!',
  'USER',
  true,
  NOW(),
  NOW()
WHERE 
  NOT EXISTS (SELECT 1 FROM "User" WHERE "email" = 'user@marketsage.africa'); 