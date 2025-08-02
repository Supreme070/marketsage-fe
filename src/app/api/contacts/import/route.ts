/**
 * Contacts Import API Proxy
 * Forwards import requests to the NestJS backend
 */

import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// POST contacts import endpoint
export async function POST(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'contacts/bulk-import',
    enableLogging: process.env.NODE_ENV === 'development',
  });
}