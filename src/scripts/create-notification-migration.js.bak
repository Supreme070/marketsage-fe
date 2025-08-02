const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Generate timestamp for migration name
const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').substring(0, 14);
const migrationName = `${timestamp}_add_notification_model`;
const migrationDir = path.join(__dirname, '../../prisma/migrations', migrationName);

// Create migration directory
fs.mkdirSync(migrationDir, { recursive: true });

// Create migration.sql file
const migrationSql = `-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
`;

fs.writeFileSync(path.join(migrationDir, 'migration.sql'), migrationSql);

// Create migration metadata file
const metadata = {
  "version": "5"
};

fs.writeFileSync(
  path.join(migrationDir, 'migration_lock.toml'),
  'provider = "postgresql"\n'
);

console.log(`Created migration: ${migrationName}`);

// Apply the migration
try {
  console.log('Applying migration...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('Migration applied successfully');
} catch (error) {
  console.error('Error applying migration:', error.message);
} 