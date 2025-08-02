#!/usr/bin/env npx tsx
/**
 * Batch Route Conversion Script
 * =============================
 * 
 * Systematically converts API routes to proxy pattern
 * Implements Phase 2 database separation
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface RouteFile {
  path: string;
  fullPath: string;
  backendPath: string;
  methods: string[];
  requiresAuth: boolean;
}

class BatchRouteConverter {
  private routes: RouteFile[] = [];
  private convertedCount = 0;

  async findAllRoutes(): Promise<void> {
    console.log('🔍 Scanning all API routes...\n');

    const apiFiles = execSync(
      'find src/app/api -name "route.ts" -type f 2>/dev/null || echo ""',
      { encoding: 'utf-8', cwd: '/Users/supreme/Desktop/marketsage' }
    )
      .split('\n')
      .filter(f => f.trim() && !f.includes('node_modules'));

    console.log(`📊 Found ${apiFiles.length} route files\n`);

    for (const file of apiFiles) {
      if (!file) continue;
      
      const fullPath = path.join('/Users/supreme/Desktop/marketsage', file);
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Skip if already converted
      if (content.includes('proxyToBackend') && !content.includes('import.*prisma')) {
        continue;
      }

      // Skip if no database access
      if (!content.includes('prisma')) {
        continue;
      }

      const methods = this.extractMethods(content);
      const backendPath = this.generateBackendPath(file);
      const requiresAuth = this.determineAuthRequirement(file, content);

      this.routes.push({
        path: file,
        fullPath,
        backendPath,
        methods,
        requiresAuth
      });
    }

    console.log(`🎯 Found ${this.routes.length} routes requiring conversion\n`);
    this.printRoutesByPriority();
  }

  private extractMethods(content: string): string[] {
    const methods: string[] = [];
    const methodRegex = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/g;
    let match;
    
    while ((match = methodRegex.exec(content)) !== null) {
      methods.push(match[1]);
    }
    
    return methods;
  }

  private generateBackendPath(filePath: string): string {
    // Convert /src/app/api/users/[id]/route.ts -> users/[id]
    return filePath
      .replace('src/app/api/', '')
      .replace('/route.ts', '')
      .replace(/\[([^\]]+)\]/g, '$1'); // Remove brackets from dynamic segments
  }

  private determineAuthRequirement(filePath: string, content: string): boolean {
    // Public endpoints that don't require auth
    const publicPaths = ['/auth/', '/health', '/metrics'];
    
    if (publicPaths.some(p => filePath.includes(p))) {
      return false;
    }

    // Check if content has auth checks
    if (content.includes('getServerSession') || content.includes('checkAuth')) {
      return true;
    }

    return true; // Default to requiring auth
  }

  private printRoutesByPriority(): void {
    const authRoutes = this.routes.filter(r => r.path.includes('/auth/'));
    const adminRoutes = this.routes.filter(r => r.path.includes('/admin/'));
    const aiRoutes = this.routes.filter(r => r.path.includes('/ai/'));
    const userRoutes = this.routes.filter(r => r.path.includes('/users/'));
    const otherRoutes = this.routes.filter(r => 
      !r.path.includes('/auth/') && 
      !r.path.includes('/admin/') && 
      !r.path.includes('/ai/') &&
      !r.path.includes('/users/')
    );

    console.log('📋 Conversion Priority:');
    
    if (authRoutes.length > 0) {
      console.log(`\n🔐 AUTH ROUTES (${authRoutes.length}):`);
      authRoutes.forEach(r => console.log(`   - ${r.path} [${r.methods.join(', ')}]`));
    }

    if (adminRoutes.length > 0) {
      console.log(`\n👑 ADMIN ROUTES (${adminRoutes.length}):`);
      adminRoutes.slice(0, 10).forEach(r => console.log(`   - ${r.path} [${r.methods.join(', ')}]`));
      if (adminRoutes.length > 10) console.log(`   ... and ${adminRoutes.length - 10} more`);
    }

    if (aiRoutes.length > 0) {
      console.log(`\n🤖 AI ROUTES (${aiRoutes.length}):`);
      aiRoutes.slice(0, 5).forEach(r => console.log(`   - ${r.path} [${r.methods.join(', ')}]`));
      if (aiRoutes.length > 5) console.log(`   ... and ${aiRoutes.length - 5} more`);
    }

    if (userRoutes.length > 0) {
      console.log(`\n👤 USER ROUTES (${userRoutes.length}):`);
      userRoutes.forEach(r => console.log(`   - ${r.path} [${r.methods.join(', ')}]`));
    }

    if (otherRoutes.length > 0) {
      console.log(`\n📄 OTHER ROUTES (${otherRoutes.length}):`);
      otherRoutes.slice(0, 10).forEach(r => console.log(`   - ${r.path} [${r.methods.join(', ')}]`));
      if (otherRoutes.length > 10) console.log(`   ... and ${otherRoutes.length - 10} more`);
    }
  }

  generateProxyCode(route: RouteFile): string {
    const methods = route.methods.map(method => {
      const paramHandling = route.backendPath.includes('[') ? `
  const params = await context.params;
  const dynamicPath = "${route.backendPath}".replace(/\\[(\\w+)\\]/g, (_, key) => params[key] || key);` : '';

      return `export async function ${method}(
  request: NextRequest${route.backendPath.includes('[') ? ',\n  context: { params: Promise<Record<string, string>> }' : ''}
) {${paramHandling}
  return proxyToBackend(request, {
    backendPath: ${route.backendPath.includes('[') ? 'dynamicPath' : `'${route.backendPath}'`},
    requireAuth: ${route.requiresAuth},
    enableLogging: process.env.NODE_ENV === 'development',
  });
}`;
    }).join('\n\n');

    return `import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// Proxy ${route.path.replace('src/app/api/', '').replace('/route.ts', '')} to NestJS backend

${methods}`;
  }

  async convertRoute(route: RouteFile): Promise<boolean> {
    try {
      const proxyCode = this.generateProxyCode(route);
      fs.writeFileSync(route.fullPath, proxyCode);
      this.convertedCount++;
      return true;
    } catch (error) {
      console.error(`❌ Failed to convert ${route.path}:`, error);
      return false;
    }
  }

  async convertAll(): Promise<void> {
    console.log(`\n🚀 Starting conversion of ${this.routes.length} routes...\n`);

    // Convert in priority order
    const authRoutes = this.routes.filter(r => r.path.includes('/auth/'));
    const adminRoutes = this.routes.filter(r => r.path.includes('/admin/'));
    const criticalRoutes = [...authRoutes, ...adminRoutes];
    const otherRoutes = this.routes.filter(r => !criticalRoutes.includes(r));

    // Convert critical routes first
    for (const route of criticalRoutes) {
      const success = await this.convertRoute(route);
      console.log(`${success ? '✅' : '❌'} ${route.path}`);
    }

    console.log(`\n📊 Converted ${this.convertedCount}/${this.routes.length} routes`);
    console.log(`⏳ Remaining: ${otherRoutes.length} routes\n`);

    if (otherRoutes.length > 0) {
      console.log('🔄 Continue with remaining routes? (Run script again for batch 2)');
    }
  }

  async convertBatch(startIndex = 0, batchSize = 20): Promise<void> {
    const batch = this.routes.slice(startIndex, startIndex + batchSize);
    
    console.log(`\n🚀 Converting batch ${Math.floor(startIndex/batchSize) + 1} (${batch.length} routes)...\n`);

    for (const route of batch) {
      const success = await this.convertRoute(route);
      console.log(`${success ? '✅' : '❌'} ${route.path}`);
    }

    console.log(`\n📊 Batch complete: ${this.convertedCount} total conversions`);
    
    if (startIndex + batchSize < this.routes.length) {
      console.log(`⏳ Next batch: ${this.routes.length - (startIndex + batchSize)} routes remaining`);
    } else {
      console.log('🎉 All routes converted!');
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 MarketSage Batch Route Converter\n');
  console.log('===================================\n');

  const converter = new BatchRouteConverter();

  try {
    await converter.findAllRoutes();
    
    // Convert critical routes first (auth + admin)
    await converter.convertAll();
    
    console.log('\n📝 Next Steps:');
    console.log('1. Test converted endpoints');
    console.log('2. Start NestJS backend: cd ../marketsage-backend && npm run dev');
    console.log('3. Run remaining batches if needed');
    console.log('4. Remove Prisma dependencies from frontend\n');
    
  } catch (error) {
    console.error('❌ Conversion failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { BatchRouteConverter };