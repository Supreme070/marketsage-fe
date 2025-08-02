import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// Proxy AI chat streaming to NestJS backend
export async function POST(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'ai/chat-stream',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}