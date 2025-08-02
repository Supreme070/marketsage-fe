import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// Proxy admin/users/[id]/role to NestJS backend

export async function PUT(
  request: NextRequest
) {
  return proxyToBackend(request, {
    backendPath: 'admin/users/id/role',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}