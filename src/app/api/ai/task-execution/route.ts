/**
 * AI Task Execution API Proxy
 * Forwards AI task execution requests to the NestJS backend
 */

import type { NextRequest } from "next/server";
import { proxyToNestJS } from "@/lib/nestjs-proxy";

// POST AI task execution endpoint
export async function POST(request: NextRequest) {
  return proxyToNestJS(request, {
    backendPath: 'ai/task-execution',
    enableLogging: process.env.NODE_ENV === 'development',
    timeout: 120000, // 2 minute timeout for complex AI tasks
  });
}

// GET AI task execution status
export async function GET(request: NextRequest) {
  return proxyToNestJS(request, {
    backendPath: 'ai/task-execution',
    enableLogging: process.env.NODE_ENV === 'development',
  });
}