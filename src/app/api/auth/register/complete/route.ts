import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// Proxy registration completion to NestJS backend
export async function POST(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'auth/register/complete',
    requireAuth: false,
    enableLogging: process.env.NODE_ENV === 'development',
  });
} 