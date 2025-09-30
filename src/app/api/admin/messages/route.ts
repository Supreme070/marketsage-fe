import type { NextRequest } from "next/server";
import { proxyToNestJS } from "@/lib/nestjs-proxy";

// Proxy admin/messages to NestJS backend

export async function GET(
  request: NextRequest
) {
  return proxyToNestJS(request, {
    backendPath: 'admin/messages',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}