/**
 * TypeScript interfaces for System Health API endpoints
 */

// Base interfaces
export interface SystemMetric {
  id: string;
  metricType: string;
  value: number;
  unit: string;
  source: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'degraded' | 'critical' | 'unknown';
  timestamp: Date;
  message?: string;
  error?: string;
  metadata?: Record<string, any>;
}

// System Metrics API Types
export interface SystemMetricsResponse {
  success: boolean;
  data: {
    metrics: SystemMetric[] | any[];
    healthStatus: HealthStatus;
    realTimeSnapshot?: RealTimeSystemSnapshot;
    metadata: {
      timeRange: string;
      aggregation: string;
      fromDate: Date;
      metricTypes: Array<{ type: string; count: number }>;
      sources: Array<{ source: string; count: number }>;
    };
  };
}

export interface RealTimeSystemSnapshot {
  timestamp: Date;
  hostname: string;
  uptime: number;
  system: {
    platform: string;
    arch: string;
    release: string;
    type: string;
  };
  cpu: {
    count: number;
    model: string;
    speed: number;
    loadAvg: {
      '1m': number;
      '5m': number;
      '15m': number;
    };
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  process: {
    pid: number;
    uptime: number;
    version: string;
    memory: NodeJS.MemoryUsage;
  };
  network: {
    interfaces: number;
    active: number;
  };
}

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  checks: Record<string, { threshold: number; status: string }>;
  issues: string[];
  lastUpdated: Date;
  totalMetrics: number;
}

// Services Health API Types
export interface ServicesHealthResponse {
  success: boolean;
  data: {
    overall: {
      status: 'healthy' | 'warning' | 'degraded' | 'critical';
      healthy: number;
      total: number;
      percentage: number;
      lastChecked: Date;
    };
    services: {
      database: DatabaseHealthCheck;
      redis: RedisHealthCheck;
      messageQueue: MessageQueueHealthCheck;
      email: EmailServicesHealthCheck;
      sms: SMSServicesHealthCheck;
      whatsapp: WhatsAppServiceHealthCheck;
      externalApis: ExternalAPIsHealthCheck;
    };
  };
}

export interface DatabaseHealthCheck extends HealthCheckResult {
  responseTime?: number;
  latency?: string;
  connections?: number;
  queries?: string;
  deepCheck?: {
    tables: Record<string, number>;
    queries: Record<string, string>;
  };
}

export interface RedisHealthCheck extends HealthCheckResult {
  responseTime?: number;
  latency?: string;
  memory?: string;
  keys?: string;
  deepCheck?: {
    keys: number;
    memory: string;
    connections: string;
  };
}

export interface MessageQueueHealthCheck extends HealthCheckResult {
  queues?: {
    total: number;
    active: number;
    inactive: number;
  };
  jobs?: {
    pending: number;
    failed: number;
  };
  errorRate?: number;
}

export interface EmailServicesHealthCheck extends HealthCheckResult {
  providers?: {
    total: number;
    active: number;
    default: string;
  };
  deepCheck?: {
    last24h: Record<string, number>;
    providers: Array<{
      id: string;
      name: string;
      provider: string;
      status: string;
      isDefault: boolean;
    }>;
  };
}

export interface SMSServicesHealthCheck extends HealthCheckResult {
  providers?: {
    total: number;
    active: number;
    default: string;
  };
}

export interface WhatsAppServiceHealthCheck extends HealthCheckResult {
  configured?: boolean;
  deepCheck?: {
    hasAccessToken: boolean;
    hasPhoneNumberId: boolean;
    hasBusinessAccountId: boolean;
  };
}

export interface ExternalAPIsHealthCheck extends HealthCheckResult {
  apis?: Record<string, {
    status: string;
    hasKey?: boolean;
    error?: string;
  }>;
  configured?: number;
  total?: number;
}

// Infrastructure Monitoring API Types
export interface InfrastructureMetricsResponse {
  success: boolean;
  data: {
    infrastructure: {
      server: ServerInformation;
      cpu: CPUInformation;
      memory: MemoryInformation;
      storage: StorageInformation;
      network: NetworkInformation;
      process: ProcessInformation;
      environment: EnvironmentInformation;
    };
    timestamp: Date;
    hostname: string;
    platform: string;
  };
}

export interface ServerInformation {
  hostname: string;
  platform: string;
  architecture: string;
  release: string;
  type: string;
  uptime: number;
  bootTime: Date;
  lastChecked: Date;
  detailed?: Record<string, any>;
}

export interface CPUInformation {
  count: number;
  model: string;
  speed: number;
  currentUsage: number;
  loadAverage: number[];
  lastChecked: Date;
  detailed?: {
    cores: Array<{
      core: number;
      model: string;
      speed: number;
      times: Record<string, number>;
    }>;
    architecture: string;
    endianness: string;
    temperature?: number;
  };
}

export interface MemoryInformation {
  total: number; // MB
  free: number; // MB
  used: number; // MB
  usagePercent: number;
  available: number; // MB
  lastChecked: Date;
  detailed?: {
    process: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers: number;
    };
    system: {
      totalGB: number;
      freeGB: number;
      usedGB: number;
    };
    swap?: {
      used: number;
    };
  };
}

export interface StorageInformation {
  lastChecked: Date;
  error?: string;
  root?: {
    filesystem: string;
    size: string;
    used: string;
    available: string;
    usagePercent: number;
    mountPoint: string;
  };
  detailed?: {
    filesystems: Array<{
      filesystem: string;
      size: string;
      used: string;
      available: string;
      usagePercent: number;
      mountPoint: string;
    }>;
    inodes?: {
      total: string;
      used: string;
      available: string;
      usagePercent: number;
    };
  };
}

export interface NetworkInformation {
  interfaces: Array<{
    name: string;
    family: string;
    address: string;
    netmask: string;
    mac: string;
    internal: boolean;
  }>;
  activeExternal: number;
  total: number;
  lastChecked: Date;
  detailed?: {
    statistics: Array<{
      interface: string;
      bytesReceived: number;
      packetsReceived: number;
      bytesTransmitted: number;
      packetsTransmitted: number;
    }>;
  };
}

export interface ProcessInformation {
  pid: number;
  ppid: number;
  uptime: number;
  version: string;
  platform: string;
  arch: string;
  nodeVersion: string;
  v8Version: string;
  lastChecked: Date;
  detailed?: {
    versions: Record<string, string>;
    features: Record<string, boolean>;
    resourceUsage: any;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    systemProcesses?: {
      count: number;
      sample: string[];
    };
  };
}

export interface EnvironmentInformation {
  nodeEnv: string;
  timezone: string;
  locale: string;
  lastChecked: Date;
  detailed?: {
    safeEnvVars: Record<string, string>;
    execPath: string;
    argv: string[];
    cwd: string;
  };
}

// Performance Analytics API Types
export interface PerformanceMetricsResponse {
  success: boolean;
  data: {
    timeRange: string;
    fromDate: Date;
    lastUpdated: Date;
    apiPerformance: APIPerformanceMetrics;
    databasePerformance: DatabasePerformanceMetrics;
    systemPerformance: SystemPerformanceMetrics;
    errorAnalytics: ErrorAnalytics;
    throughputMetrics: ThroughputMetrics;
    realTimeSnapshot: RealTimePerformanceSnapshot;
  };
}

export interface APIPerformanceMetrics {
  overall: {
    totalRequests: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
  };
  endpoints: Record<string, {
    count: number;
    avgTime: number;
    minTime: number;
    maxTime: number;
    errorRate: number;
    errors: number;
  }>;
  recentTrend: Array<{
    timestamp: Date;
    value: number;
  }>;
}

export interface DatabasePerformanceMetrics {
  connectionHealth: string;
  queryPerformance: {
    testQueryTime: number;
    simpleQueryResult: number;
    complexQueryResult: number;
  };
  connections: {
    average: number;
    current: string;
    maximum: string;
  };
  recentMetrics: SystemMetric[];
}

export interface SystemPerformanceMetrics {
  cpu: ResourceStats;
  memory: ResourceStats;
  systemLoad: ResourceStats;
  trends: {
    cpu: TrendData[];
    memory: TrendData[];
    load: TrendData[];
  };
}

export interface ResourceStats {
  avg: number;
  min: number;
  max: number;
  current: number;
}

export interface TrendData {
  timestamp: Date;
  value: number;
}

export interface ErrorAnalytics {
  totalErrors: number;
  securityEvents: number;
  errorsByType: Record<string, number>;
  errorsBySource: Record<string, number>;
  hourlyTrend: Record<string, number>;
  recentErrors: Array<{
    timestamp: Date;
    type: string;
    source: string;
    message: string;
  }>;
  criticalIssues: number;
}

export interface ThroughputMetrics {
  totalRequests: number;
  avgRequestsPerHour: number;
  maxRequestsPerHour: number;
  currentThroughput: number;
  hourlyBreakdown: Record<string, number>;
}

export interface RealTimePerformanceSnapshot {
  timestamp: Date;
  database: {
    responseTime: number;
    status: string;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };
  eventLoop: {
    lag: number;
    status: string;
  };
  process: {
    uptime: number;
    cpuUsage: NodeJS.CpuUsage;
  };
}

// Health Check API Types
export interface HealthCheckResponse {
  success: boolean;
  data: {
    timestamp: Date;
    scope: string;
    overall: 'healthy' | 'warning' | 'critical';
    checks: Record<string, HealthCheckCategory>;
    summary: {
      passed: number;
      failed: number;
      warnings: number;
      total: number;
    };
    recommendations: string[];
    criticalIssues: Array<{
      category: string;
      issue: string;
      severity: 'critical';
    }>;
  };
}

export interface HealthCheckCategory {
  category: string;
  status: 'healthy' | 'warning' | 'critical' | 'not_configured' | 'passed' | 'failed';
  timestamp: Date;
  tests?: Record<string, any>;
  services?: Record<string, any>;
  resources?: Record<string, any>;
  checks?: Record<string, any>;
  integrity?: Record<string, any>;
  configs?: Record<string, any>;
  error?: string;
  message?: string;
}

// System Logs API Types
export interface SystemLogsResponse {
  success: boolean;
  data: {
    entries: SystemLogEntry[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
    };
    filters: {
      logType: string;
      severity?: string;
      source?: string;
      timeRange: string;
      search?: string;
    };
    summary: {
      byLevel: Record<string, number>;
      bySource: Record<string, number>;
      timeRange: string;
      fromDate: Date;
    };
  };
}

export interface SystemLogEntry {
  id: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'info' | 'debug';
  message: string;
  source: string;
  type: 'system_metric' | 'security_event' | 'audit_log' | 'performance_metric';
  metadata?: Record<string, any>;
}

// Performance Monitor Types
export interface PerformanceMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ip?: string;
  error?: string;
}

export interface PerformanceStats {
  timeRange: string;
  totalRequests: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  endpoints: Record<string, EndpointStats>;
  slowEndpoints: Array<[string, EndpointStats]>;
}

export interface EndpointStats {
  count: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  errorRate: number;
  errors: number;
}

// API Response wrapper types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  details?: any;
}