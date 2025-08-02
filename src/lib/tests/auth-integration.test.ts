/**
 * Authentication Integration Tests
 * ===============================
 * 
 * Tests to verify that the new API-based authentication system
 * works correctly with NextAuth and the backend API
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { apiClient } from '../api-client';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('Authentication Integration', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('API Client Authentication', () => {
    it('should login successfully and store token', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'USER'
          },
          token: 'mock-jwt-token'
        },
        message: 'Login successful'
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.login('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          })
        })
      );
    });

    it('should register successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER'
        },
        message: 'User registered successfully'
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.register('test@example.com', 'password123', 'Test User');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
            company: undefined
          })
        })
      );
    });

    it('should include auth token in headers when token is set', async () => {
      const mockToken = 'mock-jwt-token';
      apiClient.setToken(mockToken);

      const mockResponse = {
        success: true,
        data: { id: 'user-123', email: 'test@example.com' },
        message: 'Profile retrieved successfully'
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await apiClient.getProfile();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/profile'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`
          })
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      const mockError = {
        message: 'Invalid credentials',
        code: 'UNAUTHORIZED'
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockError,
      } as Response);

      const result = await apiClient.login('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toEqual(
        expect.objectContaining({
          code: '401',
          message: mockError.message
        })
      );
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await apiClient.login('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toEqual(
        expect.objectContaining({
          code: 'NETWORK_ERROR',
          message: 'Network error'
        })
      );
    });
  });

  describe('Token Management', () => {
    it('should set and clear tokens correctly', () => {
      const mockToken = 'mock-jwt-token';
      
      // Mock localStorage
      const mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      });

      // Set token
      apiClient.setToken(mockToken);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('access_token', mockToken);

      // Clear token
      apiClient.clearToken();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('access_token');
    });
  });
});