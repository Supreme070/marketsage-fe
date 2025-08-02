// User related types based on backend DTOs

import type { UserRole } from './auth';

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  organizationName?: string;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  role?: UserRole;
  organizationId?: string;
}

export interface UpdateUserPreferencesDto {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
  language?: string;
  timezone?: string;
  marketingOptIn?: boolean;
}

export interface UserStats {
  totalCampaigns: number;
  totalContacts: number;
  totalEmails: number;
  totalSMS: number;
  engagementRate: number;
  lastLogin: Date;
  accountAge: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  language: string;
  timezone: string;
  marketingOptIn: boolean;
}

export interface UserDetails extends User {
  preferences?: UserPreferences;
  stats?: UserStats;
}

export interface PaginatedUsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  organizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}