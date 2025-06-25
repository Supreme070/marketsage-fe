-- LeadPulse Database Performance Optimizations
-- 
-- This file contains all the indexes and optimizations needed
-- for production-ready LeadPulse performance

-- ===================================================================
-- LeadPulseVisitor Table Indexes
-- ===================================================================

-- Index for fingerprint lookups (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_leadpulse_visitor_fingerprint" 
ON "LeadPulseVisitor" ("fingerprint");

-- Index for active visitor queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_leadpulse_visitor_active" 
ON "LeadPulseVisitor" ("isActive", "lastVisit") 
WHERE "isActive" = true;

-- Index for visitor lookups by time range
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_leadpulse_visitor_lastvisit" 
ON "LeadPulseVisitor" ("lastVisit" DESC);

-- Index for visitor first visit queries (new visitor detection)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_leadpulse_visitor_firstvisit" 
ON "LeadPulseVisitor" ("firstVisit" DESC);

-- Index for geographic queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_leadpulse_visitor_geography" 
ON "LeadPulseVisitor" ("country", "city");

-- Index for engagement scoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_leadpulse_visitor_engagement" 
ON "LeadPulseVisitor" ("engagementScore" DESC, "lastVisit" DESC);

-- Composite index for analytics overview queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_leadpulse_visitor_analytics" 
ON "LeadPulseVisitor" ("lastVisit", "isActive", "engagementScore");

-- ===================================================================
-- LeadPulseTouchpoint Table Indexes
-- ===================================================================

-- Index for visitor touchpoint queries (most common)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_leadpulse_touchpoint_visitor" 
ON "LeadPulseTouchpoint" ("visitorId", "timestamp" DESC);

-- Index for recent activity queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_leadpulse_touchpoint_timestamp" 
ON "LeadPulseTouchpoint" ("timestamp" DESC);

-- Index for touchpoint type analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_leadpulse_touchpoint_type_time" 
ON "LeadPulseTouchpoint" ("type", "timestamp" DESC);

-- Index for conversion tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_leadpulse_touchpoint_conversions" 
ON "LeadPulseTouchpoint" ("type", "timestamp", "visitorId") 
WHERE "type" = 'CONVERSION';

-- Index for URL-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_leadpulse_touchpoint_url" 
ON "LeadPulseTouchpoint" ("url", "timestamp" DESC);

-- Composite index for engagement calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_leadpulse_touchpoint_engagement" 
ON "LeadPulseTouchpoint" ("visitorId", "score", "timestamp" DESC);

-- ===================================================================
-- LeadPulseSegment Table Indexes
-- ===================================================================

-- Index for segment name lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_leadpulse_segment_name" 
ON "LeadPulseSegment" ("name");

-- Index for segment created time
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_leadpulse_segment_created" 
ON "LeadPulseSegment" ("createdAt" DESC);

-- ===================================================================
-- LeadPulseInsight Table Indexes
-- ===================================================================

-- Index for insight type and importance
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_leadpulse_insight_type_importance" 
ON "LeadPulseInsight" ("type", "importance", "createdAt" DESC);

-- Index for recent insights
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_leadpulse_insight_created" 
ON "LeadPulseInsight" ("createdAt" DESC);

-- ===================================================================
-- Performance Optimization Views
-- ===================================================================

-- View for active visitor analytics (frequently queried)
CREATE OR REPLACE VIEW "LeadPulseActiveVisitorStats" AS
SELECT 
    COUNT(*) as active_count,
    AVG("engagementScore") as avg_engagement,
    COUNT(DISTINCT "country") as countries,
    MAX("lastVisit") as last_activity
FROM "LeadPulseVisitor" 
WHERE "isActive" = true;

-- View for daily visitor statistics
CREATE OR REPLACE VIEW "LeadPulseDailyStats" AS
SELECT 
    DATE("firstVisit") as visit_date,
    COUNT(*) as new_visitors,
    COUNT(DISTINCT "country") as countries,
    AVG("engagementScore") as avg_engagement
FROM "LeadPulseVisitor" 
WHERE "firstVisit" >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE("firstVisit")
ORDER BY visit_date DESC;

-- View for conversion funnel
CREATE OR REPLACE VIEW "LeadPulseConversionFunnel" AS
SELECT 
    tp.type,
    COUNT(*) as touchpoint_count,
    COUNT(DISTINCT tp."visitorId") as unique_visitors,
    DATE(tp.timestamp) as activity_date
FROM "LeadPulseTouchpoint" tp
WHERE tp.timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY tp.type, DATE(tp.timestamp)
ORDER BY activity_date DESC, touchpoint_count DESC;

-- ===================================================================
-- Maintenance Functions
-- ===================================================================

-- Function to analyze table statistics for query optimization
CREATE OR REPLACE FUNCTION analyze_leadpulse_tables()
RETURNS void AS $$
BEGIN
    ANALYZE "LeadPulseVisitor";
    ANALYZE "LeadPulseTouchpoint";
    ANALYZE "LeadPulseSegment";
    ANALYZE "LeadPulseInsight";
    
    RAISE NOTICE 'LeadPulse table statistics updated';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old touchpoints (data retention)
CREATE OR REPLACE FUNCTION cleanup_old_leadpulse_data(retention_days integer DEFAULT 90)
RETURNS integer AS $$
DECLARE
    deleted_count integer;
BEGIN
    -- Delete touchpoints older than retention period
    DELETE FROM "LeadPulseTouchpoint" 
    WHERE timestamp < CURRENT_DATE - (retention_days || ' days')::interval;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up visitors with no recent activity
    DELETE FROM "LeadPulseVisitor" 
    WHERE "lastVisit" < CURRENT_DATE - (retention_days || ' days')::interval
    AND NOT EXISTS (
        SELECT 1 FROM "LeadPulseTouchpoint" 
        WHERE "visitorId" = "LeadPulseVisitor".id
    );
    
    RAISE NOTICE 'Cleaned up % old touchpoints', deleted_count;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to recompute engagement scores efficiently
CREATE OR REPLACE FUNCTION recompute_engagement_scores()
RETURNS void AS $$
BEGIN
    UPDATE "LeadPulseVisitor" 
    SET "engagementScore" = COALESCE(recent_scores.score, 0)
    FROM (
        SELECT 
            tp."visitorId",
            LEAST(100, ROUND(SUM(
                COALESCE(tp.score, 1) * 
                GREATEST(0.1, 1 - EXTRACT(EPOCH FROM (NOW() - tp.timestamp)) / (24 * 3600))
            ))) as score
        FROM "LeadPulseTouchpoint" tp
        WHERE tp.timestamp >= NOW() - INTERVAL '24 hours'
        GROUP BY tp."visitorId"
    ) as recent_scores
    WHERE "LeadPulseVisitor".id = recent_scores."visitorId";
    
    RAISE NOTICE 'Engagement scores recomputed';
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- Performance Monitoring Queries
-- ===================================================================

-- Query to check index usage
-- Run this periodically to ensure indexes are being used effectively
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_tup_read::float / NULLIF(idx_tup_fetch, 0) as selectivity
FROM pg_stat_user_indexes 
WHERE tablename LIKE 'LeadPulse%'
ORDER BY idx_tup_read DESC;
*/

-- Query to check table sizes and growth
/*
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE tablename LIKE 'LeadPulse%'
ORDER BY size_bytes DESC;
*/

-- Query to identify slow queries
/*
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE query ILIKE '%LeadPulse%'
ORDER BY mean_time DESC
LIMIT 10;
*/