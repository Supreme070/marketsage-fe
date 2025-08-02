import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// Proxy users/id/password to NestJS backend

export async function GET(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const params = await context.params;
  const dynamicPath = "users/id/password".replace(/\[(\w+)\]/g, (_, key) => params[key] || key);
  return proxyToBackend(request, {
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
  const dynamicPath = "users/id/password".replace(/\[(\w+)\]/g, (_, key) => params[key] || key);
  return proxyToBackend(request, {
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
  const dynamicPath = "users/id/password".replace(/\[(\w+)\]/g, (_, key) => params[key] || key);
  return proxyToBackend(request, {
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
  const dynamicPath = "users/id/password".replace(/\[(\w+)\]/g, (_, key) => params[key] || key);
  return proxyToBackend(request, {
    backendPath: dynamicPath,
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}