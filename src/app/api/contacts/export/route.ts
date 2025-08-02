/**
 * Contacts Export API Proxy
 * Forwards export requests to the NestJS backend
 */

import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// GET contacts export endpoint
export async function GET(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'contacts/export',
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

// POST contacts export endpoint (for complex export requests)
export async function POST(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'contacts/export',
    enableLogging: process.env.NODE_ENV === 'development',
  });
}