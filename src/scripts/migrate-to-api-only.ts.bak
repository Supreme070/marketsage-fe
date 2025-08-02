#!/usr/bin/env npx tsx
/**
 * Database Migration Script
 * ========================
 * 
 * Systematically migrates frontend from direct database access to API-only mode
 * Run with: npx tsx src/scripts/migrate-to-api-only.ts
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface MigrationProgress {
  totalFiles: number;
  migratedFiles: number;
  pendingFiles: string[];
  errorFiles: string[];
}

class DatabaseMigrationTool {
  private progress: MigrationProgress = {
    totalFiles: 0,
    migratedFiles: 0,
    pendingFiles: [],
    errorFiles: []
  };

  async analyzeCurrentState(): Promise<void> {
    console.log('🔍 Analyzing current database access patterns...\n');

    // Find all files with direct Prisma usage using find command
    const apiFiles = execSync('find src/app/api -name "*.ts" 2>/dev/null || echo ""', { encoding: 'utf-8' })
      .split('\n').filter(f => f.trim());
    const libFiles = execSync('find src/lib -name "*.ts" 2>/dev/null || echo ""', { encoding: 'utf-8' })
      .split('\n').filter(f => f.trim());
    const allFiles = [...apiFiles, ...libFiles].filter(f => f.length > 0);

    console.log(`📊 Analysis Results:`);
    console.log(`   Total API routes: ${apiFiles.length}`);
    console.log(`   Total lib files: ${libFiles.length}`);
    console.log(`   Combined files to analyze: ${allFiles.length}\n`);

    // Check each file for direct database access
    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      
      if (this.hasDirectDatabaseAccess(content)) {
        this.progress.pendingFiles.push(file);
      } else if (this.hasApiOnlyAccess(content)) {
        this.progress.migratedFiles++;
      }
    }

    this.progress.totalFiles = allFiles.length;

    this.printCurrentStatus();
  }

  private hasDirectDatabaseAccess(content: string): boolean {
    const directDbPatterns = [
      /import.*prisma.*from.*['"']@\/lib\/db\/prisma['"']/,
      /prisma\.\w+\./,
      /await prisma\./,
      /from.*['"']@prisma\/client['"']/
    ];

    return directDbPatterns.some(pattern => pattern.test(content));
  }

  private hasApiOnlyAccess(content: string): boolean {
    const apiOnlyPatterns = [
      /withDatabaseMode/,
      /apiClient\./,
      /from.*['"']@\/lib\/api-client['"']/,
      /useApiOnlyMode/
    ];

    return apiOnlyPatterns.some(pattern => pattern.test(content));
  }

  private printCurrentStatus(): void {
    const migrationPercentage = Math.round(
      (this.progress.migratedFiles / this.progress.totalFiles) * 100
    );

    console.log(`📈 Migration Progress: ${migrationPercentage}%`);
    console.log(`   ✅ Migrated: ${this.progress.migratedFiles} files`);
    console.log(`   🚧 Pending: ${this.progress.pendingFiles.length} files`);
    console.log(`   ❌ Errors: ${this.progress.errorFiles.length} files\n`);

    if (this.progress.pendingFiles.length > 0) {
      console.log('🚧 Files requiring migration:');
      this.progress.pendingFiles.slice(0, 10).forEach((file, index) => {
        console.log(`   ${index + 1}. ${file}`);
      });
      
      if (this.progress.pendingFiles.length > 10) {
        console.log(`   ... and ${this.progress.pendingFiles.length - 10} more files`);
      }
      console.log();
    }
  }

  async generateMigrationPlan(): Promise<void> {
    console.log('📋 Generating Migration Plan...\n');

    // Prioritize files by importance
    const criticalFiles = this.progress.pendingFiles.filter(file => 
      file.includes('/api/auth/') || 
      file.includes('/api/ai/') ||
      file.includes('/api/users/') ||
      file.includes('prisma.ts')
    );

    const apiRoutes = this.progress.pendingFiles.filter(file => 
      file.includes('/api/') && !criticalFiles.includes(file)
    );

    const libFiles = this.progress.pendingFiles.filter(file => 
      file.includes('/lib/') && !criticalFiles.includes(file)
    );

    console.log('🎯 Migration Priority Order:');
    console.log(`\n1. CRITICAL FILES (${criticalFiles.length} files):`);
    criticalFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });

    console.log(`\n2. API ROUTES (${apiRoutes.length} files):`);
    apiRoutes.slice(0, 5).forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    if (apiRoutes.length > 5) {
      console.log(`   ... and ${apiRoutes.length - 5} more API routes`);
    }

    console.log(`\n3. LIBRARY FILES (${libFiles.length} files):`);
    libFiles.slice(0, 5).forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    if (libFiles.length > 5) {
      console.log(`   ... and ${libFiles.length - 5} more library files`);
    }

    console.log('\n🚀 Next Steps:');
    console.log('1. Migrate critical authentication and AI endpoints first');
    console.log('2. Enable API-only mode with NEXT_PUBLIC_USE_API_ONLY=true');
    console.log('3. Test functionality with separated backend');
    console.log('4. Gradually migrate remaining API routes');
    console.log('5. Remove direct database dependencies completely\n');
  }

  async enableApiOnlyMode(): Promise<void> {
    console.log('🔧 Enabling API-Only Mode...\n');

    const envPath = '.env';
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    // Check if API-only mode is already enabled
    if (envContent.includes('NEXT_PUBLIC_USE_API_ONLY=true')) {
      console.log('✅ API-Only mode is already enabled');
      return;
    }

    // Add or update the environment variable
    if (envContent.includes('NEXT_PUBLIC_USE_API_ONLY=')) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_USE_API_ONLY=false/g,
        'NEXT_PUBLIC_USE_API_ONLY=true'
      );
    } else {
      envContent += '\n# Database Migration - API Only Mode\nNEXT_PUBLIC_USE_API_ONLY=true\n';
    }

    fs.writeFileSync(envPath, envContent);
    console.log('✅ API-Only mode enabled in .env');
    console.log('⚠️  Restart the application to apply changes\n');
  }
}

// Main execution
async function main() {
  console.log('🚀 MarketSage Database Migration Tool\n');
  console.log('====================================\n');

  const migrationTool = new DatabaseMigrationTool();

  try {
    await migrationTool.analyzeCurrentState();
    await migrationTool.generateMigrationPlan();
    
    // Prompt for API-only mode enablement
    console.log('Would you like to enable API-Only mode now? (y/N)');
    
    // For script execution, we'll skip the interactive prompt
    // await migrationTool.enableApiOnlyMode();
    
  } catch (error) {
    console.error('❌ Migration analysis failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { DatabaseMigrationTool };