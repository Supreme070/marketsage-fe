/**
 * AI Predictive Analytics API Proxy
 * Forwards AI predictive analytics requests to the NestJS backend
 */

import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// POST AI predictive analytics endpoint
export async function POST(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'ai/predictive',
    enableLogging: process.env.NODE_ENV === 'development',
    timeout: 90000, // 90 second timeout for predictive analytics
  });
}

// GET AI predictive analytics results
export async function GET(request: NextRequest) {
  return proxyToBackend(request, {
    backendPath: 'ai/predictive',
    enableLogging: process.env.NODE_ENV === 'development',
  });
}