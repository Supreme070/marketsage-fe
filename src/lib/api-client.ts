/**
 * API Client for Frontend-Backend Communication
 * ============================================
 *
 * Central API client to communicate with NestJS backend
 * Replaces direct database access in frontend
 */

import type { ApiResponse, PaginatedResponse } from "@/shared/types/api";
import { fetchWithErrorHandling } from "@/lib/api-error-handler";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3006";
const API_BASE = `${BACKEND_URL}/api/v2`;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string>;
}

class ApiClient {
  private getAuthHeaders(): Record<string, string> {
    // Try to get token from localStorage first (for manual token storage)
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;

    // If no token in localStorage, try to get it from NextAuth session
    // Note: This is primarily for client-side usage where session token
    // might be available through other means

    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Method to set token explicitly (useful after login)
  setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token);
    }
  }

  // Method to clear token (useful for logout)
  clearToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
    }
  }

  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(`${API_BASE}${endpoint}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, value);
      }
    }
    return url.toString();
  }

  async request<T = unknown>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const { method = "GET", headers = {}, body, params } = options;

    const url = this.buildUrl(endpoint, params);
    const config: RequestInit = {
      method,
      headers: {
        ...this.getAuthHeaders(),
        ...headers,
      },
    };

    if (body && method !== "GET") {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetchWithErrorHandling(url, config, {
        retries: 3,
        timeout: 15000,
        showToast: true,
        queueWhenOffline: true,
      });
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: response.status.toString(),
            message: data.message || "Request failed",
            details: data,
            timestamp: new Date().toISOString(),
          },
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "Network error",
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  // Authentication methods
  async login(email: string, password: string) {
    return this.request("/auth/login", {
      method: "POST",
      body: { email, password },
    });
  }

  async register(
    email: string,
    password: string,
    name: string,
    company?: string,
  ) {
    return this.request("/auth/register", {
      method: "POST",
      body: { email, password, name, company },
    });
  }

  async getProfile() {
    return this.request("/auth/profile");
  }

  // User management
  async getUsers(params?: { page?: number; limit?: number }) {
    return this.request("/users", { params: params as Record<string, string> });
  }

  async getUserById(id: string) {
    return this.request(`/users/${id}`);
  }

  async updateUser(id: string, data: unknown) {
    return this.request(`/users/${id}`, {
      method: "PATCH",
      body: data,
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: "DELETE",
    });
  }

  // Organization management
  async getOrganizations(params?: { page?: number; limit?: number }) {
    return this.request("/organizations", {
      params: params as Record<string, string>,
    });
  }

  async getOrganizationById(id: string) {
    return this.request(`/organizations/${id}`);
  }

  async createOrganization(data: unknown) {
    return this.request("/organizations", {
      method: "POST",
      body: data,
    });
  }

  // Notifications
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    unread?: boolean;
  }) {
    return this.request("/notifications", {
      params: params as Record<string, string>,
    });
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: "PATCH",
    });
  }

  async markAllNotificationsRead() {
    return this.request("/notifications/mark-all-read", {
      method: "PATCH",
    });
  }

  // AI Services
  async chatWithAI(message: string, context?: unknown) {
    return this.request("/ai/chat", {
      method: "POST",
      body: { message, context },
    });
  }

  async analyzeData(data: unknown, type: string) {
    return this.request("/ai/analyze", {
      method: "POST",
      body: { data, type },
    });
  }

  async predictData(data: unknown, model: string) {
    return this.request("/ai/predict", {
      method: "POST",
      body: { data, model },
    });
  }

  // Health and system status
  async getHealth() {
    return this.request("/health/simple");
  }

  async getMetrics() {
    return this.request("/metrics");
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;

// Type exports for consumers
export type { ApiResponse, PaginatedResponse };
