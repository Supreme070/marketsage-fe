/**
 * Email Campaign by ID API Proxy
 * Forwards all email campaign by ID requests to the NestJS backend
 */

import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// GET email campaign by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: campaignId } = await params;
  
  return proxyToBackend(request, {
    backendPath: `email/campaigns/${campaignId}`,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

// PATCH/Update email campaign by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: campaignId } = await params;
  
  return proxyToBackend(request, {
    backendPath: `email/campaigns/${campaignId}`,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

// DELETE email campaign by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: campaignId } = await params;
  
  return proxyToBackend(request, {
    backendPath: `email/campaigns/${campaignId}`,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}