/**
 * Contact by ID API Proxy
 * Forwards all contact by ID requests to the NestJS backend
 */

import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// GET contact by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: contactId } = await params;
  
  return proxyToBackend(request, {
    backendPath: `contacts/${contactId}`,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

// PATCH/Update contact by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: contactId } = await params;
  
  return proxyToBackend(request, {
    backendPath: `contacts/${contactId}`,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

// DELETE contact by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: contactId } = await params;
  
  return proxyToBackend(request, {
    backendPath: `contacts/${contactId}`,
    enableLogging: process.env.NODE_ENV === 'development',
  });
} 