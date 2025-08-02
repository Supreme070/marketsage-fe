import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// Proxy admin/support to NestJS backend

export async function GET(
  request: NextRequest
) {
  return proxyToBackend(request, {
    backendPath: 'admin/support',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function POST(
  request: NextRequest
) {
  return proxyToBackend(request, {
    backendPath: 'admin/support',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}