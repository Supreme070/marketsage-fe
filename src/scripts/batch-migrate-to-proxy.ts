#!/usr/bin/env npx tsx
/**
 * Batch Migration to Proxy Pattern
 * ================================
 * 
 * Systematically converts all API routes from direct database access to proxy pattern
 * This implements Phase 2 of the microservices migration
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface MigrationFile {
  path: string;
  hasPrismaImport: boolean;
  hasProxyImport: boolean;
  migrated: boolean;
}

class BatchProxyMigration {
  private files: MigrationFile[] = [];
  private migratedCount = 0;
  private errorCount = 0;

  async findAllApiRoutes(): Promise<void> {
    console.log('🔍 Finding all API route files...\n');

    // Find all route.ts files in the API directory
    const apiFiles = execSync(
      'find src/app/api -name "route.ts" -o -name "route.tsx" 2>/dev/null || echo ""',
      { encoding: 'utf-8', cwd: '/Users/supreme/Desktop/marketsage' }
    )
      .split('\n')
      .filter(f => f.trim() && !f.includes('node_modules'));

    console.log(`📊 Found ${apiFiles.length} API route files\n`);

    // Analyze each file
    for (const file of apiFiles) {
      if (!file) continue;
      
      const fullPath = path.join('/Users/supreme/Desktop/marketsage', file);
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      this.files.push({
        path: file,
        hasPrismaImport: /import.*prisma|from.*@\/lib\/db\/prisma/.test(content),
        hasProxyImport: /import.*proxyToNestJS.*from.*api-proxy/.test(content),
        migrated: false
      });
    }

    this.printAnalysis();
  }

  private printAnalysis(): void {
    const needsMigration = this.files.filter(f => f.hasPrismaImport && !f.hasProxyImport);
    const alreadyMigrated = this.files.filter(f => f.hasProxyImport && !f.hasPrismaImport);
    const partiallyMigrated = this.files.filter(f => f.hasProxyImport && f.hasPrismaImport);
    
    console.log('📈 Migration Analysis:');
    console.log(`   ✅ Already migrated: ${alreadyMigrated.length} files`);
    console.log(`   🚧 Needs migration: ${needsMigration.length} files`);
    console.log(`   ⚠️  Partially migrated: ${partiallyMigrated.length} files`);
    console.log(`   📄 Total API routes: ${this.files.length} files\n`);

    if (needsMigration.length > 0) {
      console.log('🎯 Priority migration targets (by path):');
      
      // Group by priority
      const authRoutes = needsMigration.filter(f => f.path.includes('/auth/'));
      const adminRoutes = needsMigration.filter(f => f.path.includes('/admin/'));
      const aiRoutes = needsMigration.filter(f => f.path.includes('/ai/'));
      const otherRoutes = needsMigration.filter(f => 
        !f.path.includes('/auth/') && 
        !f.path.includes('/admin/') && 
        !f.path.includes('/ai/')
      );

      if (authRoutes.length > 0) {
        console.log(`\n1. AUTH ROUTES (${authRoutes.length} files):`);
        authRoutes.slice(0, 5).forEach(f => console.log(`   - ${f.path}`));
        if (authRoutes.length > 5) console.log(`   ... and ${authRoutes.length - 5} more`);
      }

      if (adminRoutes.length > 0) {
        console.log(`\n2. ADMIN ROUTES (${adminRoutes.length} files):`);
        adminRoutes.slice(0, 5).forEach(f => console.log(`   - ${f.path}`));
        if (adminRoutes.length > 5) console.log(`   ... and ${adminRoutes.length - 5} more`);
      }

      if (aiRoutes.length > 0) {
        console.log(`\n3. AI ROUTES (${aiRoutes.length} files):`);
        aiRoutes.slice(0, 5).forEach(f => console.log(`   - ${f.path}`));
        if (aiRoutes.length > 5) console.log(`   ... and ${aiRoutes.length - 5} more`);
      }

      if (otherRoutes.length > 0) {
        console.log(`\n4. OTHER ROUTES (${otherRoutes.length} files):`);
        otherRoutes.slice(0, 5).forEach(f => console.log(`   - ${f.path}`));
        if (otherRoutes.length > 5) console.log(`   ... and ${otherRoutes.length - 5} more`);
      }
    }
  }

  generateMigrationExample(): void {
    console.log('\n📝 Migration Pattern Example:\n');
    console.log('// BEFORE - Direct database access');
    console.log('import prisma from "@/lib/db/prisma";');
    console.log('');
    console.log('export async function GET(request: NextRequest) {');
    console.log('  const users = await prisma.user.findMany();');
    console.log('  return NextResponse.json(users);');
    console.log('}');
    console.log('');
    console.log('// AFTER - Proxy pattern');
    console.log('import { proxyToNestJS } from "@/lib/nestjs-proxy";');
    console.log('');
    console.log('export async function GET(request: NextRequest) {');
    console.log('  return proxyToNestJS(request, {');
    console.log('    backendPath: "users",');
    console.log('    requireAuth: true');
    console.log('  });');
    console.log('}');
  }

  async createMigrationCommands(): Promise<void> {
    console.log('\n🛠️  Migration Commands:\n');
    
    const needsMigration = this.files.filter(f => f.hasPrismaImport && !f.hasProxyImport);
    
    // Create sed commands for batch migration
    console.log('# Remove Prisma imports:');
    console.log(`find src/app/api -name "route.ts" -exec sed -i '' '/import.*prisma.*from.*@\\/lib\\/db\\/prisma/d' {} \\;`);
    
    console.log('\n# Add proxy import (manual review needed):');
    console.log(`# Add to each file: import { proxyToNestJS } from "@/lib/nestjs-proxy";`);
    
    console.log('\n# Files that need manual conversion:');
    needsMigration.slice(0, 10).forEach(f => {
      console.log(`# ${f.path}`);
    });
  }

  generateConversionScript(): void {
    const script = `#!/bin/bash
# Batch Proxy Migration Script
# Generated on ${new Date().toISOString()}

echo "🚀 Starting batch migration to proxy pattern..."

# Backup current state
echo "📦 Creating backup..."
cp -r src/app/api src/app/api.backup.\$(date +%s)

# Counter for progress
converted=0
total=${this.files.filter(f => f.hasPrismaImport && !f.hasProxyImport).length}

echo "📊 Converting \$total files..."

# Add your conversion logic here
# This is a template - customize based on your patterns

echo "✅ Migration complete!"
echo "   Converted: \$converted files"
echo "   Remember to:"
echo "   - Test each endpoint"
echo "   - Update imports"
echo "   - Remove unused dependencies"
`;

    fs.writeFileSync('/Users/supreme/Desktop/marketsage/migrate-to-proxy.sh', script, { mode: 0o755 });
    console.log('\n✅ Generated migration script: migrate-to-proxy.sh');
  }
}

// Main execution
async function main() {
  console.log('🚀 MarketSage Batch Proxy Migration Tool\n');
  console.log('=====================================\n');

  const migrator = new BatchProxyMigration();

  try {
    await migrator.findAllApiRoutes();
    migrator.generateMigrationExample();
    await migrator.createMigrationCommands();
    migrator.generateConversionScript();
    
    console.log('\n📋 Next Steps:');
    console.log('1. Review the generated migration script');
    console.log('2. Start with auth routes first');
    console.log('3. Test each endpoint after migration');
    console.log('4. Remove all Prisma dependencies from frontend');
    console.log('5. Update documentation\n');
    
  } catch (error) {
    console.error('❌ Migration analysis failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { BatchProxyMigration };