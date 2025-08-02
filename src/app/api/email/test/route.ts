/**
 * Email Test API Proxy
 * Forwards email test requests to the NestJS backend
 */

import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

export async function POST(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'email/test',
    enableLogging: process.env.NODE_ENV === 'development',
  });
}