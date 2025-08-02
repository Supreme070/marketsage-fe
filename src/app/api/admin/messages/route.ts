import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// Proxy admin/messages to NestJS backend

export async function GET(
  request: NextRequest
) {
  return proxyToBackend(request, {
    backendPath: 'admin/messages',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}