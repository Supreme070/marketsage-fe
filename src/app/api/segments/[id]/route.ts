import type { NextRequest } from "next/server";
import { proxyToNestJS } from "@/lib/nestjs-proxy";

export async function GET(request: NextRequest, context: { params: Promise<Record<string, string>> }) {
  const params = await context.params;
  const backendPath = request.url.split('/api/')[1].split('?')[0];
  return proxyToNestJS(request, {
    backendPath,
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function POST(request: NextRequest, context: { params: Promise<Record<string, string>> }) {
  const params = await context.params;
  const backendPath = request.url.split('/api/')[1].split('?')[0];
  return proxyToNestJS(request, {
    backendPath,
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function PATCH(request: NextRequest, context: { params: Promise<Record<string, string>> }) {
  const params = await context.params;
  const backendPath = request.url.split('/api/')[1].split('?')[0];
  return proxyToNestJS(request, {
    backendPath,
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function DELETE(request: NextRequest, context: { params: Promise<Record<string, string>> }) {
  const params = await context.params;
  const backendPath = request.url.split('/api/')[1].split('?')[0];
  return proxyToNestJS(request, {
    backendPath,
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}
