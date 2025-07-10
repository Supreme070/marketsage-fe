/**
 * Comprehensive Input Validation System
 * ====================================
 * Centralizes all input validation with security-first approach
 * Prevents SQL injection, XSS, and other injection attacks
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { logger } from '@/lib/logger';

// Base validation schemas
const baseSchemas = {
  // Email validation with strict format
  email: z.string()
    .email('Invalid email format')
    .max(254, 'Email too long')
    .refine(email => !email.includes('<script'), 'Invalid email format')
    .refine(email => !email.includes('javascript:'), 'Invalid email format'),
  
  // Safe string validation (without default max to allow chaining)
  safeString: z.string()
    .refine(str => !/<script|javascript:|data:|vbscript:|onload=/i.test(str), 'Invalid content detected'),
    
  // Safe string with max length helper
  safeStringWithMax: (maxLength: number, message?: string) => z.string()
    .max(maxLength, message || `String too long (max ${maxLength})`)
    .refine(str => !/<script|javascript:|data:|vbscript:|onload=/i.test(str), 'Invalid content detected'),
  
  // ID validation (UUID or CUID)
  id: z.string()
    .min(1, 'ID required')
    .max(50, 'ID too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid ID format'),
  
  // Name validation
  name: z.string()
    .min(1, 'Name required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z0-9\s\-'.,]+$/, 'Invalid name format'),
  
  // Phone validation (international format)
  phone: z.string()
    .regex(/^\+?[\d\s\-()]{7,20}$/, 'Invalid phone format')
    .optional(),
  
  // URL validation
  url: z.string()
    .url('Invalid URL format')
    .max(2000, 'URL too long')
    .refine(url => !url.includes('javascript:'), 'Invalid URL protocol')
    .optional(),
  
  // Password validation
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number, and special character'),
  
  // Role validation
  role: z.enum(['USER', 'ADMIN', 'IT_ADMIN', 'SUPER_ADMIN'], {
    errorMap: () => ({ message: 'Invalid role' })
  }),
  
  // Pagination validation
  pagination: z.object({
    page: z.coerce.number().min(1, 'Page must be at least 1').max(1000, 'Page too high').default(1),
    limit: z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit too high').default(10),
    sortBy: z.string().max(50, 'Sort field too long').optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
  }),
  
  // Search validation
  search: z.string()
    .max(200, 'Search term too long')
    .refine(str => !/<script|javascript:|data:|vbscript:|onload=/i.test(str), 'Invalid search term')
    .optional()
};

// Entity-specific validation schemas
export const validationSchemas = {
  // User validation
  user: {
    create: z.object({
      name: baseSchemas.name,
      email: baseSchemas.email,
      password: baseSchemas.password,
      role: baseSchemas.role.default('USER'),
      organizationId: baseSchemas.id.optional(),
      company: baseSchemas.safeStringWithMax(100, 'Company name too long').optional()
    }),
    update: z.object({
      id: baseSchemas.id,
      name: baseSchemas.name.optional(),
      email: baseSchemas.email.optional(),
      role: baseSchemas.role.optional(),
      isActive: z.boolean().optional(),
      company: baseSchemas.safeStringWithMax(100, 'Company name too long').optional()
    }),
    delete: z.object({
      id: baseSchemas.id
    })
  },
  
  // Organization validation
  organization: {
    create: z.object({
      name: baseSchemas.name,
      plan: z.enum(['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE']).default('FREE'),
      websiteUrl: baseSchemas.url,
      address: baseSchemas.safeStringWithMax(500, 'Address too long').optional(),
      billingEmail: baseSchemas.email.optional(),
      billingName: baseSchemas.name.optional(),
      billingAddress: baseSchemas.safeStringWithMax(500, 'Billing address too long').optional(),
      vatNumber: baseSchemas.safeStringWithMax(50, 'VAT number too long').optional()
    }),
    update: z.object({
      id: baseSchemas.id,
      name: baseSchemas.name.optional(),
      plan: z.enum(['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
      websiteUrl: baseSchemas.url,
      address: baseSchemas.safeStringWithMax(500, 'Address too long').optional(),
      billingEmail: baseSchemas.email.optional(),
      billingName: baseSchemas.name.optional(),
      billingAddress: baseSchemas.safeStringWithMax(500, 'Billing address too long').optional(),
      vatNumber: baseSchemas.safeStringWithMax(50, 'VAT number too long').optional()
    })
  },
  
  // Contact validation
  contact: {
    create: z.object({
      firstName: baseSchemas.name,
      lastName: baseSchemas.name,
      email: baseSchemas.email,
      phone: baseSchemas.phone,
      company: baseSchemas.safeStringWithMax(100, 'Company name too long').optional(),
      jobTitle: baseSchemas.safeStringWithMax(100, 'Job title too long').optional(),
      tags: z.array(baseSchemas.safeStringWithMax(50, 'Tag too long')).max(10, 'Too many tags').optional(),
      customFields: z.record(z.string().max(50, 'Field name too long'), z.any()).optional()
    }),
    update: z.object({
      id: baseSchemas.id,
      firstName: baseSchemas.name.optional(),
      lastName: baseSchemas.name.optional(),
      email: baseSchemas.email.optional(),
      phone: baseSchemas.phone,
      company: baseSchemas.safeStringWithMax(100, 'Company name too long').optional(),
      jobTitle: baseSchemas.safeStringWithMax(100, 'Job title too long').optional(),
      tags: z.array(baseSchemas.safeStringWithMax(50, 'Tag too long')).max(10, 'Too many tags').optional(),
      customFields: z.record(z.string().max(50, 'Field name too long'), z.any()).optional(),
      isActive: z.boolean().optional()
    }),
    bulkUpdate: z.object({
      contactIds: z.array(baseSchemas.id).min(1, 'At least one contact required').max(1000, 'Too many contacts'),
      updates: z.object({
        tags: z.array(baseSchemas.safeStringWithMax(50, 'Tag too long')).max(10, 'Too many tags').optional(),
        customFields: z.record(z.string().max(50, 'Field name too long'), z.any()).optional(),
        isActive: z.boolean().optional()
      })
    })
  },
  
  // Campaign validation
  campaign: {
    create: z.object({
      name: baseSchemas.name,
      subject: baseSchemas.safeStringWithMax(200, 'Subject too long'),
      content: baseSchemas.safeStringWithMax(50000, 'Content too long'),
      type: z.enum(['EMAIL', 'SMS', 'WHATSAPP']),
      audienceType: z.enum(['ALL', 'SEGMENT', 'LIST', 'CUSTOM']),
      audienceIds: z.array(baseSchemas.id).optional(),
      scheduledAt: z.coerce.date().optional(),
      fromName: baseSchemas.name.optional(),
      fromEmail: baseSchemas.email.optional()
    }),
    update: z.object({
      id: baseSchemas.id,
      name: baseSchemas.name.optional(),
      subject: baseSchemas.safeStringWithMax(200, 'Subject too long').optional(),
      content: baseSchemas.safeStringWithMax(50000, 'Content too long').optional(),
      status: z.enum(['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'PAUSED', 'CANCELLED']).optional(),
      scheduledAt: z.coerce.date().optional(),
      fromName: baseSchemas.name.optional(),
      fromEmail: baseSchemas.email.optional()
    })
  },
  
  // Task validation
  task: {
    create: z.object({
      title: baseSchemas.safeStringWithMax(200, 'Title too long'),
      description: baseSchemas.safeStringWithMax(5000, 'Description too long').optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
      dueDate: z.coerce.date().optional(),
      assigneeId: baseSchemas.id.optional(),
      categoryId: baseSchemas.id.optional(),
      tags: z.array(baseSchemas.safeStringWithMax(50, 'Tag too long')).max(10, 'Too many tags').optional()
    }),
    update: z.object({
      id: baseSchemas.id,
      title: baseSchemas.safeStringWithMax(200, 'Title too long').optional(),
      description: baseSchemas.safeStringWithMax(5000, 'Description too long').optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
      status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
      dueDate: z.coerce.date().optional(),
      assigneeId: baseSchemas.id.optional(),
      categoryId: baseSchemas.id.optional(),
      tags: z.array(baseSchemas.safeStringWithMax(50, 'Tag too long')).max(10, 'Too many tags').optional()
    })
  },
  
  // AI Command validation
  aiCommand: {
    execute: z.object({
      command: baseSchemas.safeStringWithMax(2000, 'Command too long'),
      context: z.object({
        businessContext: z.object({
          industry: baseSchemas.safeStringWithMax(100, 'Industry too long').optional(),
          market: baseSchemas.safeStringWithMax(100, 'Market too long').optional(),
          organizationSize: baseSchemas.safeStringWithMax(50, 'Organization size too long').optional(),
          currentGoals: z.array(baseSchemas.safeStringWithMax(200, 'Goal too long')).max(10, 'Too many goals').optional()
        }).optional(),
        userPreferences: z.object({
          communicationStyle: z.enum(['FORMAL', 'CASUAL', 'PROFESSIONAL']).optional(),
          riskTolerance: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
          automationLevel: z.enum(['MANUAL', 'ASSISTED', 'AUTOMATIC']).optional()
        }).optional()
      }).optional(),
      enableTaskExecution: z.boolean().default(false),
      dryRun: z.boolean().default(false)
    })
  },
  
  // Common validation
  common: {
    pagination: baseSchemas.pagination,
    search: baseSchemas.search,
    id: baseSchemas.id,
    ids: z.array(baseSchemas.id).min(1, 'At least one ID required').max(100, 'Too many IDs')
  }
};

// Security validation functions
export class SecurityValidator {
  /**
   * Sanitize HTML content to prevent XSS
   */
  static sanitizeHtml(content: string): string {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
      ALLOWED_ATTR: ['href', 'target'],
      ALLOW_DATA_ATTR: false
    });
  }
  
  /**
   * Validate and sanitize user input
   */
  static validateInput<T>(schema: z.ZodSchema<T>, data: unknown, context?: string): {
    success: boolean;
    data?: T;
    errors?: string[];
  } {
    try {
      const result = schema.safeParse(data);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        );
        
        logger.warn('Input validation failed', {
          context,
          errors,
          inputType: typeof data
        });
        
        return {
          success: false,
          errors
        };
      }
      
      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      logger.error('Input validation error', {
        context,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        success: false,
        errors: ['Validation failed']
      };
    }
  }
  
  /**
   * Check for SQL injection patterns
   */
  static checkSqlInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /['";].*(-{2}|\/\*)/i,
      /\b(xp_|sp_|exec|execute)\b/i
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }
  
  /**
   * Validate file upload security
   */
  static validateFileUpload(file: {
    name: string;
    size: number;
    type: string;
  }): {
    valid: boolean;
    error?: string;
  } {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not allowed'
      };
    }
    
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size too large'
      };
    }
    
    // Check for double extensions
    const nameParts = file.name.split('.');
    if (nameParts.length > 2) {
      return {
        valid: false,
        error: 'Invalid file name format'
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Rate limiting validation
   */
  static validateRateLimit(identifier: string, action: string, limit = 100): {
    allowed: boolean;
    resetTime?: number;
  } {
    // This would integrate with a rate limiting service
    // For now, returning allowed=true as placeholder
    return { allowed: true };
  }
}

// Export validation helper
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
) {
  return SecurityValidator.validateInput(schema, data, context);
}

// Export commonly used schemas
export const commonSchemas = baseSchemas;