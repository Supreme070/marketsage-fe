/**
 * Script to seed workflow templates into the marketplace
 * 
 * This script populates the database with pre-built workflow templates
 * and collections for the MarketSage marketplace.
 */

import prisma from '../src/lib/db/prisma';
import { workflowTemplateSeeds, templateCollections } from '../src/lib/workflow/template-seeds';
import { logger } from '../src/lib/logger';

async function createSystemUser() {
  // Create or get system user for templates
  const systemUser = await prisma.user.upsert({
    where: { email: 'system@marketsage.com' },
    update: {},
    create: {
      id: 'system-user',
      email: 'system@marketsage.com',
      name: 'MarketSage System',
      role: 'ADMIN',
      isActive: true,
    }
  });

  return systemUser.id;
}

async function seedWorkflowTemplates() {
  console.log('🌱 Seeding workflow templates...');

  const systemUserId = await createSystemUser();

  for (const templateSeed of workflowTemplateSeeds) {
    try {
      // Check if template already exists
      const existingTemplate = await prisma.workflowTemplate.findFirst({
        where: { name: templateSeed.name }
      });

      if (existingTemplate) {
        console.log(`  ⏭️  Template "${templateSeed.name}" already exists, skipping...`);
        continue;
      }

      // Create the template
      const template = await prisma.workflowTemplate.create({
        data: {
          id: templateSeed.id,
          name: templateSeed.name,
          description: templateSeed.description,
          category: templateSeed.category as any,
          complexity: templateSeed.complexity as any,
          status: 'PUBLISHED',
          definition: JSON.stringify(templateSeed.definition),
          tags: templateSeed.tags,
          industry: templateSeed.industry,
          useCase: templateSeed.useCase,
          estimatedSetupTime: templateSeed.estimatedSetupTime,
          features: templateSeed.features,
          requirements: templateSeed.requirements || {},
          variables: templateSeed.variables || {},
          triggerTypes: templateSeed.triggerTypes,
          authorName: templateSeed.authorName,
          isPremium: templateSeed.isPremium || false,
          price: templateSeed.price || 0,
          isFeatured: true, // Mark all seed templates as featured
          publishedAt: new Date(),
          createdBy: systemUserId,
          // Add some mock analytics
          usageCount: Math.floor(Math.random() * 100) + 10,
          rating: 4.0 + Math.random() * 1.0, // 4.0 to 5.0 rating
          ratingCount: Math.floor(Math.random() * 50) + 5,
          downloadCount: Math.floor(Math.random() * 200) + 20,
        }
      });

      console.log(`  ✅ Created template: ${template.name}`);

      // Add some sample reviews
      await createSampleReviews(template.id, systemUserId);

    } catch (error) {
      console.error(`  ❌ Error creating template "${templateSeed.name}":`, error);
    }
  }
}

async function createSampleReviews(templateId: string, systemUserId: string) {
  const sampleReviews = [
    {
      rating: 5,
      comment: 'Excellent template! Saved me hours of work and works perfectly out of the box.',
    },
    {
      rating: 4,
      comment: 'Great workflow, easy to customize and implement. Highly recommended.',
    },
    {
      rating: 5,
      comment: 'This template is exactly what I needed. Clear documentation and great results.',
    }
  ];

  // Create some sample reviewers
  const reviewers = [];
  for (let i = 0; i < 3; i++) {
    const reviewer = await prisma.user.upsert({
      where: { email: `reviewer${i + 1}@example.com` },
      update: {},
      create: {
        email: `reviewer${i + 1}@example.com`,
        name: `Reviewer ${i + 1}`,
        role: 'USER',
        isActive: true,
      }
    });
    reviewers.push(reviewer.id);
  }

  // Add reviews
  for (let i = 0; i < sampleReviews.length; i++) {
    try {
      await prisma.workflowTemplateReview.create({
        data: {
          templateId,
          userId: reviewers[i],
          rating: sampleReviews[i].rating,
          comment: sampleReviews[i].comment,
          isVerified: true,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
        }
      });
    } catch (error) {
      // Ignore duplicate review errors
      if (!error.message.includes('unique constraint')) {
        console.warn(`    ⚠️  Could not create review: ${error.message}`);
      }
    }
  }
}

async function seedTemplateCollections() {
  console.log('📚 Seeding template collections...');

  const systemUserId = await createSystemUser();

  for (const collectionSeed of templateCollections) {
    try {
      // Check if collection already exists
      const existingCollection = await prisma.workflowTemplateCollection.findFirst({
        where: { name: collectionSeed.name }
      });

      if (existingCollection) {
        console.log(`  ⏭️  Collection "${collectionSeed.name}" already exists, skipping...`);
        continue;
      }

      // Get template IDs that exist in the database
      const templates = await prisma.workflowTemplate.findMany({
        where: {
          id: { in: collectionSeed.templateIds }
        },
        select: { id: true }
      });

      if (templates.length === 0) {
        console.log(`  ⚠️  No templates found for collection "${collectionSeed.name}", skipping...`);
        continue;
      }

      // Create the collection
      const collection = await prisma.workflowTemplateCollection.create({
        data: {
          name: collectionSeed.name,
          description: collectionSeed.description,
          slug: collectionSeed.slug,
          isFeatured: collectionSeed.isFeatured,
          thumbnail: collectionSeed.thumbnail,
          createdBy: systemUserId,
          templates: {
            connect: templates.map(t => ({ id: t.id }))
          }
        }
      });

      console.log(`  ✅ Created collection: ${collection.name} with ${templates.length} templates`);

    } catch (error) {
      console.error(`  ❌ Error creating collection "${collectionSeed.name}":`, error);
    }
  }
}

async function generateTemplateAnalytics() {
  console.log('📊 Generating template analytics...');

  const templates = await prisma.workflowTemplate.findMany({
    select: { id: true }
  });

  for (const template of templates) {
    try {
      // Generate various analytics events
      const events = [
        { type: 'view', count: Math.floor(Math.random() * 500) + 100 },
        { type: 'download', count: Math.floor(Math.random() * 100) + 10 },
        { type: 'install', count: Math.floor(Math.random() * 50) + 5 },
      ];

      for (const event of events) {
        for (let i = 0; i < event.count; i++) {
          await prisma.workflowTemplateAnalytics.create({
            data: {
              templateId: template.id,
              eventType: event.type,
              timestamp: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date within last 90 days
              metadata: {
                source: 'marketplace',
                userAgent: 'Mozilla/5.0 (compatible; MarketSage Analytics)'
              }
            }
          });
        }
      }

    } catch (error) {
      console.warn(`    ⚠️  Could not create analytics for template ${template.id}: ${error.message}`);
    }
  }

  console.log(`  ✅ Generated analytics for ${templates.length} templates`);
}

async function cleanupOldData() {
  console.log('🧹 Cleaning up old template data...');

  try {
    // Delete existing analytics
    await prisma.workflowTemplateAnalytics.deleteMany({
      where: {
        template: {
          createdBy: 'system-user'
        }
      }
    });

    // Delete existing reviews for system templates
    await prisma.workflowTemplateReview.deleteMany({
      where: {
        template: {
          createdBy: 'system-user'
        }
      }
    });

    // Delete template-collection relationships
    const systemCollections = await prisma.workflowTemplateCollection.findMany({
      where: { createdBy: 'system-user' }
    });

    for (const collection of systemCollections) {
      await prisma.workflowTemplateCollection.update({
        where: { id: collection.id },
        data: {
          templates: {
            set: []
          }
        }
      });
    }

    // Delete existing collections
    await prisma.workflowTemplateCollection.deleteMany({
      where: { createdBy: 'system-user' }
    });

    // Delete existing templates
    await prisma.workflowTemplate.deleteMany({
      where: { createdBy: 'system-user' }
    });

    console.log('  ✅ Cleanup completed');

  } catch (error) {
    console.error('  ❌ Cleanup error:', error);
  }
}

async function seedWorkflowTemplateMarketplace() {
  console.log('🚀 Starting Workflow Template Marketplace Seeding\\n');

  try {
    // Clean up old data first
    await cleanupOldData();

    // Seed templates
    await seedWorkflowTemplates();
    console.log('');

    // Seed collections
    await seedTemplateCollections();
    console.log('');

    // Generate analytics
    await generateTemplateAnalytics();
    console.log('');

    console.log('🎉 Workflow template marketplace seeding completed successfully!');

    // Print summary
    const templateCount = await prisma.workflowTemplate.count({
      where: { status: 'PUBLISHED' }
    });
    const collectionCount = await prisma.workflowTemplateCollection.count();
    const reviewCount = await prisma.workflowTemplateReview.count();

    console.log('\\n📈 Summary:');
    console.log(`  Templates: ${templateCount}`);
    console.log(`  Collections: ${collectionCount}`);
    console.log(`  Reviews: ${reviewCount}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Run the seeding
if (require.main === module) {
  seedWorkflowTemplateMarketplace()
    .then(() => {
      console.log('\\n✨ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\\n💥 Seeding failed:', error);
      process.exit(1);
    });
}

export { seedWorkflowTemplateMarketplace };