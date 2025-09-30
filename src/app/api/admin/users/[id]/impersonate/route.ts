import type { NextRequest } from "next/server";
import { proxyToNestJS } from "@/lib/nestjs-proxy";

// Proxy admin/users/[id]/impersonate to NestJS backend

export async function POST(
  request: NextRequest
) {
  return proxyToNestJS(request, {
    backendPath: 'admin/users/id/impersonate',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function DELETE(
  request: NextRequest
) {
  return proxyToNestJS(request, {
    backendPath: 'admin/users/id/impersonate',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function GET(
  request: NextRequest
) {
  return proxyToNestJS(request, {
    backendPath: 'admin/users/id/impersonate',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}