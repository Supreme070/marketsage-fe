/**
 * API Discovery System - Frontend Stub
 * =====================================
 *
 * This is a TEMPORARY stub file to prevent build breakage.
 * The actual implementation should exist in the backend.
 *
 * TODO: Migrate /api/ai/api-discovery route to use backend API
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';

export enum APIMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

export enum SecurityLevel {
  PUBLIC = 'PUBLIC',
  AUTHENTICATED = 'AUTHENTICATED',
  AUTHORIZED = 'AUTHORIZED',
  ADMIN = 'ADMIN'
}

/**
 * API Discovery System
 *
 * STUB CLASS - Does not contain real implementation.
 * All methods should make API calls to backend.
 */
class APIDiscoverySystem {
  constructor() {
    console.warn('⚠️  Using stub APIDiscoverySystem. Migrate to backend API.');
  }

  async discoverExistingEndpoints(): Promise<any> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/api-discovery');
  }

  async getEndpoint(endpointId: string): Promise<any> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/api-discovery');
  }

  async getAllEndpoints(): Promise<any[]> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/api-discovery');
  }

  async getEndpointsByCategory(category: string): Promise<any[]> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/api-discovery');
  }

  async searchEndpoints(query: string): Promise<any[]> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/api-discovery');
  }

  async getCapability(capabilityId: string): Promise<any> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/api-discovery');
  }

  async getAllCapabilities(): Promise<any[]> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/api-discovery');
  }

  async testEndpoint(endpointId: string): Promise<any> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/api-discovery');
  }

  async learnFromUsage(endpointId: string, usage: any): Promise<void> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/api-discovery');
  }

  async getDiscoveryStatistics(): Promise<any> {
    throw new Error('Method not implemented - use backend API at /api/v2/ai/api-discovery');
  }
}

export const apiDiscoverySystem = new APIDiscoverySystem();
