/**
 * SMS Campaigns API Proxy
 * Forwards all SMS campaign requests to the NestJS backend
 */

import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// GET SMS campaigns endpoint
export async function GET(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'sms/campaigns',
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

// POST endpoint to create a new SMS campaign
export async function POST(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'sms/campaigns',
    enableLogging: process.env.NODE_ENV === 'development',
  });
}