-- Enhanced Workflow Database Optimization
-- Replaces JSON workflow definitions with normalized tables

-- Create optimized workflow nodes table
CREATE TABLE workflow_nodes (
  id VARCHAR(255) PRIMARY KEY,
  workflow_id VARCHAR(255) NOT NULL,
  type ENUM('TRIGGER', 'ACTION', 'CONDITION', 'DELAY', 'EMAIL', 'SMS', 'WHATSAPP', 'WEBHOOK', 'NOTIFICATION') NOT NULL,
  label VARCHAR(255) NOT NULL,
  description TEXT,
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  config JSON,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_workflow_nodes_workflow_id (workflow_id),
  INDEX idx_workflow_nodes_type (type),
  INDEX idx_workflow_nodes_active (is_active),
  FOREIGN KEY (workflow_id) REFERENCES Workflow(id) ON DELETE CASCADE
);

-- Create optimized workflow connections table
CREATE TABLE workflow_connections (
  id VARCHAR(255) PRIMARY KEY,
  workflow_id VARCHAR(255) NOT NULL,
  source_node_id VARCHAR(255) NOT NULL,
  target_node_id VARCHAR(255) NOT NULL,
  source_handle VARCHAR(100),
  target_handle VARCHAR(100),
  condition_type ENUM('always', 'yes', 'no', 'custom') DEFAULT 'always',
  condition_value TEXT,
  label VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_workflow_connections_workflow_id (workflow_id),
  INDEX idx_workflow_connections_source (source_node_id),
  INDEX idx_workflow_connections_target (target_node_id),
  INDEX idx_workflow_connections_active (is_active),
  UNIQUE KEY unique_connection (source_node_id, target_node_id, source_handle),
  FOREIGN KEY (workflow_id) REFERENCES Workflow(id) ON DELETE CASCADE,
  FOREIGN KEY (source_node_id) REFERENCES workflow_nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (target_node_id) REFERENCES workflow_nodes(id) ON DELETE CASCADE
);

-- Create workflow triggers table for better trigger management
CREATE TABLE workflow_triggers (
  id VARCHAR(255) PRIMARY KEY,
  workflow_id VARCHAR(255) NOT NULL,
  node_id VARCHAR(255) NOT NULL,
  trigger_type ENUM('contact_created', 'contact_added_to_list', 'email_opened', 'email_clicked', 'form_submitted', 'webhook', 'schedule', 'api_call') NOT NULL,
  conditions JSON,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP NULL,
  trigger_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_workflow_triggers_workflow_id (workflow_id),
  INDEX idx_workflow_triggers_type (trigger_type),
  INDEX idx_workflow_triggers_active (is_active),
  INDEX idx_workflow_triggers_last_triggered (last_triggered_at),
  FOREIGN KEY (workflow_id) REFERENCES Workflow(id) ON DELETE CASCADE,
  FOREIGN KEY (node_id) REFERENCES workflow_nodes(id) ON DELETE CASCADE
);

-- Enhanced workflow execution table with better indexing
ALTER TABLE WorkflowExecution ADD COLUMN IF NOT EXISTS complexity_score FLOAT DEFAULT 0;
ALTER TABLE WorkflowExecution ADD COLUMN IF NOT EXISTS estimated_duration INT DEFAULT 0; -- in seconds
ALTER TABLE WorkflowExecution ADD COLUMN IF NOT EXISTS priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal';

-- Add composite indexes for better query performance
CREATE INDEX idx_workflow_execution_status_priority ON WorkflowExecution(status, priority, createdAt);
CREATE INDEX idx_workflow_execution_workflow_status ON WorkflowExecution(workflowId, status, createdAt);
CREATE INDEX idx_workflow_execution_contact_status ON WorkflowExecution(contactId, status, createdAt);

-- Enhanced workflow execution steps with better tracking
ALTER TABLE WorkflowExecutionStep ADD COLUMN IF NOT EXISTS node_type ENUM('TRIGGER', 'ACTION', 'CONDITION', 'DELAY') DEFAULT 'ACTION';
ALTER TABLE WorkflowExecutionStep ADD COLUMN IF NOT EXISTS execution_duration INT DEFAULT 0; -- in milliseconds
ALTER TABLE WorkflowExecutionStep ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0;
ALTER TABLE WorkflowExecutionStep ADD COLUMN IF NOT EXISTS error_category VARCHAR(100);

-- Add performance tracking indexes
CREATE INDEX idx_workflow_execution_step_performance ON WorkflowExecutionStep(node_type, status, execution_duration);
CREATE INDEX idx_workflow_execution_step_errors ON WorkflowExecutionStep(error_category, status, createdAt);

-- Create workflow analytics materialized view for performance
CREATE TABLE workflow_analytics_cache (
  id VARCHAR(255) PRIMARY KEY,
  workflow_id VARCHAR(255) NOT NULL,
  date_range ENUM('hour', 'day', 'week', 'month') NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  total_executions INT DEFAULT 0,
  completed_executions INT DEFAULT 0,
  failed_executions INT DEFAULT 0,
  avg_completion_time FLOAT DEFAULT 0,
  completion_rate FLOAT DEFAULT 0,
  error_rate FLOAT DEFAULT 0,
  most_common_error VARCHAR(255),
  performance_score FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_workflow_period (workflow_id, date_range, period_start),
  INDEX idx_workflow_analytics_workflow_id (workflow_id),
  INDEX idx_workflow_analytics_period (date_range, period_start),
  INDEX idx_workflow_analytics_performance (performance_score),
  FOREIGN KEY (workflow_id) REFERENCES Workflow(id) ON DELETE CASCADE
);

-- Create queue monitoring table for better queue management
CREATE TABLE workflow_queue_metrics (
  id VARCHAR(255) PRIMARY KEY,
  queue_name VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  waiting_jobs INT DEFAULT 0,
  active_jobs INT DEFAULT 0,
  completed_jobs INT DEFAULT 0,
  failed_jobs INT DEFAULT 0,
  processing_rate FLOAT DEFAULT 0, -- jobs per minute
  avg_processing_time FLOAT DEFAULT 0, -- milliseconds
  memory_usage_mb FLOAT DEFAULT 0,
  
  INDEX idx_queue_metrics_name_time (queue_name, timestamp),
  INDEX idx_queue_metrics_timestamp (timestamp)
);

-- Add workflow complexity calculation trigger
DELIMITER //
CREATE TRIGGER calculate_workflow_complexity
  BEFORE INSERT ON WorkflowExecution
  FOR EACH ROW
BEGIN
  DECLARE node_count INT;
  DECLARE connection_count INT;
  DECLARE trigger_count INT;
  DECLARE complexity FLOAT;
  
  SELECT COUNT(*) INTO node_count FROM workflow_nodes WHERE workflow_id = NEW.workflowId;
  SELECT COUNT(*) INTO connection_count FROM workflow_connections WHERE workflow_id = NEW.workflowId;
  SELECT COUNT(*) INTO trigger_count FROM workflow_triggers WHERE workflow_id = NEW.workflowId;
  
  SET complexity = (node_count * 1.0) + (connection_count * 0.5) + (trigger_count * 2.0);
  SET NEW.complexity_score = complexity;
  
  -- Estimate duration based on complexity
  SET NEW.estimated_duration = GREATEST(30, complexity * 10);
END//
DELIMITER ;

-- Performance optimization: Add workflow definition caching
CREATE TABLE workflow_definition_cache (
  workflow_id VARCHAR(255) PRIMARY KEY,
  definition_hash VARCHAR(64) NOT NULL,
  cached_definition JSON NOT NULL,
  node_count INT NOT NULL,
  connection_count INT NOT NULL,
  last_modified TIMESTAMP NOT NULL,
  cache_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cache_hit_count INT DEFAULT 0,
  
  INDEX idx_workflow_cache_hash (definition_hash),
  INDEX idx_workflow_cache_modified (last_modified),
  FOREIGN KEY (workflow_id) REFERENCES Workflow(id) ON DELETE CASCADE
);

-- Add workflow versioning for better change management
CREATE TABLE workflow_versions (
  id VARCHAR(255) PRIMARY KEY,
  workflow_id VARCHAR(255) NOT NULL,
  version_number INT NOT NULL,
  definition_snapshot JSON NOT NULL,
  change_description TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT false,
  
  UNIQUE KEY unique_workflow_version (workflow_id, version_number),
  INDEX idx_workflow_versions_workflow_id (workflow_id),
  INDEX idx_workflow_versions_active (is_active),
  FOREIGN KEY (workflow_id) REFERENCES Workflow(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES User(id) ON DELETE SET NULL
);

-- Optimize existing tables
ALTER TABLE Workflow ADD COLUMN IF NOT EXISTS last_optimization_at TIMESTAMP NULL;
ALTER TABLE Workflow ADD COLUMN IF NOT EXISTS performance_score FLOAT DEFAULT 0;
ALTER TABLE Workflow ADD COLUMN IF NOT EXISTS complexity_rating ENUM('simple', 'moderate', 'complex', 'advanced') DEFAULT 'simple';

-- Add indexes for better workflow management
CREATE INDEX idx_workflow_performance ON Workflow(performance_score, status);
CREATE INDEX idx_workflow_complexity ON Workflow(complexity_rating, status);
CREATE INDEX idx_workflow_optimization ON Workflow(last_optimization_at, status);