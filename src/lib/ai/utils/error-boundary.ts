/**
 * Error Boundary Utility
 * Provides centralized error handling and logging
 */

import { logger } from '@/lib/logger';

class ErrorBoundary {
  handleError(error: unknown, context: string): Error {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error(`Error in ${context}`, {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      context
    });

    return new Error(`${context}: ${errorMessage}`);
  }
}

export const errorBoundary = new ErrorBoundary(); 