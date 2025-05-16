import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * Generic error handler for API routes
 */
export function handleApiError(error: any, source: string): NextResponse {
  logger.error(`API Error in ${source}:`, error);
  
  // Handle known error types
  if (error.code === "P2025") {
    return NextResponse.json(
      { error: "Resource not found" },
      { status: 404 }
    );
  }
  
  // Generic error response
  return NextResponse.json(
    { error: error.message || "An unexpected error occurred" },
    { status: 500 }
  );
}

/**
 * Helper to return an unauthorized response
 */
export function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
}

/**
 * Helper to return a forbidden response
 */
export function forbidden() {
  return NextResponse.json(
    { error: "Forbidden" },
    { status: 403 }
  );
}

/**
 * Helper to return a not found response
 */
export function notFound(message = "Resource not found") {
  return NextResponse.json(
    { error: message },
    { status: 404 }
  );
}

/**
 * Helper to return a validation error response
 */
export function validationError(errors: any) {
  return NextResponse.json(
    { 
      error: "Validation Error", 
      details: errors 
    },
    { status: 400 }
  );
} 