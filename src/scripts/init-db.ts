import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Get the database file path from DATABASE_URL
function getDatabaseInfo(connectionString: string) {
  // For SQLite, the connection string has the format "file:./dev.db"
  const regex = /file:\.\/([^?]+)/;
  const match = connectionString.match(regex);

  if (!match) {
    throw new Error(`Invalid DATABASE_URL: ${connectionString}`);
  }

  const dbFileName = match[1];
  const dbFilePath = path.resolve(process.cwd(), 'prisma', dbFileName);

  return {
    dbFileName,
    dbFilePath
  };
}

async function checkDatabaseExists(dbInfo: ReturnType<typeof getDatabaseInfo>): Promise<boolean> {
  try {
    return fs.existsSync(dbInfo.dbFilePath);
  } catch (error) {
    console.error('Error checking if database exists:', error);
    return false;
  }
}

async function runMigrations(): Promise<void> {
  try {
    console.log('Running database migrations...');
    await execAsync('npx prisma migrate deploy');
    console.log('Migrations applied successfully.');
  } catch (error) {
    console.error('Error applying migrations:', error);
    throw error;
  }
}

async function runSeeds(): Promise<void> {
  try {
    console.log('Running database seeds...');
    await execAsync('npm run db:seed');
    console.log('Database seeded successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

async function generatePrismaClient(): Promise<void> {
  try {
    console.log('Generating Prisma client...');
    await execAsync('npx prisma generate');
    console.log('Prisma client generated successfully.');
  } catch (error) {
    console.error('Error generating Prisma client:', error);
    throw error;
  }
}

async function main() {
  // Check if .env file exists
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('ERROR: .env file not found');
    process.exit(1);
  }

  // Read and parse .env file to get DATABASE_URL
  const envContent = fs.readFileSync(envPath, 'utf8');
  const databaseUrlMatch = envContent.match(/DATABASE_URL=\"([^\"]+)\"/);

  if (!databaseUrlMatch) {
    console.error('ERROR: DATABASE_URL not found in .env file');
    process.exit(1);
  }

  const databaseUrl = databaseUrlMatch[1];

  // Ensure the prisma directory exists
  const prismaDir = path.resolve(process.cwd(), 'prisma');
  if (!fs.existsSync(prismaDir)) {
    fs.mkdirSync(prismaDir, { recursive: true });
  }

  const dbInfo = getDatabaseInfo(databaseUrl);

  // Check if the database exists
  const dbExists = await checkDatabaseExists(dbInfo);

  if (!dbExists) {
    console.log(`SQLite database file ${dbInfo.dbFileName} does not exist. It will be created during migration.`);
  } else {
    console.log(`SQLite database file ${dbInfo.dbFileName} already exists.`);
  }

  // Generate Prisma client
  await generatePrismaClient();

  // Run migrations (this will create the database file if it doesn't exist)
  await runMigrations();

  // Run seeds if database was just created
  if (!dbExists) {
    await runSeeds();
  }

  console.log('Database initialization completed successfully.');
}

main().catch((error) => {
  console.error('Database initialization failed:', error);
  process.exit(1);
});
