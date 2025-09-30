import type { NextRequest } from "next/server";
import { proxyToNestJS } from "@/lib/nestjs-proxy";

export async function GET(request: NextRequest) {
  return proxyToNestJS(request, {
    backendPath: 'ai/testing',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function POST(request: NextRequest) {
  return proxyToNestJS(request, {
    backendPath: 'ai/testing',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function PATCH(request: NextRequest) {
  return proxyToNestJS(request, {
    backendPath: 'ai/testing',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function DELETE(request: NextRequest) {
  return proxyToNestJS(request, {
    backendPath: 'ai/testing',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}
