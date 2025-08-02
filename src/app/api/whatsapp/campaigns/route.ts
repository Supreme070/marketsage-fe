/**
 * WhatsApp Campaigns API Proxy
 * Forwards all WhatsApp campaign requests to the NestJS backend
 */

import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// GET WhatsApp campaigns endpoint
export async function GET(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'whatsapp/campaigns',
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

// POST endpoint to create a new WhatsApp campaign
export async function POST(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'whatsapp/campaigns',
    enableLogging: process.env.NODE_ENV === 'development',
  });
}