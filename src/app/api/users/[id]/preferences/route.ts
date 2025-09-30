import type { NextRequest } from "next/server";
import { proxyToNestJS } from "@/lib/nestjs-proxy";

// Proxy users/id/preferences to NestJS backend

export async function GET(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const params = await context.params;
  const dynamicPath = "users/id/preferences".replace(/\[(\w+)\]/g, (_, key) => params[key] || key);
  return proxyToNestJS(request, {
    backendPath: dynamicPath,
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const params = await context.params;
  const dynamicPath = "users/id/preferences".replace(/\[(\w+)\]/g, (_, key) => params[key] || key);
  return proxyToNestJS(request, {
    backendPath: dynamicPath,
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const params = await context.params;
  const dynamicPath = "users/id/preferences".replace(/\[(\w+)\]/g, (_, key) => params[key] || key);
  return proxyToNestJS(request, {
    backendPath: dynamicPath,
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const params = await context.params;
  const dynamicPath = "users/id/preferences".replace(/\[(\w+)\]/g, (_, key) => params[key] || key);
  return proxyToNestJS(request, {
    backendPath: dynamicPath,
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}