-- LeadPulse Performance Optimization Indexes
-- Additional indexes for high-performance queries

-- ==================================================
-- VISITOR PERFORMANCE INDEXES
-- ==================================================

-- Composite index for visitor filtering and sorting
CREATE INDEX IF NOT EXISTS idx_leadpulse_visitor_user_status_score 
ON "LeadPulseVisitor" (user_id, status, score DESC, last_seen DESC);

-- Index for visitor search functionality
CREATE INDEX IF NOT EXISTS idx_leadpulse_visitor_search_email 
ON "LeadPulseVisitor" USING gin(to_tsvector('english', COALESCE(email, '')));

CREATE INDEX IF NOT EXISTS idx_leadpulse_visitor_search_company 
ON "LeadPulseVisitor" USING gin(to_tsvector('english', COALESCE(company, '')));

-- Index for acquisition source analysis
CREATE INDEX IF NOT EXISTS idx_leadpulse_visitor_acquisition_source 
ON "LeadPulseVisitor" (user_id, acquisition_source, first_seen DESC);

-- Index for visitor quality scoring
CREATE INDEX IF NOT EXISTS idx_leadpulse_visitor_quality_metrics 
ON "LeadPulseVisitor" (user_id, score DESC, email, company, status) 
WHERE status != 'anonymous';

-- ==================================================
-- TOUCHPOINT PERFORMANCE INDEXES
-- ==================================================

-- Core touchpoint analytics index
CREATE INDEX IF NOT EXISTS idx_leadpulse_touchpoint_analytics 
ON "LeadPulseTouchpoint" (user_id, timestamp DESC, action, visitor_id);

-- Index for funnel analysis
CREATE INDEX IF NOT EXISTS idx_leadpulse_touchpoint_funnel 
ON "LeadPulseTouchpoint" (user_id, action, timestamp DESC) 
WHERE action IN ('page_view', 'form_start', 'form_submit', 'conversion');

-- Index for visitor journey tracking
CREATE INDEX IF NOT EXISTS idx_leadpulse_touchpoint_visitor_journey 
ON "LeadPulseTouchpoint" (visitor_id, timestamp ASC, action, url);

-- Index for URL performance analysis
CREATE INDEX IF NOT EXISTS idx_leadpulse_touchpoint_url_performance 
ON "LeadPulseTouchpoint" (user_id, url, action, timestamp DESC);

-- Index for session duration calculations
CREATE INDEX IF NOT EXISTS idx_leadpulse_touchpoint_session_duration 
ON "LeadPulseTouchpoint" (visitor_id, timestamp, duration) 
WHERE duration IS NOT NULL;

-- ==================================================
-- FORM PERFORMANCE INDEXES
-- ==================================================

-- Form analytics optimization
CREATE INDEX IF NOT EXISTS idx_leadpulse_form_analytics_date_range 
ON "LeadPulseFormAnalytics" (form_id, date DESC, views, submissions);

-- Form submission performance
CREATE INDEX IF NOT EXISTS idx_leadpulse_form_submission_processing 
ON "LeadPulseFormSubmission" (form_id, submitted_at DESC, status, score DESC);

-- Form submission search
CREATE INDEX IF NOT EXISTS idx_leadpulse_form_submission_contact_lookup 
ON "LeadPulseFormSubmission" (contact_id, form_id, submitted_at DESC) 
WHERE contact_id IS NOT NULL;

-- Form field analytics
CREATE INDEX IF NOT EXISTS idx_leadpulse_form_field_performance 
ON "LeadPulseFormField" (form_id, "order", type, is_required);

-- ==================================================
-- CONVERSION TRACKING INDEXES
-- ==================================================

-- Conversion analytics by type and time
CREATE INDEX IF NOT EXISTS idx_leadpulse_conversion_analytics 
ON "LeadPulseConversion" (user_id, type, timestamp DESC, value);

-- Visitor conversion history
CREATE INDEX IF NOT EXISTS idx_leadpulse_conversion_visitor_history 
ON "LeadPulseConversion" (visitor_id, timestamp DESC, type, value);

-- Revenue tracking and attribution
CREATE INDEX IF NOT EXISTS idx_leadpulse_conversion_revenue_attribution 
ON "LeadPulseConversion" (user_id, timestamp DESC, value) 
WHERE value > 0;

-- ==================================================
-- CONTACT MANAGEMENT INDEXES
-- ==================================================

-- Contact search and filtering
CREATE INDEX IF NOT EXISTS idx_leadpulse_contact_search 
ON "LeadPulseContact" USING gin(to_tsvector('english', 
  COALESCE(name, '') || ' ' || 
  COALESCE(email, '') || ' ' || 
  COALESCE(company, '')
));

-- Contact scoring and segmentation
CREATE INDEX IF NOT EXISTS idx_leadpulse_contact_scoring 
ON "LeadPulseContact" (user_id, score DESC, status, last_activity DESC);

-- Contact source tracking
CREATE INDEX IF NOT EXISTS idx_leadpulse_contact_source_analysis 
ON "LeadPulseContact" (user_id, source, created_at DESC, status);

-- ==================================================
-- REAL-TIME PERFORMANCE INDEXES
-- ==================================================

-- Active visitor tracking
CREATE INDEX IF NOT EXISTS idx_leadpulse_visitor_active_tracking 
ON "LeadPulseVisitor" (user_id, last_seen DESC, status) 
WHERE last_seen >= (NOW() - INTERVAL '1 hour');

-- Recent touchpoint analysis
CREATE INDEX IF NOT EXISTS idx_leadpulse_touchpoint_recent 
ON "LeadPulseTouchpoint" (user_id, timestamp DESC) 
WHERE timestamp >= (NOW() - INTERVAL '24 hours');

-- Hot leads identification
CREATE INDEX IF NOT EXISTS idx_leadpulse_visitor_hot_leads 
ON "LeadPulseVisitor" (user_id, score DESC, last_seen DESC) 
WHERE score >= 100 AND last_seen >= (NOW() - INTERVAL '7 days');

-- ==================================================
-- PARTIAL INDEXES FOR COMMON FILTERS
-- ==================================================

-- Published forms only
CREATE INDEX IF NOT EXISTS idx_leadpulse_form_published 
ON "LeadPulseForm" (created_by, updated_at DESC) 
WHERE status = 'PUBLISHED';

-- Converted visitors only
CREATE INDEX IF NOT EXISTS idx_leadpulse_visitor_converted 
ON "LeadPulseVisitor" (user_id, last_seen DESC, score DESC) 
WHERE status = 'converted';

-- Failed form submissions
CREATE INDEX IF NOT EXISTS idx_leadpulse_form_submission_failed 
ON "LeadPulseFormSubmission" (form_id, submitted_at DESC) 
WHERE status = 'FAILED';

-- ==================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ==================================================

-- Visitor analytics with time range
CREATE INDEX IF NOT EXISTS idx_leadpulse_visitor_time_range_analytics 
ON "LeadPulseVisitor" (user_id, first_seen, last_seen, status, score DESC);

-- Form performance with conversion tracking
CREATE INDEX IF NOT EXISTS idx_leadpulse_form_conversion_performance 
ON "LeadPulseForm" (created_by, status, updated_at DESC) 
INCLUDE (name, conversion_goal);

-- Touchpoint session analysis
CREATE INDEX IF NOT EXISTS idx_leadpulse_touchpoint_session_analysis 
ON "LeadPulseTouchpoint" (visitor_id, timestamp, action) 
INCLUDE (url, duration, metadata);

-- ==================================================
-- EXPRESSION INDEXES FOR CALCULATED FIELDS
-- ==================================================

-- Visitor engagement score calculation
CREATE INDEX IF NOT EXISTS idx_leadpulse_visitor_engagement_score 
ON "LeadPulseVisitor" (user_id, 
  (CASE 
    WHEN email IS NOT NULL THEN 25 ELSE 0 
  END + 
  CASE 
    WHEN company IS NOT NULL THEN 15 ELSE 0 
  END + score) DESC
);

-- Form conversion rate calculation
CREATE INDEX IF NOT EXISTS idx_leadpulse_form_conversion_rate 
ON "LeadPulseFormAnalytics" (form_id, date DESC, 
  (CASE WHEN views > 0 THEN (submissions::float / views::float) * 100 ELSE 0 END) DESC
);

-- ==================================================
-- COVERING INDEXES FOR COMMON SELECT PATTERNS
-- ==================================================

-- Visitor list with essential fields
CREATE INDEX IF NOT EXISTS idx_leadpulse_visitor_list_covering 
ON "LeadPulseVisitor" (user_id, last_seen DESC) 
INCLUDE (id, email, company, status, score, first_seen);

-- Form analytics covering index
CREATE INDEX IF NOT EXISTS idx_leadpulse_form_analytics_covering 
ON "LeadPulseFormAnalytics" (form_id, date DESC) 
INCLUDE (views, submissions, conversion_rate, unique_visitors);

-- Touchpoint summary covering index
CREATE INDEX IF NOT EXISTS idx_leadpulse_touchpoint_summary_covering 
ON "LeadPulseTouchpoint" (user_id, timestamp DESC) 
INCLUDE (visitor_id, action, url, duration);

-- ==================================================
-- VACUUM AND ANALYZE OPTIMIZATION
-- ==================================================

-- Update table statistics after index creation
ANALYZE "LeadPulseVisitor";
ANALYZE "LeadPulseTouchpoint";
ANALYZE "LeadPulseForm";
ANALYZE "LeadPulseFormSubmission";
ANALYZE "LeadPulseFormAnalytics";
ANALYZE "LeadPulseConversion";
ANALYZE "LeadPulseContact";

-- ==================================================
-- INDEX USAGE MONITORING QUERIES
-- ==================================================

/*
-- Monitor index usage with this query:
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
  AND tablename LIKE 'LeadPulse%'
ORDER BY idx_scan DESC;

-- Check for unused indexes:
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
  AND tablename LIKE 'LeadPulse%'
  AND idx_scan < 10
ORDER BY pg_relation_size(indexrelid) DESC;

-- Monitor index effectiveness:
SELECT 
  schemaname,
  tablename,
  ROUND((seq_scan::float / (seq_scan + idx_scan) * 100), 2) as seq_scan_percent,
  seq_scan + idx_scan as total_scans,
  pg_size_pretty(pg_total_relation_size(relid)) as table_size
FROM pg_stat_user_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'LeadPulse%'
  AND (seq_scan + idx_scan) > 0
ORDER BY seq_scan_percent DESC;
*/