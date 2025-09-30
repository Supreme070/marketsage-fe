/**
 * AI Chat API Proxy
 * Forwards AI chat requests to the NestJS backend
 */

import type { NextRequest } from "next/server";
import { proxyToNestJS } from "@/lib/nestjs-proxy";

// POST AI chat endpoint
export async function POST(request: NextRequest) {
  return proxyToNestJS(request, {
    backendPath: 'ai/chat',
    enableLogging: process.env.NODE_ENV === 'development',
    timeout: 60000, // 60 second timeout for AI requests
  });
}