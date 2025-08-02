/**
 * MCP Types for MarketSage
 * 
 * This file defines all TypeScript interfaces and types used by the MCP implementation.
 */

import { z } from 'zod';

// ============================================================================
// Authentication Types
// ============================================================================

export interface MCPAuthContext {
  userId: string;
  organizationId: string;
  role: 'USER' | 'ADMIN' | 'IT_ADMIN' | 'SUPER_ADMIN';
  permissions: string[];
  sessionId?: string;
}

export interface MCPAuthResult {
  success: boolean;
  context?: MCPAuthContext;
  error?: string;
}

// ============================================================================
// Resource Types
// ============================================================================

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPResourceContent {
  uri: string;
  mimeType: string;
  text?: string;
  blob?: Uint8Array;
}

// ============================================================================
// Server Configuration Types
// ============================================================================

export interface MCPServerConfig {
  name: string;
  port: number;
  enabled: boolean;
  description?: string;
  capabilities?: string[];
}

// ============================================================================
// Tool Types
// ============================================================================

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<any>;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    resource?: MCPResource;
  }>;
  isError?: boolean;
}

// ============================================================================
// Customer Data Types
// ============================================================================

export const CustomerQuerySchema = z.object({
  id: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  organizationId: z.string().optional(),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
  includeSegments: z.boolean().default(false),
  includePredictions: z.boolean().default(false)
});

export type CustomerQuery = z.infer<typeof CustomerQuerySchema>;

export interface CustomerProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  organizationId: string;
  segments?: string[];
  predictions?: {
    churnRisk: number;
    lifetimeValue: number;
    engagementScore: number;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Campaign Analytics Types
// ============================================================================

export const CampaignAnalyticsQuerySchema = z.object({
  campaignId: z.string().optional(),
  organizationId: z.string().optional(),
  type: z.enum(['EMAIL', 'SMS', 'WHATSAPP']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
  includeABTests: z.boolean().default(false)
});

export type CampaignAnalyticsQuery = z.infer<typeof CampaignAnalyticsQuerySchema>;

export interface CampaignAnalytics {
  id: string;
  name: string;
  type: 'EMAIL' | 'SMS' | 'WHATSAPP';
  organizationId: string;
  performance: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    bounced: number;
    unsubscribed: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    revenue: number;
  };
  abTests?: {
    variant: string;
    performance: any;
  }[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// LeadPulse Types
// ============================================================================

export const LeadPulseQuerySchema = z.object({
  visitorId: z.string().optional(),
  sessionId: z.string().optional(),
  organizationId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
  includeHeatmap: z.boolean().default(false),
  includeJourney: z.boolean().default(false)
});

export type LeadPulseQuery = z.infer<typeof LeadPulseQuerySchema>;

export interface VisitorSession {
  id: string;
  visitorId: string;
  organizationId: string;
  startTime: string;
  endTime?: string;
  pageViews: number;
  duration: number;
  bounce: boolean;
  converted: boolean;
  geoLocation?: {
    country: string;
    city: string;
    region: string;
  };
  device?: {
    type: string;
    browser: string;
    os: string;
  };
  heatmapData?: any;
  journeySteps?: any[];
}

// ============================================================================
// External Services Types
// ============================================================================

export const SendMessageSchema = z.object({
  type: z.enum(['EMAIL', 'SMS', 'WHATSAPP']),
  to: z.string(),
  subject: z.string().optional(),
  content: z.string(),
  templateId: z.string().optional(),
  organizationId: z.string()
});

export type SendMessageRequest = z.infer<typeof SendMessageSchema>;

export interface MessageResult {
  id: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING';
  provider: string;
  cost: number;
  timestamp: string;
  error?: string;
}

// ============================================================================
// Monitoring Types
// ============================================================================

export const MonitoringQuerySchema = z.object({
  metric: z.enum(['users', 'campaigns', 'revenue', 'ai-performance', 'system-health']),
  organizationId: z.string().optional(),
  timeRange: z.enum(['1h', '1d', '7d', '30d']).default('1d'),
  aggregation: z.enum(['avg', 'sum', 'max', 'min', 'count']).default('avg')
});

export type MonitoringQuery = z.infer<typeof MonitoringQuerySchema>;

export interface MonitoringData {
  metric: string;
  value: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Error Types
// ============================================================================

export interface MCPError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export class MCPAuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MCPAuthenticationError';
  }
}

export class MCPAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MCPAuthorizationError';
  }
}

export class MCPRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MCPRateLimitError';
  }
}

export class MCPValidationError extends Error {
  public readonly details?: Array<{
    path: string;
    message: string;
    code: string;
  }>;

  constructor(message: string, details?: Array<{ path: string; message: string; code: string }>) {
    super(message);
    this.name = 'MCPValidationError';
    this.details = details;
  }
}

// ============================================================================
// Server Response Types
// ============================================================================

export interface MCPServerResponse<T = any> {
  success: boolean;
  data?: T;
  error?: MCPError;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

// ============================================================================
// Client Types
// ============================================================================

export interface MCPClientConfig {
  serverUrl: string;
  timeout: number;
  retries: number;
  authentication: {
    method: 'session' | 'api-key' | 'jwt';
    credentials: Record<string, string>;
  };
}

export interface MCPClientResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  fromFallback?: boolean;
}