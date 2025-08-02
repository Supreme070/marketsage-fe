import { BaseApiClient } from '../base/api-client';
import type {
  LoginDto,
  RegisterDto,
  InitialRegistrationDto,
  VerifyPinDto,
  CompleteRegistrationDto,
  ChangePasswordDto,
  LoginResponse,
  RegisterResponse,
  InitialRegistrationResponse,
  VerifyPinResponse,
  CompleteRegistrationResponse,
  ProfileResponse,
  TokenVerificationResponse,
} from '../types/auth';
import type { ApiResponse } from '../types/common';

export class AuthService extends BaseApiClient {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginDto): Promise<LoginResponse> {
    try {
      const response = await this.post<ApiResponse<{ user: any; token: string }>>(
        '/auth/login',
        credentials
      );

      return {
        success: response.success,
        message: response.message || 'Login successful',
        user: response.data?.user,
        token: response.data?.token,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterDto): Promise<RegisterResponse> {
    try {
      const response = await this.post<ApiResponse<any>>('/auth/register', userData);

      return {
        success: response.success,
        message: response.message || 'Registration successful',
        user: response.data,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ProfileResponse> {
    try {
      const response = await this.get<ApiResponse<any>>('/auth/profile');

      return {
        success: response.success,
        message: response.message || 'Profile retrieved successfully',
        data: response.data,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(): Promise<TokenVerificationResponse> {
    try {
      const response = await this.post<ApiResponse<{ valid: boolean; user: any }>>(
        '/auth/verify-token'
      );

      return {
        success: response.success,
        message: response.message || 'Token verified successfully',
        data: response.data,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Test database connection
   */
  async testDatabase(): Promise<{ success: boolean; userCount: number; message: string }> {
    try {
      const response = await this.post<ApiResponse<{ userCount: number }>>('/auth/test-db');

      return {
        success: response.success,
        userCount: response.data?.userCount || 0,
        message: response.message || 'Database test completed',
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  // Multi-step registration methods

  /**
   * Start initial registration process
   */
  async startRegistration(userData: InitialRegistrationDto): Promise<InitialRegistrationResponse> {
    try {
      const response = await this.post<ApiResponse<{ registrationId: string }>>(
        '/auth/register/initial',
        userData
      );

      return {
        success: response.success,
        message: response.message || 'Registration started successfully',
        registrationId: response.data?.registrationId,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Verify PIN during registration
   */
  async verifyPin(verificationData: VerifyPinDto): Promise<VerifyPinResponse> {
    try {
      const response = await this.post<ApiResponse<any>>('/auth/register/verify', verificationData);

      return {
        success: response.success,
        message: response.message || 'PIN verified successfully',
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Complete registration process
   */
  async completeRegistration(
    completionData: CompleteRegistrationDto
  ): Promise<CompleteRegistrationResponse> {
    try {
      const response = await this.post<ApiResponse<{ user: any }>>(
        '/auth/register/complete',
        completionData
      );

      return {
        success: response.success,
        message: response.message || 'Registration completed successfully',
        user: response.data?.user,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Change user password
   */
  async changePassword(passwordData: ChangePasswordDto): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.post<ApiResponse<any>>('/auth/change-password', passwordData);

      return {
        success: response.success,
        message: response.message || 'Password changed successfully',
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Logout user (client-side cleanup)
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      // Clear any stored tokens or session data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
      }

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Logout failed',
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const result = await this.verifyToken();
      return result.success && result.data?.valid === true;
    } catch (error) {
      return false;
    }
  }
}