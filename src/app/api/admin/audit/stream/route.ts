import type { NextRequest } from "next/server";
import { proxyToNestJS } from "@/lib/nestjs-proxy";

// Proxy admin/audit/stream to NestJS backend

export async function GET(
  request: NextRequest
) {
  return proxyToNestJS(request, {
    backendPath: 'admin/audit/stream',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}