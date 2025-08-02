import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// Proxy admin user management to NestJS backend
export async function GET(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'admin/users',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'admin/users',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}