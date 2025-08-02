// Common types used across the API

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
  message?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface SortOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterOptions {
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
  type?: string;
}

export interface BaseQueryDto extends SortOptions, FilterOptions {
  page?: number;
  limit?: number;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  services?: Array<{
    name: string;
    status: 'online' | 'offline' | 'degraded';
    responseTime?: number;
  }>;
  version?: string;
  uptime?: number;
}

export interface BulkOperationResult {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
  status: 'completed' | 'partial' | 'failed';
  processedAt: string;
}

export interface FileUploadResponse {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: Date;
  downloadUrl?: string;
}

export interface ExportRequest {
  format: 'csv' | 'xlsx' | 'json';
  filters?: Record<string, any>;
  columns?: string[];
}

export interface ExportResponse {
  exportId: string;
  status: 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys];

// Error types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  validationErrors?: ValidationError[];
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

// Webhook types
export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: Date;
  organizationId: string;
  attempts: number;
  status: 'pending' | 'delivered' | 'failed';
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}