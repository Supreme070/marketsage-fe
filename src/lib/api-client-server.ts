/**
 * Server-side API Client for Frontend-Backend Communication
 * ========================================================
 * 
 * Server-side version of API client that can use NextAuth session tokens
 * for authenticated requests on the server side
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { ApiResponse, PaginatedResponse } from '@/shared/types/api';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';
const API_BASE = `${BACKEND_URL}/api/v2`;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  useAuth?: boolean;
}

class ServerApiClient {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const session = await getServerSession(authOptions);
    const token = session?.accessToken;
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(`${API_BASE}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return url.toString();
  }

  async request<T = any>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      params,
      useAuth = true
    } = options;

    const url = this.buildUrl(endpoint, params);
    const config: RequestInit = {
      method,
      headers: {
        ...(useAuth ? await this.getAuthHeaders() : { 'Content-Type': 'application/json' }),
        ...headers,
      },
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: response.status.toString(),
            message: data.message || 'Request failed',
            details: data,
            timestamp: new Date().toISOString(),
          }
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
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
          timestamp: new Date().toISOString(),
        }
      };
    }
  }

  // Authentication methods
  async verifyToken() {
    return this.request('/auth/verify-token', {
      method: 'POST'
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // User management
  async getUsers(params?: { page?: number; limit?: number }) {
    return this.request('/users', { params: params as Record<string, string> });
  }

  async getUserById(id: string) {
    return this.request(`/users/${id}`);
  }

  async updateUser(id: string, data: any) {
    return this.request(`/users/${id}`, {
      method: 'PATCH',
      body: data
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE'
    });
  }

  // Health check
  async getHealth() {
    return this.request('/health/simple', { useAuth: false });
  }
}

// Export singleton instance
export const serverApiClient = new ServerApiClient();
export default serverApiClient;

// Type exports for consumers
export type { ApiResponse, PaginatedResponse };