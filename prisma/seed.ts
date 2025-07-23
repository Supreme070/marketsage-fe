import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import { hash } from 'bcrypt';
import { sampleContacts } from '../src/data/sampleContacts';
import { randomUUID } from 'crypto';
// import { seedSampleJourneys } from '../src/data/sampleJourneys';

// Define UserRole enum locally since we can't import it from @prisma/client
enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN', 
  IT_ADMIN = 'IT_ADMIN',
  USER = 'USER'
}

// Define WorkflowStatus enum locally
enum WorkflowStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED'
}

async function main() {
  console.log(`Start seeding ...`);

  // Create Super Admin
  const superAdmin = await createUser(
    'Supreme Admin',
    'supreme@marketsage.africa',
    'MS_Super2025!',
    UserRole.SUPER_ADMIN
  );

  // Create Admin
  const admin = await createUser(
    'Anita Manager',
    'anita@marketsage.africa',
    'MS_Admin2025!',
    UserRole.ADMIN
  );

  // Create IT Admin
  const itAdmin = await createUser(
    'Kola Techleads',
    'kola@marketsage.africa',
    'MS_ITAdmin2025!',
    UserRole.IT_ADMIN
  );

  // Create Regular User
  const regularUser = await createUser(
    'Regular User',
    'user@marketsage.africa',
    'MS_User2025!',
    UserRole.USER
  );

  // Create sample contacts
  await createContacts(admin.id);

  // Create sample visitor journeys
  // await seedSampleJourneys(admin.id); // Temporarily commented out due to TypeScript error

  // Create sample workflows
  await createSampleWorkflows(admin.id);

  console.log(`Seeding finished.`);
}

async function createUser(name: string, email: string, password: string, role: UserRole) {
  const userExists = await prisma.user.findUnique({
    where: { email },
  });

  if (userExists) {
    console.log(`User ${email} already exists, skipping.`);
    return userExists;
  }

  const hashedPassword = await hash(password, 10);
  const now = new Date();
  
  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      name,
      email,
      password: hashedPassword,
      role,
      emailVerified: now,
      createdAt: now,
      updatedAt: now
    },
  });

  console.log(`Created user ${email} with role ${role}`);
  return user;
}

async function createContacts(createdById: string) {
  console.log('Creating sample contacts...');

  let createdCount = 0;
  const now = new Date();

  for (const contact of sampleContacts) {
    // Skip if no email (required field)
    if (!contact.email) continue;

    try {
      await prisma.contact.create({
        data: {
          id: randomUUID(),
          email: contact.email,
          phone: contact.phone || null,
          firstName: contact.firstName,
          lastName: contact.lastName,
          company: contact.company,
          jobTitle: contact.jobTitle,
          address: contact.address,
          city: contact.city,
          state: contact.state,
          country: contact.country,
          postalCode: contact.postalCode,
          notes: contact.notes,
          tagsString: contact.tags ? JSON.stringify(contact.tags) : null,
          source: contact.source,
          createdById,
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now
        }
      });
      createdCount++;
    } catch (error) {
      console.log(`Error creating contact: ${contact.email || contact.phone}`, error);
      // Continue with next contact even if one fails
    }
  }

  console.log(`Created ${createdCount} sample contacts`);
}

async function createSampleWorkflows(createdById: string) {
  console.log('Creating sample workflows...');

  // Check if workflows already exist
  const existingWorkflows = await prisma.workflow.count();
  if (existingWorkflows > 0) {
    console.log('Workflows already exist, skipping workflow seeding');
    return;
  }

  // Simple workflow sample - safe and minimal
  const sampleWorkflow = {
    name: "Welcome Email Sequence",
    description: "Simple welcome sequence for new subscribers",
    status: 'DRAFT',
    definition: JSON.stringify({
      nodes: [
        {
          id: "trigger-1",
          type: "triggerNode",
          position: { x: 250, y: 100 },
          data: {
            label: "New subscriber",
            description: "When a contact subscribes to newsletter",
            icon: "UserPlus"
          }
        },
        {
          id: "action-1",
          type: "actionNode",
          position: { x: 250, y: 200 },
          data: {
            label: "Send welcome email",
            description: "Send welcome email to new subscriber",
            icon: "Mail"
          }
        }
      ],
      edges: [
        {
          id: "edge-1",
          source: "trigger-1",
          target: "action-1",
          type: "custom"
        }
      ]
    })
  };

  try {
    await prisma.workflow.create({
      data: {
        id: randomUUID(),
        name: sampleWorkflow.name,
        description: sampleWorkflow.description,
        status: sampleWorkflow.status as any,
        definition: sampleWorkflow.definition,
        createdById,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log(`Created sample workflow: ${sampleWorkflow.name}`);
  } catch (error) {
    console.log(`Error creating sample workflow: ${sampleWorkflow.name}`, error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
