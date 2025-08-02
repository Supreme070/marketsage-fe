import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// Proxy admin batch user operations to NestJS backend
export async function POST(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'admin/users/batch',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function PATCH(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'admin/users/batch',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}