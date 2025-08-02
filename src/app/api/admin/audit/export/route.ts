import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// Proxy admin/audit/export to NestJS backend

export async function GET(
  request: NextRequest
) {
  return proxyToBackend(request, {
    backendPath: 'admin/audit/export',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}