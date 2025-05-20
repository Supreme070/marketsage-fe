const { PrismaClient } = require('@prisma/client');

async function testPrismaAccess() {
  try {
    console.log('Initializing PrismaClient...');
    const prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });

    console.log('Testing Prisma client connection...');
    
    // List all available models on the prisma client
    console.log('Available models on prisma client:');
    console.log(Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$')));
    
    try {
      console.log('\nTesting with PascalCase (proper model name):');
      const journeysProper = await prisma.Journey.findMany({
        take: 5
      });
      console.log(`Found ${journeysProper.length} journeys using Journey (PascalCase) model name`);
      console.log(JSON.stringify(journeysProper, null, 2));
    } catch (error) {
      console.error('Error with PascalCase access:', error.message);
    }
    
    try {
      console.log('\nTesting with camelCase:');
      const journeysLower = await prisma.journey.findMany({
        take: 5
      });
      console.log(`Found ${journeysLower.length} journeys using journey (camelCase) model name`);
      console.log(JSON.stringify(journeysLower, null, 2));
    } catch (error) {
      console.error('Error with camelCase access:', error.message);
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testPrismaAccess()
  .then(() => console.log('Test completed'))
  .catch(error => console.error('Test failed with error:', error.message)); 