/**
 * Standardized error handling utilities for the application
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// Standard error types for the application
export enum ErrorType {
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  CONFLICT = "CONFLICT",
  RATE_LIMIT = "RATE_LIMIT",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  SERVER_ERROR = "SERVER_ERROR",
}

// Error response structure
export interface ErrorResponse {
  error: string;
  code: ErrorType;
  message: string;
  details?: any;
  timestamp: string;
  path?: string;
}

// HTTP status code mapping
const statusCodes: Record<ErrorType, number> = {
  [ErrorType.UNAUTHORIZED]: 401,
  [ErrorType.FORBIDDEN]: 403,
  [ErrorType.NOT_FOUND]: 404,
  [ErrorType.VALIDATION_ERROR]: 400,
  [ErrorType.CONFLICT]: 409,
  [ErrorType.RATE_LIMIT]: 429,
  [ErrorType.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorType.DATABASE_ERROR]: 500,
  [ErrorType.SERVER_ERROR]: 500,
};

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  type: ErrorType,
  message: string,
  details?: any,
  path?: string
): NextResponse<ErrorResponse> {
  // Sanitize details for production to prevent information disclosure
  const sanitizedDetails = process.env.NODE_ENV === 'production' 
    ? undefined  // Remove all details in production
    : details;

  // Create the error response object
  const errorResponse: ErrorResponse = {
    error: type,
    code: type,
    message,
    details: sanitizedDetails,
    timestamp: new Date().toISOString(),
    path: process.env.NODE_ENV === 'production' ? undefined : path,  // Hide paths in production
  };

  // Log the error using the centralized logger
  if (type === ErrorType.SERVER_ERROR || type === ErrorType.DATABASE_ERROR) {
    logger.error(`${type}: ${message}`, details, path);
  } else {
    logger.warn(`${type}: ${message}`, details, path);
  }

  // Return the formatted response with appropriate status code
  return NextResponse.json(errorResponse, { status: statusCodes[type] });
}

/**
 * Format Prisma errors to be more user-friendly and secure
 */
export function formatPrismaError(error: any): { type: ErrorType; message: string; details?: any } {
  // Check if it's a Prisma error
  if (!error.code && !error.meta) {
    return {
      type: ErrorType.SERVER_ERROR,
      message: "An unexpected error occurred",
      details: process.env.NODE_ENV === 'production' ? undefined : error.message,
    };
  }

  switch (error.code) {
    case "P2002": // Unique constraint failed
      return {
        type: ErrorType.CONFLICT,
        message: "A record with this information already exists",
        details: process.env.NODE_ENV === 'production' 
          ? undefined 
          : `Unique constraint failed on: ${error.meta?.target || "unknown field"}`,
      };
    case "P2003": // Foreign key constraint failed
      return {
        type: ErrorType.VALIDATION_ERROR,
        message: "Invalid reference to a related record",
        details: process.env.NODE_ENV === 'production' 
          ? undefined 
          : (error.meta?.field_name || error.message),
      };
    case "P2025": // Record not found
      return {
        type: ErrorType.NOT_FOUND,
        message: "The requested record does not exist",
        details: process.env.NODE_ENV === 'production' 
          ? undefined 
          : (error.meta?.cause || error.message),
      };
    case "P2021": // Table does not exist
    case "P2022": // Column does not exist
      return {
        type: ErrorType.DATABASE_ERROR,
        message: process.env.NODE_ENV === 'production' 
          ? "A database error occurred" 
          : "Database schema is outdated",
        details: process.env.NODE_ENV === 'production' ? undefined : error.message,
      };
    default:
      return {
        type: ErrorType.DATABASE_ERROR,
        message: "A database error occurred",
        details: process.env.NODE_ENV === 'production' ? undefined : error.message,
      };
  }
}

/**
 * Handle errors uniformly across API endpoints
 */
export function handleApiError(error: any, path?: string): NextResponse {
  // Special case for Prisma errors
  if (error.code && error.meta) {
    const { type, message, details } = formatPrismaError(error);
    return createErrorResponse(type, message, details, path);
  }

  // For other known error types
  if (error instanceof Error) {
    // In production, use generic message and no stack trace
    const message = process.env.NODE_ENV === 'production' 
      ? "An internal server error occurred"
      : error.message || "An unexpected error occurred";
    
    const details = process.env.NODE_ENV === 'production' 
      ? undefined  // Never expose stack traces in production
      : error.stack;

    return createErrorResponse(
      ErrorType.SERVER_ERROR,
      message,
      details,
      path
    );
  }

  // Default case for unknown errors
  return createErrorResponse(
    ErrorType.SERVER_ERROR,
    "An unexpected error occurred",
    error,
    path
  );
}

/**
 * Create a NOT_FOUND response
 */
export function notFound(message = "Resource not found", details?: any, path?: string): NextResponse {
  return createErrorResponse(ErrorType.NOT_FOUND, message, details, path);
}

/**
 * Create an UNAUTHORIZED response
 */
export function unauthorized(message = "Unauthorized", details?: any, path?: string): NextResponse {
  return createErrorResponse(ErrorType.UNAUTHORIZED, message, details, path);
}

/**
 * Create a FORBIDDEN response
 */
export function forbidden(message = "Forbidden", details?: any, path?: string): NextResponse {
  return createErrorResponse(ErrorType.FORBIDDEN, message, details, path);
}

/**
 * Create a VALIDATION_ERROR response
 */
export function validationError(message = "Validation failed", details?: any, path?: string): NextResponse {
  return createErrorResponse(ErrorType.VALIDATION_ERROR, message, details, path);
} 