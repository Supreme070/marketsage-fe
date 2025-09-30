/**
 * SMS Campaign Duplication API Proxy
 * Forwards SMS campaign duplication requests to the NestJS backend
 */

import type { NextRequest } from "next/server";
import { proxyToNestJS } from "@/lib/nestjs-proxy";

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return proxyToNestJS(request, {
    backendPath: `sms/campaigns/${context.params.id}/duplicate`,
    enableLogging: process.env.NODE_ENV === 'development',
  });
} 