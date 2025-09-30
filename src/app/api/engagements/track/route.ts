import type { NextRequest } from "next/server";
import { proxyToNestJS } from "@/lib/nestjs-proxy";

// Proxy engagements/track to NestJS backend

export async function GET(request: NextRequest, context?: any) {
  return proxyToNestJS(request, {
    backendPath: 'engagements/track',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function POST(request: NextRequest, context?: any) {
  return proxyToNestJS(request, {
    backendPath: 'engagements/track',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function PATCH(request: NextRequest, context?: any) {
  return proxyToNestJS(request, {
    backendPath: 'engagements/track',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function DELETE(request: NextRequest, context?: any) {
  return proxyToNestJS(request, {
    backendPath: 'engagements/track',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}
