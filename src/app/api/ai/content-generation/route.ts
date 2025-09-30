/**
 * AI Content Generation API Proxy
 * Forwards AI content generation requests to the NestJS backend
 */

import type { NextRequest } from "next/server";
import { proxyToNestJS } from "@/lib/nestjs-proxy";

// POST AI content generation endpoint
export async function POST(request: NextRequest) {
  return proxyToNestJS(request, {
    backendPath: 'ai/content-generation',
    enableLogging: process.env.NODE_ENV === 'development',
    timeout: 60000, // 60 second timeout for AI requests
  });
}

// GET AI content generation history/status
export async function GET(request: NextRequest) {
  return proxyToNestJS(request, {
    backendPath: 'ai/content-generation',
    enableLogging: process.env.NODE_ENV === 'development',
  });
}