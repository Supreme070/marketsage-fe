import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// Proxy all user operations to NestJS backend
// This ensures complete database separation as per architecture requirements

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  return proxyToBackend(request, {
    backendPath: `users/${params.id}`,
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  return proxyToBackend(request, {
    backendPath: `users/${params.id}`,
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  return proxyToBackend(request, {
    backendPath: `users/${params.id}`,
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}