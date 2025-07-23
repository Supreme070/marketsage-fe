import { z } from 'zod';

// Settings API validation schemas
export const settingsUpdateSchema = z.object({
  type: z.enum(['update_settings', 'add_staff', 'update_staff', 'remove_staff', 'export_logs', 'clear_cache']),
  category: z.enum(['security', 'notifications', 'system', 'logging']).optional(),
  // Staff member fields
  email: z.string().email().optional(),
  name: z.string().min(2).max(100).optional(),
  role: z.enum(['ADMIN', 'SUPER_ADMIN', 'IT_ADMIN']).optional(),
  id: z.string().optional(),
  // Settings fields - will be validated based on category
}).refine((data) => {
  // Enhanced validation with specific error messages
  if (data.type === 'add_staff') {
    if (!data.email) throw new z.ZodError([{ code: 'custom', message: 'email is required for adding staff', path: ['email'] }]);
    if (!data.name) throw new z.ZodError([{ code: 'custom', message: 'name is required for adding staff', path: ['name'] }]);
  }
  if (data.type === 'update_staff' || data.type === 'remove_staff') {
    if (!data.id) throw new z.ZodError([{ code: 'custom', message: 'id is required for staff operations', path: ['id'] }]);
  }
  if (data.type === 'update_settings') {
    if (!data.category) throw new z.ZodError([{ code: 'custom', message: 'category is required for settings updates', path: ['category'] }]);
  }
  return true;
}).transform((data) => {
  // Sanitize and transform data
  if (data.email) {
    data.email = data.email.toLowerCase().trim();
  }
  if (data.name) {
    data.name = data.name.trim();
  }
  return data;
});

// Support API validation schemas
export const supportActionSchema = z.object({
  type: z.enum(['assign_ticket', 'update_status', 'add_note', 'create_ticket', 'delete_ticket']),
  ticketId: z.string().min(1),
  // Assignment fields
  assignedTo: z.string().optional(),
  assignedBy: z.string().optional(),
  // Status update fields
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  previousStatus: z.string().optional(),
  updateReason: z.string().optional(),
  // Note fields
  note: z.string().max(1000).optional(),
  isInternal: z.boolean().optional(),
  addedBy: z.string().optional(),
  // Ticket creation fields
  subject: z.string().min(5).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).optional(),
  category: z.enum(['technical', 'billing', 'feature_request', 'bug_report', 'general']).optional(),
});

// Incidents API validation schemas
export const incidentActionSchema = z.object({
  type: z.enum(['create_incident', 'update_incident', 'create_postmortem', 'delete_incident']),
  id: z.string().optional(),
  title: z.string().min(10).max(200).optional(),
  description: z.string().min(20).max(1000).optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  status: z.enum(['investigating', 'identified', 'monitoring', 'resolved']).optional(),
  affectedSystems: z.array(z.string()).optional(),
  assignedTo: z.string().optional(),
  // Update fields
  previousStatus: z.string().optional(),
  updateReason: z.string().optional(),
  // Post-mortem fields
  incidentId: z.string().optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});

// Campaign management validation (to be added to campaigns API)
export const campaignActionSchema = z.object({
  type: z.enum(['pause_campaign', 'resume_campaign', 'stop_campaign', 'delete_campaign', 'update_campaign']),
  campaignId: z.string().min(1),
  campaignType: z.enum(['email', 'sms', 'whatsapp']).optional(),
  // Update fields
  name: z.string().min(3).max(100).optional(),
  status: z.enum(['draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled']).optional(),
  // Settings
  scheduledAt: z.string().datetime().optional(),
  reason: z.string().max(500).optional(),
});

// Messages management validation
export const messageActionSchema = z.object({
  type: z.enum(['retry_message', 'cancel_message', 'bulk_retry', 'purge_queue']),
  messageId: z.string().optional(),
  queueName: z.string().optional(),
  // Bulk operations
  messageIds: z.array(z.string()).optional(),
  filterCriteria: z.object({
    status: z.enum(['pending', 'failed', 'completed']).optional(),
    provider: z.string().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }).optional(),
});

// Analytics configuration validation
export const analyticsActionSchema = z.object({
  type: z.enum(['update_config', 'export_data', 'create_report', 'delete_report']),
  configId: z.string().optional(),
  reportId: z.string().optional(),
  // Configuration fields
  dashboardConfig: z.object({
    refreshInterval: z.number().min(60).max(3600).optional(),
    defaultDateRange: z.enum(['7d', '30d', '90d', '1y']).optional(),
    visibleMetrics: z.array(z.string()).optional(),
  }).optional(),
  // Export fields
  format: z.enum(['json', 'csv', 'xlsx']).optional(),
  dateRange: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }).optional(),
  includeRawData: z.boolean().optional(),
});

// Generic admin query validation
export const adminQuerySchema = z.object({
  type: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  search: z.string().max(100).optional(),
  status: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Validation helper function
export function validateAdminRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('; ');
      return { success: false, error: `Validation failed: ${errorMessages}` };
    }
    return { success: false, error: 'Invalid request data' };
  }
}

// User ID extraction helper
export function getUserIdFromAuth(auth: any): string {
  if (auth.session?.user?.id) {
    return auth.session.user.id;
  }
  if (auth.session?.user?.email === 'supreme' || auth.session?.user?.email === 'supreme@marketsage.africa') {
    return 'supreme-admin';
  }
  return 'system-admin';
}

// Rate limiting configuration
export const adminRateLimits = {
  standard: { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
  strict: { requests: 20, windowMs: 15 * 60 * 1000 },   // 20 requests per 15 minutes for sensitive operations
  bulk: { requests: 5, windowMs: 5 * 60 * 1000 },       // 5 requests per 5 minutes for bulk operations
} as const;