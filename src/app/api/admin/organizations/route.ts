import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// Proxy admin/organizations to NestJS backend

export async function GET(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'admin/organizations',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'admin/organizations',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function PATCH(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'admin/organizations',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

export async function DELETE(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'admin/organizations',
    requireAuth: true,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}