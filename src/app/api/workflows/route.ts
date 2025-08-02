/**
 * Workflows API Proxy
 * Forwards all workflow-related requests to the NestJS backend
 */

import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// GET workflows endpoint
export async function GET(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'workflows',
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

// POST endpoint to create a new workflow
export async function POST(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'workflows',
    enableLogging: process.env.NODE_ENV === 'development',
  });
}