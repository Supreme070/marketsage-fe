/**
 * Authentication Integration Tests
 * ===============================
 * 
 * Tests to verify that the new API-based authentication system
 * works correctly with NextAuth and the backend API
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { apiClient } from '../api/client';

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

      const result = await apiClient.auth.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockResponse.data.user);
      expect(result.token).toEqual(mockResponse.data.token);
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

    it('should register successfully using multi-step flow', async () => {
      // Step 1: Initial registration
      const initialResponse = {
        success: true,
        data: {
          registrationId: 'reg-123',
          verificationPin: '123456'
        },
        message: 'Verification email sent. Please check your inbox.'
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => initialResponse,
      } as Response);

      const initialResult = await apiClient.auth.startRegistration({
        name: 'Test User',
        email: 'test@example.com'
      });

      expect(initialResult.success).toBe(true);
      expect(initialResult.registrationId).toBe('reg-123');

      // Step 2: Verify PIN
      const verifyResponse = {
        success: true,
        message: 'Email verified successfully. You can now complete your registration.'
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => verifyResponse,
      } as Response);

      const verifyResult = await apiClient.auth.verifyPin({
        registrationId: 'reg-123',
        pin: '123456'
      });

      expect(verifyResult.success).toBe(true);

      // Step 3: Complete registration
      const completeResponse = {
        success: true,
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'USER'
          },
          accessToken: 'mock-jwt-token'
        },
        message: 'Registration completed successfully'
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => completeResponse,
      } as Response);

      const completeResult = await apiClient.auth.completeRegistration({
        registrationId: 'reg-123',
        password: 'password123'
      });

      expect(completeResult.success).toBe(true);
      expect(completeResult.user).toEqual(completeResponse.data.user);
    });

    it('should include auth token in headers when token is set', async () => {
      const mockToken = 'mock-jwt-token';
      
      // Mock the session to return a token
      const mockSession = {
        accessToken: mockToken,
        user: { id: 'user-123', email: 'test@example.com' }
      };
      
      // Mock getSession to return our mock session
      jest.doMock('next-auth/react', () => ({
        getSession: jest.fn().mockResolvedValue(mockSession)
      }));

      const mockResponse = {
        success: true,
        data: { id: 'user-123', email: 'test@example.com' },
        message: 'Profile retrieved successfully'
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await apiClient.auth.getProfile();

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

      const result = await apiClient.auth.login({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

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

      const result = await apiClient.auth.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toEqual(
        expect.objectContaining({
          code: 'NETWORK_ERROR',
          message: 'Network error'
        })
      );
    });
  });
});