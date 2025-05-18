import { z } from 'zod';

// Schema for creating a new task
export const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'COMPLETED', 'CANCELLED']).default('TODO'),
  dueDate: z.string().optional(), // ISO string that will be converted to Date
  assigneeId: z.string().optional(),
  contactId: z.string().optional(),
  segmentId: z.string().optional(),
  campaignId: z.string().optional(),
  regionId: z.string().optional(),
  templateId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Schema for updating an existing task
export const taskUpdateSchema = z.object({
  title: z.string().min(1, 'Task title is required').optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'COMPLETED', 'CANCELLED']).optional(),
  dueDate: z.string().optional(), // ISO string that will be converted to Date
  assigneeId: z.string().optional(),
  contactId: z.string().optional(),
  segmentId: z.string().optional(),
  campaignId: z.string().optional(),
  regionId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Schema for task comment
export const taskCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
});

// Types derived from schemas
export type TaskFormValues = z.infer<typeof taskSchema>;
export type TaskUpdateValues = z.infer<typeof taskUpdateSchema>;
export type TaskCommentValues = z.infer<typeof taskCommentSchema>; 