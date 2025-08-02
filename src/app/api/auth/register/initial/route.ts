import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// Proxy initial registration to NestJS backend
export async function POST(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'auth/register/initial',
    requireAuth: false,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}