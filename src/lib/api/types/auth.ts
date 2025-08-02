// Auth related types based on backend DTOs

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  IT_ADMIN = 'IT_ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  AI_AGENT = 'AI_AGENT',
}

export enum OrganizationPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
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

// Registration DTOs
export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  company?: string;
}

export interface InitialRegistrationDto {
  name: string;
  email: string;
}

export interface VerifyPinDto {
  registrationId: string;
  pin: string;
}

export interface CompleteRegistrationDto {
  registrationId: string;
  password: string;
}

// Login DTO
export interface LoginDto {
  email: string;
  password: string;
}

// Change Password DTO
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// Response types
export interface LoginResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface InitialRegistrationResponse {
  success: boolean;
  message: string;
  registrationId?: string;
}

export interface VerifyPinResponse {
  success: boolean;
  message: string;
}

export interface CompleteRegistrationResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data?: User;
}

export interface TokenVerificationResponse {
  success: boolean;
  message: string;
  data?: {
    valid: boolean;
    user: User;
  };
}