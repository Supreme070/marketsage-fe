import type { NextRequest } from "next/server";
import { proxyToNestJS } from "@/lib/nestjs-proxy";

// Proxy AI chat streaming to NestJS backend
export async function POST(request: NextRequest) {
  return proxyToNestJS(request, {
    backendPath: 'ai/chat-stream',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}