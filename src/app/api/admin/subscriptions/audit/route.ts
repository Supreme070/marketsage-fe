import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// Proxy admin/subscriptions/audit to NestJS backend

export async function GET(
  request: NextRequest
) {
  return proxyToBackend(request, {
    backendPath: 'admin/subscriptions/audit',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}