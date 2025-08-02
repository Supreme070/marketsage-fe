import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// Proxy sms/campaigns/[id]/schedule to NestJS backend

export async function GET(request: NextRequest, context?: any) {
  return proxyToBackend(request, {
    backendPath: 'sms/campaigns/[id]/schedule',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function POST(request: NextRequest, context?: any) {
  return proxyToBackend(request, {
    backendPath: 'sms/campaigns/[id]/schedule',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function PATCH(request: NextRequest, context?: any) {
  return proxyToBackend(request, {
    backendPath: 'sms/campaigns/[id]/schedule',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function DELETE(request: NextRequest, context?: any) {
  return proxyToBackend(request, {
    backendPath: 'sms/campaigns/[id]/schedule',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}
