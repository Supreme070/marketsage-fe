import type { NextRequest } from "next/server";
import { proxyToNestJS } from "@/lib/nestjs-proxy";

// Proxy leadpulse/admin/bot-detection to NestJS backend

export async function GET(
  request: NextRequest
) {
  return proxyToNestJS(request, {
    backendPath: 'leadpulse/admin/bot-detection',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function POST(
  request: NextRequest
) {
  return proxyToNestJS(request, {
    backendPath: 'leadpulse/admin/bot-detection',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}