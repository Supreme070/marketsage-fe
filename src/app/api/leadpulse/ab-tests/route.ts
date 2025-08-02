import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// Auto-converted to proxy pattern
export async function GET(request: NextRequest, context?: any) {
  const backendPath = request.url.replace('/api/', '').split('?')[0];
  return proxyToBackend(request, {
    backendPath,
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function POST(request: NextRequest, context?: any) {
  const backendPath = request.url.replace('/api/', '').split('?')[0];
  return proxyToBackend(request, {
    backendPath,
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function PATCH(request: NextRequest, context?: any) {
  const backendPath = request.url.replace('/api/', '').split('?')[0];
  return proxyToBackend(request, {
    backendPath,
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function DELETE(request: NextRequest, context?: any) {
  const backendPath = request.url.replace('/api/', '').split('?')[0];
  return proxyToBackend(request, {
    backendPath,
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}
