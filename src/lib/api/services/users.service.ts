import { BaseApiClient } from '../base/api-client';
import type {
  CreateUserDto,
  UpdateUserDto,
  UpdateUserPreferencesDto,
  User,
  UserStats,
  UserPreferences,
  UserDetails,
  PaginatedUsersResponse,
} from '../types/users';
import type { ApiResponse } from '../types/common';

export class UsersService extends BaseApiClient {
  /**
   * Create a new user
   */
  async createUser(userData: CreateUserDto): Promise<User> {
    try {
      const response = await this.post<ApiResponse<User>>('/users', userData);
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get all users with pagination and search
   */
  async getUsers(
    page = 1,
    limit = 10,
    search?: string
  ): Promise<PaginatedUsersResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) {
        params.append('search', search);
      }

      const response = await this.get<ApiResponse<PaginatedUsersResponse>>(
        `/users?${params.toString()}`
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    try {
      const response = await this.get<ApiResponse<User>>(`/users/${userId}`);
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User> {
    try {
      const response = await this.get<ApiResponse<User>>(`/users/email/${encodeURIComponent(email)}`);
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update user
   */
  async updateUser(userId: string, updateData: UpdateUserDto): Promise<User> {
    try {
      const response = await this.patch<ApiResponse<User>>(`/users/${userId}`, updateData);
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.delete<ApiResponse<any>>(`/users/${userId}`);
      return {
        success: response.success,
        message: response.message || 'User deleted successfully',
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const response = await this.get<ApiResponse<UserStats>>(`/users/${userId}/stats`);
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Change user password
   */
  async changeUserPassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.post<ApiResponse<any>>(`/users/${userId}/change-password`, {
        currentPassword,
        newPassword,
      });

      return {
        success: response.success,
        message: response.message || 'Password changed successfully',
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get current user's profile
   */
  async getMyProfile(): Promise<User> {
    try {
      const response = await this.get<ApiResponse<User>>('/users/me/profile');
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update current user's profile
   */
  async updateMyProfile(updateData: Omit<UpdateUserDto, 'role' | 'organizationId'>): Promise<User> {
    try {
      const response = await this.patch<ApiResponse<User>>('/users/me/profile', updateData);
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get user details (extended information)
   */
  async getUserDetails(userId: string): Promise<UserDetails> {
    try {
      const response = await this.get<ApiResponse<UserDetails>>(`/users/${userId}/details`);
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const response = await this.get<ApiResponse<UserPreferences>>(`/users/${userId}/preferences`);
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: UpdateUserPreferencesDto
  ): Promise<UserPreferences> {
    try {
      const response = await this.put<ApiResponse<UserPreferences>>(
        `/users/${userId}/preferences`,
        preferences
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Change user password with validation
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.post<ApiResponse<any>>(`/users/${userId}/password`, {
        currentPassword,
        newPassword,
      });

      return {
        success: response.success,
        message: response.message || 'Password changed successfully',
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Search users by various criteria
   */
  async searchUsers(
    query: string,
    filters?: {
      role?: string;
      organizationId?: string;
      isActive?: boolean;
    },
    page = 1,
    limit = 10
  ): Promise<PaginatedUsersResponse> {
    try {
      const params = new URLSearchParams({
        search: query,
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await this.get<ApiResponse<PaginatedUsersResponse>>(
        `/users?${params.toString()}`
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Bulk update users
   */
  async bulkUpdateUsers(
    userIds: string[],
    updateData: Partial<UpdateUserDto>
  ): Promise<{ success: boolean; updated: number; errors: Array<{ id: string; error: string }> }> {
    try {
      const response = await this.post<ApiResponse<any>>('/users/bulk-update', {
        userIds,
        updateData,
      });

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: string, page = 1, limit = 10): Promise<PaginatedUsersResponse> {
    try {
      const params = new URLSearchParams({
        role,
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await this.get<ApiResponse<PaginatedUsersResponse>>(
        `/users?${params.toString()}`
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get users by organization
   */
  async getUsersByOrganization(
    organizationId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedUsersResponse> {
    try {
      const params = new URLSearchParams({
        organizationId,
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await this.get<ApiResponse<PaginatedUsersResponse>>(
        `/users?${params.toString()}`
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }
}