import type { NextRequest } from "next/server";
import { proxyToNestJS } from "@/lib/nestjs-proxy";

// Proxy admin/users/[id]/role to NestJS backend

export async function PUT(
  request: NextRequest
) {
  return proxyToNestJS(request, {
    backendPath: 'admin/users/id/role',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}