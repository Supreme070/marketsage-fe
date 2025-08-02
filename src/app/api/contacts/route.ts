/**
 * Contacts API Proxy
 * Forwards all contact-related requests to the NestJS backend
 */

import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// GET contacts endpoint
export async function GET(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'contacts',
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

// POST endpoint to create a new contact
export async function POST(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'contacts',
    enableLogging: process.env.NODE_ENV === 'development',
  });
} 