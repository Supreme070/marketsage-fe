/**
 * LeadPulse Data Validation and Sanitization
 * 
 * Comprehensive input validation and sanitization for all LeadPulse tracking endpoints
 * to ensure data integrity and prevent malformed data from entering the system.
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';

// Base validation schemas
const UrlSchema = z.string().url().max(2048);
const PixelIdSchema = z.string().uuid();
const VisitorIdSchema = z.string().uuid();
const FormIdSchema = z.string().uuid();
const TimestampSchema = z.string().datetime();
const UserAgentSchema = z.string().max(1024);
const IpAddressSchema = z.string().ip();
const FingerprintSchema = z.string().max(256);

// Common field schemas
const CommonFieldSchemas = {
  pixelId: PixelIdSchema,
  visitorId: VisitorIdSchema,
  formId: FormIdSchema,
  timestamp: TimestampSchema,
  userAgent: UserAgentSchema,
  fingerprint: FingerprintSchema,
  url: UrlSchema,
  title: z.string().max(512).optional(),
  referrer: z.string().url().max(2048).optional(),
  
  // UTM parameters
  utm: z.object({
    utm_source: z.string().max(255).optional(),
    utm_medium: z.string().max(255).optional(),
    utm_campaign: z.string().max(255).optional(),
    utm_term: z.string().max(255).optional(),
    utm_content: z.string().max(255).optional(),
  }).optional(),
  
  // Device detection
  device: z.enum(['Mobile', 'Tablet', 'Desktop']).optional(),
  browser: z.string().max(100).optional(),
  os: z.string().max(100).optional(),
  
  // Engagement metrics
  scrollDepth: z.number().min(0).max(100).optional(),
  timeSpent: z.number().min(0).max(86400).optional(), // Max 24 hours
  value: z.number().min(0).max(10000).optional(),
};

// Event type validation
const EventTypeSchema = z.enum([
  'pageview',
  'click',
  'form_view',
  'form_start',
  'form_submit',
  'scroll_depth',
  'exit_intent',
  'time_spent',
  'conversion',
  'custom'
]);

// Click element validation
const ClickElementSchema = z.object({
  tagName: z.string().max(50).optional(),
  elementId: z.string().max(255).optional(),
  elementText: z.string().max(500).optional(),
  classes: z.string().max(1000).optional(),
  href: z.string().url().max(2048).optional(),
  x: z.number().min(0).max(10000).optional(),
  y: z.number().min(0).max(10000).optional(),
}).optional();

// Form data validation
const FormDataSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  email: z.string().email().max(320).optional(),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  message: z.string().max(5000).optional(),
  
  // Allow additional fields but validate their structure
}).catchall(z.union([
  z.string().max(1000),
  z.number(),
  z.boolean(),
  z.null()
]));

// Main tracking endpoint validation schema
export const TrackingEventSchema = z.object({
  pixelId: CommonFieldSchemas.pixelId,
  eventType: EventTypeSchema,
  fingerprint: CommonFieldSchemas.fingerprint.optional(),
  url: CommonFieldSchemas.url,
  title: CommonFieldSchemas.title,
  referrer: CommonFieldSchemas.referrer,
  userAgent: CommonFieldSchemas.userAgent.optional(),
  utm: CommonFieldSchemas.utm,
  
  // Event-specific fields
  element: ClickElementSchema,
  formId: CommonFieldSchemas.formId.optional(),
  fieldName: z.string().max(100).optional(),
  fieldType: z.string().max(50).optional(),
  depth: z.number().min(0).max(100).optional(),
  seconds: z.number().min(0).max(86400).optional(),
  event: z.string().max(255).optional(),
  value: CommonFieldSchemas.value,
  
  // Custom data (sanitized)
  customData: z.record(z.string().max(100), z.union([
    z.string().max(1000),
    z.number(),
    z.boolean(),
    z.null()
  ])).optional(),
});

// Form submission validation schema
export const FormSubmissionSchema = z.object({
  formId: CommonFieldSchemas.formId,
  pixelId: CommonFieldSchemas.pixelId.optional(),
  visitorId: CommonFieldSchemas.visitorId.optional(),
  formData: FormDataSchema,
  timestamp: CommonFieldSchemas.timestamp.optional(),
  url: CommonFieldSchemas.url.optional(),
  userAgent: CommonFieldSchemas.userAgent.optional(),
});

// Mobile tracking schemas
const MobileEventTypeSchema = z.enum([
  'screen_view',
  'button_tap',
  'interaction',
  'form_interaction',
  'conversion',
  'app_open',
  'app_background',
  'custom'
]);

const MobileDeviceDataSchema = z.object({
  platform: z.enum(['ios', 'android', 'web']),
  appId: z.string().max(255),
  appVersion: z.string().max(50),
  deviceModel: z.string().max(100),
  osVersion: z.string().max(50),
  locale: z.string().max(10).optional(),
  timezone: z.string().max(50).optional(),
  screenSize: z.string().max(20).optional(),
  pushToken: z.string().max(500).optional(),
  advertisingId: z.string().max(100).optional(),
});

export const MobileTrackingSchema = z.object({
  visitorId: CommonFieldSchemas.visitorId,
  deviceId: z.string().max(255),
  sessionId: z.string().max(255),
  appId: z.string().max(255),
  eventType: MobileEventTypeSchema,
  screenName: z.string().max(255).optional(),
  elementId: z.string().max(255).optional(),
  formId: CommonFieldSchemas.formId.optional(),
  eventName: z.string().max(255).optional(),
  properties: z.record(z.string().max(100), z.union([
    z.string().max(1000),
    z.number(),
    z.boolean(),
    z.null()
  ])).optional(),
  timestamp: CommonFieldSchemas.timestamp,
  coordinates: z.object({
    x: z.number().min(0).max(10000),
    y: z.number().min(0).max(10000)
  }).optional(),
  value: CommonFieldSchemas.value,
});

export const MobileIdentifySchema = z.object({
  deviceId: z.string().max(255),
  existingVisitorId: CommonFieldSchemas.visitorId.optional(),
  deviceData: MobileDeviceDataSchema,
  sessionId: z.string().max(255).optional(),
  appInstallTime: CommonFieldSchemas.timestamp.optional(),
  lastLaunchTime: CommonFieldSchemas.timestamp.optional(),
});

// Visitor lookup schema
export const VisitorLookupSchema = z.object({
  visitorId: CommonFieldSchemas.visitorId.optional(),
  fingerprint: CommonFieldSchemas.fingerprint.optional(),
  email: z.string().email().max(320).optional(),
  phone: z.string().max(50).optional(),
  includeJourney: z.boolean().optional(),
  includeTouchpoints: z.boolean().optional(),
  limit: z.number().min(1).max(1000).optional(),
  offset: z.number().min(0).optional(),
});

// Analytics query schema
export const AnalyticsQuerySchema = z.object({
  pixelId: CommonFieldSchemas.pixelId.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  eventType: EventTypeSchema.optional(),
  groupBy: z.enum(['hour', 'day', 'week', 'month']).optional(),
  includeDetails: z.boolean().optional(),
  limit: z.number().min(1).max(1000).optional(),
});

// Validation result interface
export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details: any;
    field?: string;
  };
}

/**
 * Validate and sanitize tracking event data
 */
export function validateTrackingEvent(data: any): ValidationResult {
  try {
    const validatedData = TrackingEventSchema.parse(data);
    
    // Additional sanitization
    const sanitizedData = {
      ...validatedData,
      title: sanitizeString(validatedData.title),
      referrer: sanitizeUrl(validatedData.referrer),
      url: sanitizeUrl(validatedData.url),
      userAgent: sanitizeString(validatedData.userAgent),
      event: sanitizeString(validatedData.event),
    };
    
    return {
      success: true,
      data: sanitizedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          message: 'Invalid tracking event data',
          details: error.errors,
          field: error.errors[0]?.path?.join('.'),
        },
      };
    }
    
    logger.error('Tracking event validation error', { error });
    return {
      success: false,
      error: {
        message: 'Validation failed',
        details: error.message,
      },
    };
  }
}

/**
 * Validate and sanitize form submission data
 */
export function validateFormSubmission(data: any): ValidationResult {
  try {
    const validatedData = FormSubmissionSchema.parse(data);
    
    // Additional sanitization for form data
    const sanitizedFormData = sanitizeFormData(validatedData.formData);
    
    const sanitizedData = {
      ...validatedData,
      formData: sanitizedFormData,
      url: sanitizeUrl(validatedData.url),
      userAgent: sanitizeString(validatedData.userAgent),
    };
    
    return {
      success: true,
      data: sanitizedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          message: 'Invalid form submission data',
          details: error.errors,
          field: error.errors[0]?.path?.join('.'),
        },
      };
    }
    
    logger.error('Form submission validation error', { error });
    return {
      success: false,
      error: {
        message: 'Validation failed',
        details: error.message,
      },
    };
  }
}

/**
 * Validate and sanitize mobile tracking data
 */
export function validateMobileTracking(data: any): ValidationResult {
  try {
    const validatedData = MobileTrackingSchema.parse(data);
    
    // Additional sanitization
    const sanitizedData = {
      ...validatedData,
      screenName: sanitizeString(validatedData.screenName),
      elementId: sanitizeString(validatedData.elementId),
      eventName: sanitizeString(validatedData.eventName),
      properties: sanitizeProperties(validatedData.properties),
    };
    
    return {
      success: true,
      data: sanitizedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          message: 'Invalid mobile tracking data',
          details: error.errors,
          field: error.errors[0]?.path?.join('.'),
        },
      };
    }
    
    logger.error('Mobile tracking validation error', { error });
    return {
      success: false,
      error: {
        message: 'Validation failed',
        details: error.message,
      },
    };
  }
}

/**
 * Validate and sanitize mobile identify data
 */
export function validateMobileIdentify(data: any): ValidationResult {
  try {
    const validatedData = MobileIdentifySchema.parse(data);
    
    // Additional sanitization
    const sanitizedData = {
      ...validatedData,
      deviceData: {
        ...validatedData.deviceData,
        deviceModel: sanitizeString(validatedData.deviceData.deviceModel),
        osVersion: sanitizeString(validatedData.deviceData.osVersion),
        locale: sanitizeString(validatedData.deviceData.locale),
        timezone: sanitizeString(validatedData.deviceData.timezone),
      },
    };
    
    return {
      success: true,
      data: sanitizedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          message: 'Invalid mobile identify data',
          details: error.errors,
          field: error.errors[0]?.path?.join('.'),
        },
      };
    }
    
    logger.error('Mobile identify validation error', { error });
    return {
      success: false,
      error: {
        message: 'Validation failed',
        details: error.message,
      },
    };
  }
}

/**
 * Validate visitor lookup parameters
 */
export function validateVisitorLookup(data: any): ValidationResult {
  try {
    const validatedData = VisitorLookupSchema.parse(data);
    
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          message: 'Invalid visitor lookup parameters',
          details: error.errors,
          field: error.errors[0]?.path?.join('.'),
        },
      };
    }
    
    logger.error('Visitor lookup validation error', { error });
    return {
      success: false,
      error: {
        message: 'Validation failed',
        details: error.message,
      },
    };
  }
}

/**
 * Validate analytics query parameters
 */
export function validateAnalyticsQuery(data: any): ValidationResult {
  try {
    const validatedData = AnalyticsQuerySchema.parse(data);
    
    // Additional date validation
    if (validatedData.startDate && validatedData.endDate) {
      const startDate = new Date(validatedData.startDate);
      const endDate = new Date(validatedData.endDate);
      
      if (startDate >= endDate) {
        return {
          success: false,
          error: {
            message: 'Start date must be before end date',
            details: { startDate: validatedData.startDate, endDate: validatedData.endDate },
          },
        };
      }
      
      // Limit date range to 1 year for performance
      const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
      if (endDate.getTime() - startDate.getTime() > maxRange) {
        return {
          success: false,
          error: {
            message: 'Date range cannot exceed 1 year',
            details: { startDate: validatedData.startDate, endDate: validatedData.endDate },
          },
        };
      }
    }
    
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          message: 'Invalid analytics query parameters',
          details: error.errors,
          field: error.errors[0]?.path?.join('.'),
        },
      };
    }
    
    logger.error('Analytics query validation error', { error });
    return {
      success: false,
      error: {
        message: 'Validation failed',
        details: error.message,
      },
    };
  }
}

// Sanitization helper functions

function sanitizeString(str: string | undefined): string | undefined {
  if (!str) return str;
  
  return str
    .trim()
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

function sanitizeUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  
  try {
    const urlObj = new URL(url);
    
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return undefined;
    }
    
    return urlObj.toString();
  } catch {
    return undefined;
  }
}

function sanitizeFormData(formData: any): any {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
      sanitized[key] = value;
    } else {
      // Skip complex objects
      continue;
    }
  }
  
  return sanitized;
}

function sanitizeProperties(properties: any): any {
  if (!properties) return properties;
  
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(properties)) {
    const sanitizedKey = sanitizeString(key);
    if (!sanitizedKey) continue;
    
    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeString(value);
    } else if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
      sanitized[sanitizedKey] = value;
    } else {
      // Skip complex objects
      continue;
    }
  }
  
  return sanitized;
}

/**
 * Middleware wrapper for request validation
 */
export function createValidationMiddleware<T>(
  validator: (data: any) => ValidationResult<T>
) {
  return async (request: Request): Promise<{
    success: boolean;
    data?: T;
    error?: {
      message: string;
      details: any;
      field?: string;
    };
  }> => {
    try {
      const body = await request.json();
      return validator(body);
    } catch (error) {
      logger.error('Request parsing error', { error });
      return {
        success: false,
        error: {
          message: 'Invalid JSON in request body',
          details: error.message,
        },
      };
    }
  };
}

/**
 * Validate IP address format
 */
export function validateIpAddress(ip: string): boolean {
  const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Validate timestamp format and range
 */
export function validateTimestamp(timestamp: string): boolean {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return false;
    }
    
    // Check if date is not too far in the past (1 year) or future (1 hour)
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    return date >= oneYearAgo && date <= oneHourFromNow;
  } catch {
    return false;
  }
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(validation: ValidationResult) {
  return {
    success: false,
    error: validation.error?.message || 'Validation failed',
    details: validation.error?.details,
    field: validation.error?.field,
  };
}