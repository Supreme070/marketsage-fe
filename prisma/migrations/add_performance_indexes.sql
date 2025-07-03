-- Performance optimization indexes for MarketSage
-- Add critical database indexes to improve query performance

-- High Priority Indexes

-- User model indexes
CREATE INDEX IF NOT EXISTS "User_organizationId_idx" ON "User"("organizationId");
CREATE INDEX IF NOT EXISTS "User_role_organizationId_idx" ON "User"("role", "organizationId");
CREATE INDEX IF NOT EXISTS "User_isActive_lastLogin_idx" ON "User"("isActive", "lastLogin");

-- Contact model indexes (CRITICAL)
CREATE INDEX IF NOT EXISTS "Contact_organizationId_status_idx" ON "Contact"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "Contact_organizationId_createdAt_idx" ON "Contact"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "Contact_createdById_idx" ON "Contact"("createdById");
CREATE INDEX IF NOT EXISTS "Contact_lastEngaged_idx" ON "Contact"("lastEngaged");

-- Email Campaign indexes
CREATE INDEX IF NOT EXISTS "EmailCampaign_organizationId_status_idx" ON "EmailCampaign"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "EmailCampaign_createdById_idx" ON "EmailCampaign"("createdById");
CREATE INDEX IF NOT EXISTS "EmailCampaign_scheduledFor_idx" ON "EmailCampaign"("scheduledFor");
CREATE INDEX IF NOT EXISTS "EmailCampaign_sentAt_idx" ON "EmailCampaign"("sentAt");

-- SMS Campaign indexes
CREATE INDEX IF NOT EXISTS "SMSCampaign_organizationId_status_idx" ON "SMSCampaign"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "SMSCampaign_createdById_idx" ON "SMSCampaign"("createdById");
CREATE INDEX IF NOT EXISTS "SMSCampaign_scheduledFor_idx" ON "SMSCampaign"("scheduledFor");

-- WhatsApp Campaign indexes
CREATE INDEX IF NOT EXISTS "WhatsAppCampaign_organizationId_status_idx" ON "WhatsAppCampaign"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "WhatsAppCampaign_createdById_idx" ON "WhatsAppCampaign"("createdById");
CREATE INDEX IF NOT EXISTS "WhatsAppCampaign_scheduledFor_idx" ON "WhatsAppCampaign"("scheduledFor");

-- Email Activity indexes (Performance Critical)
CREATE INDEX IF NOT EXISTS "EmailActivity_campaignId_type_idx" ON "EmailActivity"("campaignId", "type");
CREATE INDEX IF NOT EXISTS "EmailActivity_contactId_type_timestamp_idx" ON "EmailActivity"("contactId", "type", "timestamp");
CREATE INDEX IF NOT EXISTS "EmailActivity_timestamp_idx" ON "EmailActivity"("timestamp");

-- SMS Activity indexes
CREATE INDEX IF NOT EXISTS "SMSActivity_campaignId_type_idx" ON "SMSActivity"("campaignId", "type");
CREATE INDEX IF NOT EXISTS "SMSActivity_contactId_type_timestamp_idx" ON "SMSActivity"("contactId", "type", "timestamp");
CREATE INDEX IF NOT EXISTS "SMSActivity_timestamp_idx" ON "SMSActivity"("timestamp");

-- WhatsApp Activity indexes
CREATE INDEX IF NOT EXISTS "WhatsAppActivity_campaignId_type_idx" ON "WhatsAppActivity"("campaignId", "type");
CREATE INDEX IF NOT EXISTS "WhatsAppActivity_contactId_type_timestamp_idx" ON "WhatsAppActivity"("contactId", "type", "timestamp");
CREATE INDEX IF NOT EXISTS "WhatsAppActivity_timestamp_idx" ON "WhatsAppActivity"("timestamp");

-- Medium Priority Indexes

-- List and Segment indexes
CREATE INDEX IF NOT EXISTS "List_organizationId_type_idx" ON "List"("organizationId", "type");
CREATE INDEX IF NOT EXISTS "ListMember_contactId_idx" ON "ListMember"("contactId");
CREATE INDEX IF NOT EXISTS "SegmentMember_contactId_idx" ON "SegmentMember"("contactId");

-- Workflow indexes
CREATE INDEX IF NOT EXISTS "Workflow_createdById_status_idx" ON "Workflow"("createdById", "status");
CREATE INDEX IF NOT EXISTS "WorkflowExecution_workflowId_status_idx" ON "WorkflowExecution"("workflowId", "status");
CREATE INDEX IF NOT EXISTS "WorkflowExecution_contactId_status_idx" ON "WorkflowExecution"("contactId", "status");

-- AI Intelligence indexes
CREATE INDEX IF NOT EXISTS "AI_ChatHistory_userId_sessionId_idx" ON "AI_ChatHistory"("userId", "sessionId");
CREATE INDEX IF NOT EXISTS "AI_ChatHistory_createdAt_idx" ON "AI_ChatHistory"("createdAt");

-- Task Management indexes
CREATE INDEX IF NOT EXISTS "Task_organizationId_status_idx" ON "Task"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "Task_assigneeId_status_idx" ON "Task"("assigneeId", "status");
CREATE INDEX IF NOT EXISTS "Task_dueDate_idx" ON "Task"("dueDate");

-- Analytics and Performance indexes
CREATE INDEX IF NOT EXISTS "Analytics_createdAt_idx" ON "Analytics"("createdAt");
CREATE INDEX IF NOT EXISTS "ConversionTracking_occurredAt_idx" ON "ConversionTracking"("occurredAt");

-- LeadPulse indexes
CREATE INDEX IF NOT EXISTS "LeadPulseVisitor_engagementScore_idx" ON "LeadPulseVisitor"("engagementScore");
CREATE INDEX IF NOT EXISTS "LeadPulseTouchpoint_type_timestamp_idx" ON "LeadPulseTouchpoint"("type", "timestamp");

-- Form submission indexes
CREATE INDEX IF NOT EXISTS "LeadPulseFormSubmission_formId_status_idx" ON "LeadPulseFormSubmission"("formId", "status");
CREATE INDEX IF NOT EXISTS "LeadPulseFormSubmission_submittedAt_idx" ON "LeadPulseFormSubmission"("submittedAt");

-- Integration indexes
CREATE INDEX IF NOT EXISTS "Integration_organizationId_status_idx" ON "Integration"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "IntegrationSyncHistory_integrationId_status_idx" ON "IntegrationSyncHistory"("integrationId", "status");

-- Subscription and billing indexes
CREATE INDEX IF NOT EXISTS "Subscription_organizationId_status_idx" ON "Subscription"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "Transaction_organizationId_createdAt_idx" ON "Transaction"("organizationId", "createdAt");

-- Journey tracking indexes
CREATE INDEX IF NOT EXISTS "ContactJourney_contactId_status_idx" ON "ContactJourney"("contactId", "status");
CREATE INDEX IF NOT EXISTS "ContactJourney_startedAt_idx" ON "ContactJourney"("startedAt");

-- Notification indexes
CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");

-- UserPreference indexes
CREATE INDEX IF NOT EXISTS "UserPreference_userId_key_idx" ON "UserPreference"("userId", "key");

-- Audit trail indexes (Low Priority but Important)
CREATE INDEX IF NOT EXISTS "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_action_idx" ON "AuditLog"("userId", "action");

-- Performance monitoring
-- These indexes will help with monitoring and analytics queries
CREATE INDEX IF NOT EXISTS "ChurnPrediction_contactId_score_idx" ON "ChurnPrediction"("contactId", "score");
CREATE INDEX IF NOT EXISTS "LifetimeValuePrediction_contactId_predictedValue_idx" ON "LifetimeValuePrediction"("contactId", "predictedValue");

-- Multi-column indexes for complex queries
CREATE INDEX IF NOT EXISTS "Contact_org_status_engaged_idx" ON "Contact"("organizationId", "status", "lastEngaged");
CREATE INDEX IF NOT EXISTS "EmailCampaign_org_status_created_idx" ON "EmailCampaign"("organizationId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "Task_org_assignee_due_idx" ON "Task"("organizationId", "assigneeId", "dueDate");

-- Partial indexes for better performance on large tables
CREATE INDEX IF NOT EXISTS "Contact_active_lastEngaged_idx" ON "Contact"("lastEngaged") WHERE "status" = 'ACTIVE';
CREATE INDEX IF NOT EXISTS "EmailCampaign_sent_sentAt_idx" ON "EmailCampaign"("sentAt") WHERE "status" = 'SENT';
CREATE INDEX IF NOT EXISTS "Task_pending_dueDate_idx" ON "Task"("dueDate") WHERE "status" IN ('PENDING', 'IN_PROGRESS');