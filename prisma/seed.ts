import { PrismaClient, UserRole } from '../src/generated/prisma';
import { hash } from 'bcrypt';
import { sampleContacts } from '../src/data/sampleContacts';

const prisma = new PrismaClient();

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
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      emailVerified: new Date(),
    },
  });

  console.log(`Created user ${email} with role ${role}`);
  return user;
}

async function createContacts(createdById: string) {
  console.log('Creating sample contacts...');

  let createdCount = 0;

  for (const contact of sampleContacts) {
    // Skip if no email or phone (need at least one)
    if (!contact.email && !contact.phone) continue;

    try {
      await prisma.contact.create({
        data: {
          email: contact.email,
          phone: contact.phone,
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
          status: 'ACTIVE'
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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
