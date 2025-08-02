/**
 * Workflow Execute API Proxy
 * Forwards workflow execution requests to the NestJS backend
 */

import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// POST workflow execution endpoint
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: workflowId } = await params;
  
  return proxyToBackend(request, {
    backendPath: `workflows/${workflowId}/execute`,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}