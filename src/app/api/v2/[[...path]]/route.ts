/**
 * NestJS Backend Proxy Route
 * Forwards all /api/v2/* requests to NestJS backend service
 * This enables gradual migration while maintaining existing /api/* routes
 */

import type { NextRequest } from 'next/server';
import { proxyToNestJS } from '@/lib/nestjs-proxy';

// Enable all HTTP methods
export async function GET(request: NextRequest) {
  return proxyToNestJS(request);
}

export async function POST(request: NextRequest) {
  return proxyToNestJS(request);
}

export async function PUT(request: NextRequest) {
  return proxyToNestJS(request);
}

export async function DELETE(request: NextRequest) {
  return proxyToNestJS(request);
}

export async function PATCH(request: NextRequest) {
  return proxyToNestJS(request);
}

export async function OPTIONS(request: NextRequest) {
  return proxyToNestJS(request);
}

export async function HEAD(request: NextRequest) {
  return proxyToNestJS(request);
}