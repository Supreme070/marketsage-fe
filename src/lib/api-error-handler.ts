/**
 * Frontend Error Handling for Backend Service Communication
 * ========================================================
 *
 * Comprehensive error handling system for frontend-backend communication
 * when the backend service is unavailable or returns errors.
 */

interface ApiErrorOptions {
  retries?: number;
  timeout?: number;
  fallbackData?: unknown;
  showToast?: boolean;
  queueWhenOffline?: boolean;
}

interface BackendHealthStatus {
  isHealthy: boolean;
  lastChecked: number;
  consecutiveFailures: number;
}

interface QueuedRequest {
  id: string;
  url: string;
  options: RequestInit;
  timestamp: number;
  retries: number;
}

class ApiErrorHandler {
  private backendHealth: BackendHealthStatus = {
    isHealthy: true,
    lastChecked: 0,
    consecutiveFailures: 0,
  };

  private requestQueue: QueuedRequest[] = [];
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly MAX_CONSECUTIVE_FAILURES = 3;

  constructor() {
    this.startHealthMonitoring();
    this.processQueuePeriodically();
  }

  /**
   * Enhanced fetch with error handling, retries, and offline queueing
   */
  async fetchWithErrorHandling(
    url: string,
    options: RequestInit = {},
    errorOptions: ApiErrorOptions = {},
  ): Promise<Response> {
    const {
      retries = 3,
      timeout = 10000,
      fallbackData = null,
      showToast = true,
      queueWhenOffline = true,
    } = errorOptions;

    // Add timeout to request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const requestOptions: RequestInit = {
      ...options,
      signal: controller.signal,
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        // Reset health status on successful request
        if (!response.ok && response.status >= 500) {
          this.recordFailure();
        } else {
          this.recordSuccess();
        }

        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error as Error;

        console.warn(`API request failed (attempt ${attempt}/${retries}):`, {
          url,
          error: error instanceof Error ? error.message : "Unknown error",
          attempt,
        });

        // Record failure for health monitoring
        this.recordFailure();

        // If this is a network error and we should queue requests
        if (
          this.isNetworkError(error as Error) &&
          queueWhenOffline &&
          attempt === retries
        ) {
          await this.queueRequest(url, requestOptions);

          if (showToast && typeof window !== "undefined") {
            this.showOfflineToast();
          }

          // Return a response-like object with fallback data
          return new Response(
            JSON.stringify({
              success: false,
              error: "OFFLINE_QUEUED",
              message: "Request queued for when connection is restored",
              data: fallbackData,
            }),
            {
              status: 503,
              statusText: "Service Unavailable - Queued",
            },
          );
        }

        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          await this.delay(2 ** (attempt - 1) * 1000);
        }
      }
    }

    // All retries failed
    if (showToast && typeof window !== "undefined") {
      this.showErrorToast(lastError?.message || "Backend service unavailable");
    }

    throw new Error(
      `API request failed after ${retries} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Check if error indicates a network/connectivity issue
   */
  private isNetworkError(error: Error): boolean {
    const networkErrorMessages = [
      "fetch",
      "network",
      "connection",
      "timeout",
      "ENOTFOUND",
      "ECONNREFUSED",
      "ETIMEDOUT",
    ];

    return networkErrorMessages.some((msg) =>
      error.message.toLowerCase().includes(msg.toLowerCase()),
    );
  }

  /**
   * Queue request for later processing when backend is available
   */
  private async queueRequest(url: string, options: RequestInit): Promise<void> {
    if (this.requestQueue.length >= this.MAX_QUEUE_SIZE) {
      // Remove oldest request to make space
      this.requestQueue.shift();
    }

    const queuedRequest: QueuedRequest = {
      id: crypto.randomUUID(),
      url,
      options,
      timestamp: Date.now(),
      retries: 0,
    };

    this.requestQueue.push(queuedRequest);

    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "api_request_queue",
          JSON.stringify(this.requestQueue),
        );
      } catch (error) {
        console.warn("Failed to persist request queue:", error);
      }
    }
  }

  /**
   * Process queued requests when backend becomes available
   */
  private async processQueue(): Promise<void> {
    if (!this.backendHealth.isHealthy || this.requestQueue.length === 0) {
      return;
    }

    const processPromises = this.requestQueue.map(async (queuedRequest) => {
      try {
        const response = await fetch(queuedRequest.url, queuedRequest.options);

        if (response.ok) {
          // Request succeeded, remove from queue
          this.removeFromQueue(queuedRequest.id);
          return { success: true, id: queuedRequest.id };
        }
        // Request failed, increment retries
        queuedRequest.retries++;
        if (queuedRequest.retries >= 3) {
          this.removeFromQueue(queuedRequest.id);
        }
        return {
          success: false,
          id: queuedRequest.id,
          retries: queuedRequest.retries,
        };
      } catch (error) {
        queuedRequest.retries++;
        if (queuedRequest.retries >= 3) {
          this.removeFromQueue(queuedRequest.id);
        }
        return { success: false, id: queuedRequest.id, error };
      }
    });

    const results = await Promise.allSettled(processPromises);
    const processedCount = results.filter(
      (r) => r.status === "fulfilled",
    ).length;

    if (processedCount > 0) {
      console.log(`Processed ${processedCount} queued requests`);

      if (typeof window !== "undefined") {
        this.showSuccessToast(`Synchronized ${processedCount} offline actions`);
      }
    }
  }

  /**
   * Remove request from queue
   */
  private removeFromQueue(requestId: string): void {
    this.requestQueue = this.requestQueue.filter((req) => req.id !== requestId);

    // Update localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "api_request_queue",
          JSON.stringify(this.requestQueue),
        );
      } catch (error) {
        console.warn("Failed to update request queue:", error);
      }
    }
  }

  /**
   * Start periodic health monitoring
   */
  private startHealthMonitoring(): void {
    setInterval(() => {
      this.checkBackendHealth();
    }, this.HEALTH_CHECK_INTERVAL);

    // Initial health check
    this.checkBackendHealth();
  }

  /**
   * Check backend health
   */
  private async checkBackendHealth(): Promise<void> {
    try {
      const healthUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3006"}/api/v2/health`;

      const response = await fetch(healthUrl, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (response.ok) {
        const wasUnhealthy = !this.backendHealth.isHealthy;
        this.recordSuccess();

        // If backend just came back online, process queue
        if (wasUnhealthy) {
          console.log(
            "Backend service restored, processing queued requests...",
          );
          await this.processQueue();
        }
      } else {
        this.recordFailure();
      }
    } catch (error) {
      this.recordFailure();
    }
  }

  /**
   * Record successful request
   */
  private recordSuccess(): void {
    this.backendHealth.isHealthy = true;
    this.backendHealth.consecutiveFailures = 0;
    this.backendHealth.lastChecked = Date.now();
  }

  /**
   * Record failed request
   */
  private recordFailure(): void {
    this.backendHealth.consecutiveFailures++;
    this.backendHealth.lastChecked = Date.now();

    if (
      this.backendHealth.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES
    ) {
      this.backendHealth.isHealthy = false;
    }
  }

  /**
   * Process queue periodically
   */
  private processQueuePeriodically(): void {
    setInterval(() => {
      if (this.backendHealth.isHealthy) {
        this.processQueue();
      }
    }, 60000); // Every minute
  }

  /**
   * Load queued requests from localStorage on initialization
   */
  private loadQueueFromStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem("api_request_queue");
      if (stored) {
        this.requestQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.warn("Failed to load request queue from storage:", error);
      this.requestQueue = [];
    }
  }

  /**
   * Utility methods for UI feedback
   */
  private showErrorToast(message: string): void {
    // This would integrate with your toast system (e.g., sonner, react-hot-toast)
    console.error("API Error:", message);

    // If using sonner:
    // import { toast } from 'sonner';
    // toast.error(`Backend Error: ${message}`);
  }

  private showOfflineToast(): void {
    console.warn("Request queued for offline processing");

    // If using sonner:
    // import { toast } from 'sonner';
    // toast.warning('Working offline - changes will sync when connection is restored');
  }

  private showSuccessToast(message: string): void {
    console.log("Sync success:", message);

    // If using sonner:
    // import { toast } from 'sonner';
    // toast.success(message);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current backend health status
   */
  public getHealthStatus(): BackendHealthStatus {
    return { ...this.backendHealth };
  }

  /**
   * Get current queue status
   */
  public getQueueStatus(): { count: number; oldestRequest?: number } {
    return {
      count: this.requestQueue.length,
      oldestRequest:
        this.requestQueue.length > 0
          ? Math.min(...this.requestQueue.map((r) => r.timestamp))
          : undefined,
    };
  }

  /**
   * Clear the request queue (useful for testing or manual intervention)
   */
  public clearQueue(): void {
    this.requestQueue = [];
    if (typeof window !== "undefined") {
      localStorage.removeItem("api_request_queue");
    }
  }
}

// Export singleton instance
export const apiErrorHandler = new ApiErrorHandler();

// Export the main function for easy use
export async function fetchWithErrorHandling(
  url: string,
  options?: RequestInit,
  errorOptions?: ApiErrorOptions,
): Promise<Response> {
  return apiErrorHandler.fetchWithErrorHandling(url, options, errorOptions);
}

// Export types for consumers
export type { ApiErrorOptions, BackendHealthStatus, QueuedRequest };
