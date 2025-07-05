/**
 * Intelligent Reporting Engine
 * ============================
 * AI-powered reporting system that understands natural language requests
 * and generates comprehensive reports with PDF/Excel exports
 */

import { logger } from '@/lib/logger';
import { 
  EnterpriseExportManager, 
  type ExportRequest, 
  type ExportColumn, 
  type ExportJob 
} from '@/lib/export/enterprise-export';
import { intelligentIntentAnalyzer } from './intelligent-intent-analyzer';
import { AuthorizationService, Permission } from '@/lib/security/authorization';

export interface ReportRequest {
  query: string;
  userId: string;
  userRole: string;
  organizationId: string;
  options?: {
    format?: 'CSV' | 'Excel' | 'PDF' | 'JSON';
    includeCharts?: boolean;
    schedule?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      recipients: string[];
    };
  };
}

export interface ReportResult {
  success: boolean;
  message: string;
  reportId?: string;
  downloadUrl?: string;
  estimatedRows?: number;
  format?: string;
  error?: string;
  suggestions?: string[];
}

export interface IntelligentReportDefinition {
  title: string;
  dataSource: string;
  columns: ExportColumn[];
  filters: Record<string, any>;
  format: 'CSV' | 'Excel' | 'PDF' | 'JSON';
  purpose: string;
  includeCharts: boolean;
  chartTypes?: string[];
}

class IntelligentReportingEngine {
  private exportManager: EnterpriseExportManager;

  constructor() {
    this.exportManager = EnterpriseExportManager.getInstance();
  }

  /**
   * Generate report from natural language query
   */
  async generateReport(request: ReportRequest): Promise<ReportResult> {
    try {
      logger.info('AI report generation requested', {
        query: request.query.substring(0, 100),
        userId: request.userId,
        organizationId: request.organizationId
      });

      // Analyze user intent to understand what report they want
      const intent = await intelligentIntentAnalyzer.analyzeIntent(request.query);
      
      if (intent.confidence < 0.7) {
        return {
          success: false,
          message: 'I need more specific information to generate your report.',
          suggestions: this.getReportSuggestions(request.query)
        };
      }

      // Convert natural language to report definition
      const reportDef = await this.parseReportQuery(request.query, intent, request);
      
      if (!reportDef) {
        return {
          success: false,
          message: 'I couldn\'t understand what type of report you want to generate.',
          suggestions: this.getReportSuggestions(request.query)
        };
      }

      // Validate permissions
      const hasPermission = await this.validateReportPermissions(reportDef, request);
      if (!hasPermission.allowed) {
        return {
          success: false,
          message: hasPermission.reason || 'Insufficient permissions to generate this report.',
          error: 'permission_denied'
        };
      }

      // Create export request
      const exportRequest: ExportRequest = {
        dataSource: reportDef.dataSource,
        columns: reportDef.columns,
        filters: { ...reportDef.filters, organizationId: request.organizationId },
        options: {
          format: reportDef.format,
          filename: this.generateReportFilename(reportDef.title, reportDef.format),
          includeHeaders: true,
          includeMetadata: true,
          includeTimestamp: true,
          compliance: {
            includeAuditTrail: true,
            redactSensitiveData: true,
            encryptionLevel: 'standard'
          }
        },
        requestedBy: {
          userId: request.userId,
          userName: 'AI User', // Will be populated from user lookup
          role: request.userRole,
          tenantId: request.organizationId
        },
        purpose: `AI-generated report: ${reportDef.purpose}`,
        estimatedRows: await this.estimateReportSize(reportDef)
      };

      // Generate the report
      const exportJob = await this.exportManager.createExportJob(exportRequest);

      // Schedule if requested
      if (request.options?.schedule) {
        await this.scheduleReport(exportJob, request.options.schedule);
      }

      return {
        success: true,
        message: `📊 Report "${reportDef.title}" is being generated! You'll receive it in ${reportDef.format} format.`,
        reportId: exportJob.id,
        estimatedRows: exportRequest.estimatedRows,
        format: reportDef.format
      };

    } catch (error) {
      logger.error('AI report generation failed', {
        error: error instanceof Error ? error.message : String(error),
        query: request.query,
        userId: request.userId
      });

      return {
        success: false,
        message: 'I encountered an error while generating your report. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestions: [
          'Try rephrasing your request',
          'Be more specific about the data you want',
          'Check if you have permission to access this data'
        ]
      };
    }
  }

  /**
   * Parse natural language query into report definition
   */
  private async parseReportQuery(
    query: string, 
    intent: any, 
    request: ReportRequest
  ): Promise<IntelligentReportDefinition | null> {
    const lowerQuery = query.toLowerCase();
    
    // Determine data source
    const dataSource = this.detectDataSource(lowerQuery);
    if (!dataSource) return null;

    // Determine report format
    const format = this.detectReportFormat(lowerQuery, request.options?.format);
    
    // Generate appropriate columns based on data source and query
    const columns = this.generateReportColumns(dataSource, lowerQuery);
    
    // Extract filters from query
    const filters = this.extractFilters(lowerQuery, intent);
    
    // Generate report title
    const title = this.generateReportTitle(dataSource, lowerQuery);
    
    // Determine purpose
    const purpose = this.extractReportPurpose(lowerQuery, intent);

    // Check if charts are requested
    const includeCharts = this.shouldIncludeCharts(lowerQuery, format);

    return {
      title,
      dataSource,
      columns,
      filters,
      format,
      purpose,
      includeCharts,
      chartTypes: includeCharts ? this.suggestChartTypes(dataSource, columns) : undefined
    };
  }

  /**
   * Detect data source from natural language
   */
  private detectDataSource(query: string): string | null {
    const dataSources = {
      'contacts': ['contact', 'customer', 'lead', 'subscriber', 'user', 'people'],
      'campaigns': ['campaign', 'email', 'sms', 'whatsapp', 'marketing', 'newsletter'],
      'analytics': ['analytics', 'metrics', 'performance', 'stats', 'data', 'tracking'],
      'workflows': ['workflow', 'automation', 'process', 'journey', 'funnel'],
      'transactions': ['transaction', 'payment', 'revenue', 'money', 'financial', 'billing']
    };

    for (const [source, keywords] of Object.entries(dataSources)) {
      if (keywords.some(keyword => query.includes(keyword))) {
        return source;
      }
    }

    return null;
  }

  /**
   * Detect desired report format
   */
  private detectReportFormat(query: string, defaultFormat?: string): 'CSV' | 'Excel' | 'PDF' | 'JSON' {
    if (query.includes('pdf')) return 'PDF';
    if (query.includes('excel') || query.includes('xlsx') || query.includes('spreadsheet')) return 'Excel';
    if (query.includes('csv')) return 'CSV';
    if (query.includes('json')) return 'JSON';
    
    return defaultFormat as any || 'Excel'; // Default to Excel for business reports
  }

  /**
   * Generate appropriate columns for the report
   */
  private generateReportColumns(dataSource: string, query: string): ExportColumn[] {
    const columnSets = {
      contacts: [
        { key: 'firstName', label: 'First Name', type: 'string' as const },
        { key: 'lastName', label: 'Last Name', type: 'string' as const },
        { key: 'email', label: 'Email', type: 'string' as const },
        { key: 'phone', label: 'Phone', type: 'string' as const },
        { key: 'company', label: 'Company', type: 'string' as const },
        { key: 'isActive', label: 'Active', type: 'boolean' as const },
        { key: 'tags', label: 'Tags', type: 'string' as const },
        { key: 'createdAt', label: 'Created Date', type: 'date' as const }
      ],
      campaigns: [
        { key: 'name', label: 'Campaign Name', type: 'string' as const },
        { key: 'type', label: 'Type', type: 'string' as const },
        { key: 'status', label: 'Status', type: 'string' as const },
        { key: 'sentCount', label: 'Sent', type: 'number' as const },
        { key: 'openRate', label: 'Open Rate', type: 'percentage' as const },
        { key: 'clickRate', label: 'Click Rate', type: 'percentage' as const },
        { key: 'createdAt', label: 'Created Date', type: 'date' as const }
      ],
      analytics: [
        { key: 'entity', label: 'Entity', type: 'string' as const },
        { key: 'event', label: 'Event', type: 'string' as const },
        { key: 'value', label: 'Value', type: 'number' as const },
        { key: 'timestamp', label: 'Timestamp', type: 'date' as const }
      ],
      workflows: [
        { key: 'name', label: 'Workflow Name', type: 'string' as const },
        { key: 'status', label: 'Status', type: 'string' as const },
        { key: 'nodeCount', label: 'Nodes', type: 'number' as const },
        { key: 'executionCount', label: 'Executions', type: 'number' as const },
        { key: 'successfulExecutions', label: 'Successful', type: 'number' as const },
        { key: 'createdAt', label: 'Created Date', type: 'date' as const }
      ],
      transactions: [
        { key: 'id', label: 'Transaction ID', type: 'string' as const },
        { key: 'amount', label: 'Amount', type: 'currency' as const },
        { key: 'status', label: 'Status', type: 'string' as const },
        { key: 'date', label: 'Date', type: 'date' as const }
      ]
    };

    return columnSets[dataSource as keyof typeof columnSets] || [];
  }

  /**
   * Extract filters from natural language query
   */
  private extractFilters(query: string, intent: any): Record<string, any> {
    const filters: Record<string, any> = {};

    // Date range filters
    if (query.includes('last week')) {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      filters.createdAfter = lastWeek.toISOString();
    } else if (query.includes('last month')) {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      filters.createdAfter = lastMonth.toISOString();
    } else if (query.includes('this year')) {
      const thisYear = new Date(new Date().getFullYear(), 0, 1);
      filters.createdAfter = thisYear.toISOString();
    }

    // Status filters
    if (query.includes('active')) {
      filters.isActive = true;
    } else if (query.includes('inactive')) {
      filters.isActive = false;
    }

    // Limit filters
    const limitMatch = query.match(/(\d+)\s*(top|first|limit)/i);
    if (limitMatch) {
      filters.limit = Number.parseInt(limitMatch[1]);
    }

    return filters;
  }

  /**
   * Generate report title
   */
  private generateReportTitle(dataSource: string, query: string): string {
    const now = new Date().toLocaleDateString();
    
    if (query.includes('performance')) {
      return `${dataSource.charAt(0).toUpperCase() + dataSource.slice(1)} Performance Report - ${now}`;
    } else if (query.includes('summary')) {
      return `${dataSource.charAt(0).toUpperCase() + dataSource.slice(1)} Summary Report - ${now}`;
    } else if (query.includes('export')) {
      return `${dataSource.charAt(0).toUpperCase() + dataSource.slice(1)} Export - ${now}`;
    } else {
      return `${dataSource.charAt(0).toUpperCase() + dataSource.slice(1)} Report - ${now}`;
    }
  }

  /**
   * Extract report purpose
   */
  private extractReportPurpose(query: string, intent: any): string {
    if (query.includes('audit')) return 'Audit and compliance review';
    if (query.includes('analysis')) return 'Data analysis and insights';
    if (query.includes('performance')) return 'Performance monitoring and optimization';
    if (query.includes('backup') || query.includes('export')) return 'Data backup and export';
    return 'Business intelligence and reporting';
  }

  /**
   * Determine if charts should be included
   */
  private shouldIncludeCharts(query: string, format: string): boolean {
    if (format === 'CSV' || format === 'JSON') return false;
    return query.includes('chart') || query.includes('graph') || query.includes('visual');
  }

  /**
   * Suggest chart types based on data
   */
  private suggestChartTypes(dataSource: string, columns: ExportColumn[]): string[] {
    const chartTypes: string[] = [];
    
    const hasDateColumn = columns.some(col => col.type === 'date');
    const hasNumberColumns = columns.filter(col => col.type === 'number' || col.type === 'currency').length;
    
    if (hasDateColumn && hasNumberColumns > 0) {
      chartTypes.push('line', 'area');
    }
    
    if (hasNumberColumns > 0) {
      chartTypes.push('bar', 'pie');
    }
    
    return chartTypes.length > 0 ? chartTypes : ['bar'];
  }

  /**
   * Validate user permissions for report
   */
  private async validateReportPermissions(
    reportDef: IntelligentReportDefinition, 
    request: ReportRequest
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Check data source permissions
    const dataSourcePermissions = {
      'contacts': Permission.VIEW_CONTACT,
      'campaigns': Permission.VIEW_CAMPAIGN,
      'analytics': Permission.VIEW_ANALYTICS,
      'workflows': Permission.VIEW_WORKFLOW,
      'transactions': Permission.VIEW_FINANCIAL_DATA
    };

    const requiredPermission = dataSourcePermissions[reportDef.dataSource as keyof typeof dataSourcePermissions];
    
    if (requiredPermission) {
      const hasPermission = AuthorizationService.hasPermission(
        request.userRole as any,
        requiredPermission
      );

      if (!hasPermission) {
        return {
          allowed: false,
          reason: `You don't have permission to access ${reportDef.dataSource} data`
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Estimate report size
   */
  private async estimateReportSize(reportDef: IntelligentReportDefinition): Promise<number> {
    // Simple estimation based on data source
    const estimates = {
      'contacts': 5000,
      'campaigns': 500,
      'analytics': 10000,
      'workflows': 200,
      'transactions': 1000
    };

    return estimates[reportDef.dataSource as keyof typeof estimates] || 1000;
  }

  /**
   * Generate appropriate filename
   */
  private generateReportFilename(title: string, format: string): string {
    const sanitized = title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    return `${sanitized}_${timestamp}.${format.toLowerCase()}`;
  }

  /**
   * Schedule recurring report
   */
  private async scheduleReport(exportJob: ExportJob, schedule: any): Promise<void> {
    logger.info('Scheduling recurring report', {
      reportId: exportJob.id,
      frequency: schedule.frequency,
      recipients: schedule.recipients
    });
    
    // In production, this would integrate with a job scheduler like Bull or similar
    // For now, just log the scheduling request
  }

  /**
   * Get report suggestions for unclear queries
   */
  private getReportSuggestions(query: string): string[] {
    const suggestions = [
      'Try: "Generate a contacts report in Excel format"',
      'Try: "Export campaign performance data as PDF"',
      'Try: "Create analytics summary for last month"',
      'Try: "Generate workflow report with charts"'
    ];

    // Add specific suggestions based on query content
    if (query.includes('contact')) {
      suggestions.unshift('Try: "Export all active contacts to Excel"');
    } else if (query.includes('campaign')) {
      suggestions.unshift('Try: "Generate campaign performance report as PDF"');
    }

    return suggestions.slice(0, 3);
  }

  /**
   * Get available report types
   */
  getAvailableReportTypes(): Array<{ type: string; description: string; formats: string[] }> {
    return [
      {
        type: 'contacts',
        description: 'Contact and customer data reports',
        formats: ['CSV', 'Excel', 'PDF']
      },
      {
        type: 'campaigns',
        description: 'Marketing campaign performance reports',
        formats: ['Excel', 'PDF', 'CSV']
      },
      {
        type: 'analytics',
        description: 'Analytics and metrics reports',
        formats: ['Excel', 'PDF', 'JSON']
      },
      {
        type: 'workflows',
        description: 'Workflow and automation reports',
        formats: ['Excel', 'PDF', 'CSV']
      }
    ];
  }
}

// Export singleton instance
export const intelligentReportingEngine = new IntelligentReportingEngine();

// Convenience functions
export async function generateAIReport(request: ReportRequest): Promise<ReportResult> {
  return intelligentReportingEngine.generateReport(request);
}

export function getAvailableReportTypes() {
  return intelligentReportingEngine.getAvailableReportTypes();
}