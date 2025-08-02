import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// Proxy messaging/config to NestJS backend

export async function GET(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'messaging/config',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'messaging/config',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function PATCH(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'messaging/config',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function DELETE(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'messaging/config',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}