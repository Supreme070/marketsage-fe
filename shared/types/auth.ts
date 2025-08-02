export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  organizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  plan: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  accessToken?: string;
  message?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  organizationName?: string;
}

export interface RegisterResponse {
  success: boolean;
  user?: User;
  message?: string;
  accessToken?: string;
}

export interface JWTPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  organizationId?: string | null;
  iat?: number;
  exp?: number;
}

export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  IT_ADMIN = "IT_ADMIN", 
  SUPER_ADMIN = "SUPER_ADMIN",
  AI_AGENT = "AI_AGENT"
}

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, any>;
}