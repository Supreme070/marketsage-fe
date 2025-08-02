/**
 * Email Campaigns API Proxy
 * Forwards all email campaign requests to the NestJS backend
 */

import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// GET email campaigns endpoint
export async function GET(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'email/campaigns',
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

// POST endpoint to create a new email campaign
export async function POST(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'email/campaigns',
    enableLogging: process.env.NODE_ENV === 'development',
  });
}