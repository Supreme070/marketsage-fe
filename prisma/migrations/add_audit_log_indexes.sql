-- Add additional indexes for audit log performance
CREATE INDEX IF NOT EXISTS "LeadPulseAuditLog_userEmail_idx" ON "LeadPulseAuditLog"("userEmail");
CREATE INDEX IF NOT EXISTS "LeadPulseAuditLog_ipAddress_idx" ON "LeadPulseAuditLog"("ipAddress");
CREATE INDEX IF NOT EXISTS "LeadPulseAuditLog_timestamp_desc_idx" ON "LeadPulseAuditLog"("timestamp" DESC);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS "LeadPulseAuditLog_action_resource_timestamp_idx" 
ON "LeadPulseAuditLog"("action", "resource", "timestamp" DESC);

-- Index for user activity queries
CREATE INDEX IF NOT EXISTS "LeadPulseAuditLog_userId_action_timestamp_idx" 
ON "LeadPulseAuditLog"("userId", "action", "timestamp" DESC);