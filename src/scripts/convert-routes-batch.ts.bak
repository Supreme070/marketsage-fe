#!/usr/bin/env npx tsx
/**
 * High-Speed Route Conversion
 * ===========================
 * 
 * Converts multiple routes to proxy pattern quickly
 */

import fs from 'fs';
import path from 'path';

const routesToConvert = [
  // AI Routes
  '/Users/supreme/Desktop/marketsage/src/app/api/ai/queue/route.ts',
  '/Users/supreme/Desktop/marketsage/src/app/api/ai/permissions/route.ts',
  '/Users/supreme/Desktop/marketsage/src/app/api/ai/task-approval/route.ts',
  '/Users/supreme/Desktop/marketsage/src/app/api/ai/supreme-v3/route.ts',
  
  // Admin Organization Routes
  '/Users/supreme/Desktop/marketsage/src/app/api/admin/organizations/route.ts',
  '/Users/supreme/Desktop/marketsage/src/app/api/admin/organizations/stats/route.ts',
  '/Users/supreme/Desktop/marketsage/src/app/api/admin/metrics/route.ts',
  '/Users/supreme/Desktop/marketsage/src/app/api/admin/settings/route.ts',
  '/Users/supreme/Desktop/marketsage/src/app/api/admin/quick-stats/route.ts',
  
  // User Routes
  '/Users/supreme/Desktop/marketsage/src/app/api/users/[id]/preferences/route.ts',
  '/Users/supreme/Desktop/marketsage/src/app/api/users/[id]/password/route.ts',
  
  // Messaging Routes
  '/Users/supreme/Desktop/marketsage/src/app/api/messaging/usage/route.ts',
  '/Users/supreme/Desktop/marketsage/src/app/api/messaging/optimization/route.ts',
  '/Users/supreme/Desktop/marketsage/src/app/api/messaging/config/route.ts',
  '/Users/supreme/Desktop/marketsage/src/app/api/messaging/analytics/route.ts',
];

function getBackendPath(fullPath: string): string {
  return fullPath
    .replace('/Users/supreme/Desktop/marketsage/src/app/api/', '')
    .replace('/route.ts', '')
    .replace(/\[([^\]]+)\]/g, '$1');
}

function generateProxyCode(fullPath: string): string {
  const backendPath = getBackendPath(fullPath);
  const hasParams = backendPath.includes('[') || fullPath.includes('[');
  const requiresAuth = !fullPath.includes('/health') && !fullPath.includes('/metrics');

  if (hasParams) {
    return `import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// Proxy ${backendPath} to NestJS backend

export async function GET(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const params = await context.params;
  const dynamicPath = "${backendPath}".replace(/\\[(\\w+)\\]/g, (_, key) => params[key] || key);
  return proxyToBackend(request, {
    backendPath: dynamicPath,
    requireAuth: ${requiresAuth},
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const params = await context.params;
  const dynamicPath = "${backendPath}".replace(/\\[(\\w+)\\]/g, (_, key) => params[key] || key);
  return proxyToBackend(request, {
    backendPath: dynamicPath,
    requireAuth: ${requiresAuth},
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const params = await context.params;
  const dynamicPath = "${backendPath}".replace(/\\[(\\w+)\\]/g, (_, key) => params[key] || key);
  return proxyToBackend(request, {
    backendPath: dynamicPath,
    requireAuth: ${requiresAuth},
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const params = await context.params;
  const dynamicPath = "${backendPath}".replace(/\\[(\\w+)\\]/g, (_, key) => params[key] || key);
  return proxyToBackend(request, {
    backendPath: dynamicPath,
    requireAuth: ${requiresAuth},
    enableLogging: process.env.NODE_ENV === 'development',
  });
}`;
  } else {
    return `import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// Proxy ${backendPath} to NestJS backend

export async function GET(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: '${backendPath}',
    requireAuth: ${requiresAuth},
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: '${backendPath}',
    requireAuth: ${requiresAuth},
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function PATCH(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: '${backendPath}',
    requireAuth: ${requiresAuth},
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function DELETE(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: '${backendPath}',
    requireAuth: ${requiresAuth},
    enableLogging: process.env.NODE_ENV === 'development',
  });
}`;
  }
}

async function main() {
  console.log('🚀 High-Speed Route Conversion\n');
  console.log(`Converting ${routesToConvert.length} routes...\n`);

  let converted = 0;
  let skipped = 0;

  for (const routePath of routesToConvert) {
    try {
      // Check if file exists
      if (!fs.existsSync(routePath)) {
        console.log(`⏭️  ${routePath} - Not found, skipping`);
        skipped++;
        continue;
      }

      // Check if already converted
      const currentContent = fs.readFileSync(routePath, 'utf-8');
      if (currentContent.includes('proxyToBackend') && !currentContent.includes('import.*prisma')) {
        console.log(`✅ ${routePath} - Already converted`);
        converted++;
        continue;
      }

      // Generate and write proxy code
      const proxyCode = generateProxyCode(routePath);
      fs.writeFileSync(routePath, proxyCode);
      console.log(`🔄 ${routePath} - Converted`);
      converted++;

    } catch (error) {
      console.log(`❌ ${routePath} - Error: ${error.message}`);
    }
  }

  console.log(`\n📊 Conversion Summary:`);
  console.log(`   ✅ Converted: ${converted}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📄 Total: ${routesToConvert.length}\n`);
}

if (require.main === module) {
  main();
}