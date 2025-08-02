import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// Proxy leadpulse/admin/bot-detection to NestJS backend

export async function GET(
  request: NextRequest
) {
  return proxyToBackend(request, {
    backendPath: 'leadpulse/admin/bot-detection',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function POST(
  request: NextRequest
) {
  return proxyToBackend(request, {
    backendPath: 'leadpulse/admin/bot-detection',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}