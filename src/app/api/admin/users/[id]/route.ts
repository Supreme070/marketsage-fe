import type { NextRequest } from "next/server";
import { proxyToNestJS } from "@/lib/nestjs-proxy";

// Proxy admin user operations to NestJS backend

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  return proxyToNestJS(request, {
    backendPath: `admin/users/${params.id}`,
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  return proxyToNestJS(request, {
    backendPath: `admin/users/${params.id}`,
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  return proxyToNestJS(request, {
    backendPath: `admin/users/${params.id}`,
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}