/**
 * Docker-Specific Setup for MCP Integration Tests
 * 
 * Additional setup steps specifically for Docker environments.
 */

import { execSync } from 'child_process';

/**
 * Docker-specific setup that runs before each test suite in Docker environment
 */
export async function dockerPreTestSetup(): Promise<void> {
  if (process.env.IS_DOCKER_ENV !== 'true') {
    return; // Skip if not in Docker
  }

  console.log('🐳 Docker Pre-Test Setup');
  console.log('========================');

  try {
    // Step 1: Verify Docker container health
    console.log('🏥 Step 1: Checking container health...');
    
    // Check available memory
    try {
      const memInfo = execSync('cat /proc/meminfo | grep MemAvailable', { encoding: 'utf8' });
      const availableMemory = Number.parseInt(memInfo.split(':')[1].trim().split(' ')[0]);
      const availableMemoryMB = Math.round(availableMemory / 1024);
      
      console.log(`   Available memory: ${availableMemoryMB}MB`);
      
      if (availableMemoryMB < 100) {
        console.warn('⚠️  Low memory detected - tests may run slower');
      }
    } catch (error) {
      console.log('   Could not check memory (not critical)');
    }

    // Check disk space
    try {
      const diskInfo = execSync('df -h /', { encoding: 'utf8' });
      const lines = diskInfo.split('\n');
      if (lines.length > 1) {
        const diskLine = lines[1].split(/\s+/);
        console.log(`   Available disk space: ${diskLine[3]}`);
      }
    } catch (error) {
      console.log('   Could not check disk space (not critical)');
    }

    console.log('✅ Container health check completed');

    // Step 2: Network connectivity test
    console.log('🌐 Step 2: Testing network connectivity...');
    
    // Test database connectivity (already done in global setup, but verify again)
    const dbHost = process.env.DATABASE_URL?.includes('marketsage-db') ? 'marketsage-db' : 'localhost';
    console.log(`   Database host: ${dbHost}`);
    
    // Verify DNS resolution works
    try {
      execSync(`nslookup ${dbHost}`, { stdio: 'pipe', timeout: 5000 });
      console.log(`   DNS resolution for ${dbHost}: ✅`);
    } catch (error) {
      console.log(`   DNS resolution for ${dbHost}: ⚠️  (may still work)`);
    }

    console.log('✅ Network connectivity verified');

    // Step 3: Docker-specific environment checks
    console.log('🔧 Step 3: Docker environment verification...');
    
    console.log(`   Container ID: ${process.env.HOSTNAME || 'unknown'}`);
    console.log(`   Working directory: ${process.cwd()}`);
    console.log(`   User: ${process.env.USER || process.env.USERNAME || 'unknown'}`);
    
    // Check if we're running as root (common in Docker)
    try {
      const userId = execSync('id -u', { encoding: 'utf8' }).trim();
      console.log(`   User ID: ${userId}`);
    } catch (error) {
      console.log('   Could not determine user ID');
    }

    console.log('✅ Docker environment verified');

    // Step 4: Container resource optimization
    console.log('⚡ Step 4: Container resource optimization...');
    
    // Set Docker-specific timeouts
    process.env.DATABASE_TIMEOUT = '45000'; // 45 seconds for Docker
    process.env.MCP_TIMEOUT = '15000';      // 15 seconds for Docker
    
    // Adjust Node.js settings for container environment
    if (!process.env.NODE_OPTIONS) {
      process.env.NODE_OPTIONS = '--max-old-space-size=1024'; // Limit memory to 1GB
    }
    
    console.log('   Extended timeouts for Docker environment');
    console.log('   Optimized memory settings');
    console.log('✅ Resource optimization completed');

    console.log('\n🎉 Docker Pre-Test Setup Complete!');

  } catch (error) {
    console.error('💥 Docker setup error:', error);
    // Don't throw - Docker setup issues shouldn't prevent tests from running
    console.warn('⚠️  Docker setup had issues but continuing with tests');
  }
}

/**
 * Docker-specific cleanup that runs after each test suite
 */
export async function dockerPostTestCleanup(): Promise<void> {
  if (process.env.IS_DOCKER_ENV !== 'true') {
    return; // Skip if not in Docker
  }

  console.log('🐳 Docker Post-Test Cleanup');
  console.log('===========================');

  try {
    // Force garbage collection in Docker environment
    if (global.gc) {
      global.gc();
      console.log('✅ Garbage collection triggered');
    }

    // Clear Node.js caches
    if (require.cache) {
      // Don't clear everything, just test-specific modules
      Object.keys(require.cache).forEach(key => {
        if (key.includes('__tests__') || key.includes('test')) {
          delete require.cache[key];
        }
      });
      console.log('✅ Test module cache cleared');
    }

    // Log final memory usage if available
    try {
      const memUsage = process.memoryUsage();
      console.log(`   Memory usage: RSS=${Math.round(memUsage.rss / 1024 / 1024)}MB, Heap=${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    } catch (error) {
      console.log('   Could not get memory usage');
    }

    console.log('✅ Docker cleanup completed');

  } catch (error) {
    console.warn('⚠️  Docker cleanup had issues:', error);
    // Don't throw - cleanup issues shouldn't fail tests
  }
}

// Export setup functions
export default {
  dockerPreTestSetup,
  dockerPostTestCleanup
};