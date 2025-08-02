/**
 * Workflow by ID API Proxy
 * Forwards all workflow by ID requests to the NestJS backend
 */

import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

// GET workflow by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: workflowId } = await params;
  
  return proxyToBackend(request, {
    backendPath: `workflows/${workflowId}`,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

// PUT/Update workflow by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: workflowId } = await params;
  
  return proxyToBackend(request, {
    backendPath: `workflows/${workflowId}`,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}

// DELETE workflow by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: workflowId } = await params;
  
  return proxyToBackend(request, {
    backendPath: `workflows/${workflowId}`,
    enableLogging: process.env.NODE_ENV === 'development',
  });
}