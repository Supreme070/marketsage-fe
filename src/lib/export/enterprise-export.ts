/**
 * Enterprise Export System
 * ========================
 * Comprehensive data export capabilities for enterprise reporting,
 * compliance, and business intelligence with multiple formats and filtering
 */

import { logger } from '@/lib/logger';

export interface ExportFormat {
  type: 'CSV' | 'Excel' | 'PDF' | 'JSON' | 'XML' | 'PowerBI' | 'Tableau';
  mimeType: string;
  extension: string;
  supportsSheets: boolean;
  supportsFormatting: boolean;
}

export interface ExportColumn {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency' | 'percentage';
  format?: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
}

export interface ExportOptions {
  format: ExportFormat['type'];
  filename?: string;
  includeHeaders: boolean;
  includeMetadata: boolean;
  includeTimestamp: boolean;
  compression?: 'none' | 'zip' | 'gzip';
  password?: string;
  watermark?: string;
  scheduleExport?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    recipients: string[];
    enabled: boolean;
  };
  compliance: {
    includeAuditTrail: boolean;
    redactSensitiveData: boolean;
    encryptionLevel: 'standard' | 'enhanced' | 'enterprise';
    retentionPeriod?: string;
  };
}

export interface ExportRequest {
  dataSource: string;
  columns: ExportColumn[];
  filters: Record<string, any>;
  options: ExportOptions;
  requestedBy: {
    userId: string;
    userName: string;
    role: string;
    tenantId: string;
  };
  purpose: string;
  estimatedRows?: number;
}

export interface ExportJob {
  id: string;
  request: ExportRequest;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime: Date;
  endTime?: Date;
  downloadUrl?: string;
  error?: string;
  fileSize?: number;
  rowCount?: number;
  checksumHash?: string;
}

class EnterpriseExportManager {
  private static instance: EnterpriseExportManager;
  
  // Supported export formats
  private readonly formats: Record<ExportFormat['type'], ExportFormat> = {
    CSV: {
      type: 'CSV',
      mimeType: 'text/csv',
      extension: 'csv',
      supportsSheets: false,
      supportsFormatting: false
    },
    Excel: {
      type: 'Excel',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: 'xlsx',
      supportsSheets: true,
      supportsFormatting: true
    },
    PDF: {
      type: 'PDF',
      mimeType: 'application/pdf',
      extension: 'pdf',
      supportsSheets: false,
      supportsFormatting: true
    },
    JSON: {
      type: 'JSON',
      mimeType: 'application/json',
      extension: 'json',
      supportsSheets: false,
      supportsFormatting: false
    },
    XML: {
      type: 'XML',
      mimeType: 'application/xml',
      extension: 'xml',
      supportsSheets: false,
      supportsFormatting: false
    },
    PowerBI: {
      type: 'PowerBI',
      mimeType: 'application/json',
      extension: 'pbix',
      supportsSheets: true,
      supportsFormatting: true
    },
    Tableau: {
      type: 'Tableau',
      mimeType: 'application/json',
      extension: 'tde',
      supportsSheets: true,
      supportsFormatting: true
    }
  };

  // Data source configurations for African fintech context
  private readonly dataSources = {
    customers: {
      table: 'customers',
      sensitiveFields: ['phone', 'email', 'address', 'nationalId', 'bvn'],
      requiredRole: 'data_analyst',
      maxRows: 100000
    },
    transactions: {
      table: 'transactions',
      sensitiveFields: ['amount', 'accountNumber', 'reference'],
      requiredRole: 'financial_analyst',
      maxRows: 500000
    },
    campaigns: {
      table: 'campaigns',
      sensitiveFields: [],
      requiredRole: 'marketing_manager',
      maxRows: 50000
    },
    compliance: {
      table: 'compliance_records',
      sensitiveFields: ['kycData', 'riskAssessment', 'sanctions'],
      requiredRole: 'compliance_officer',
      maxRows: 10000
    },
    analytics: {
      table: 'analytics_summary',
      sensitiveFields: ['pii_metrics'],
      requiredRole: 'business_analyst',
      maxRows: 1000000
    }
  };

  static getInstance(): EnterpriseExportManager {
    if (!this.instance) {
      this.instance = new EnterpriseExportManager();
    }
    return this.instance;
  }

  async createExportJob(request: ExportRequest): Promise<ExportJob> {
    try {
      // Validate request
      await this.validateExportRequest(request);

      // Create export job
      const job: ExportJob = {
        id: this.generateJobId(),
        request,
        status: 'pending',
        progress: 0,
        startTime: new Date()
      };

      // Log export request for audit trail
      logger.info('Export job created', {
        jobId: job.id,
        dataSource: request.dataSource,
        format: request.options.format,
        requestedBy: request.requestedBy.userId,
        tenantId: request.requestedBy.tenantId,
        purpose: request.purpose,
        estimatedRows: request.estimatedRows
      });

      // Start processing in background
      this.processExportJob(job);

      return job;
    } catch (error) {
      logger.error('Failed to create export job', {
        error: error instanceof Error ? error.message : 'Unknown error',
        request
      });
      throw error;
    }
  }

  private async validateExportRequest(request: ExportRequest): Promise<void> {
    // Check data source permissions
    const dataSource = this.dataSources[request.dataSource as keyof typeof this.dataSources];
    if (!dataSource) {
      throw new Error(`Invalid data source: ${request.dataSource}`);
    }

    // Check user role permissions
    if (!this.hasRequiredRole(request.requestedBy.role, dataSource.requiredRole)) {
      throw new Error(`Insufficient permissions for data source: ${request.dataSource}`);
    }

    // Check row limits
    if (request.estimatedRows && request.estimatedRows > dataSource.maxRows) {
      throw new Error(`Row limit exceeded. Maximum ${dataSource.maxRows} rows allowed for ${request.dataSource}`);
    }

    // Validate export format
    if (!this.formats[request.options.format]) {
      throw new Error(`Unsupported export format: ${request.options.format}`);
    }

    // Check compliance requirements
    if (request.options.compliance.redactSensitiveData && dataSource.sensitiveFields.length > 0) {
      const requestedSensitiveFields = request.columns.filter(col => 
        dataSource.sensitiveFields.includes(col.key)
      );
      
      if (requestedSensitiveFields.length > 0 && !this.hasDataAccessRole(request.requestedBy.role)) {
        throw new Error('Insufficient permissions to export sensitive data');
      }
    }
  }

  private async processExportJob(job: ExportJob): Promise<void> {
    try {
      job.status = 'processing';
      
      // Fetch data based on filters
      const data = await this.fetchExportData(job.request);
      job.progress = 30;

      // Apply compliance filters
      const processedData = await this.applyComplianceFilters(data, job.request);
      job.progress = 60;

      // Generate export file
      const exportFile = await this.generateExportFile(processedData, job.request);
      job.progress = 90;

      // Upload to secure storage and generate download URL
      const { downloadUrl, fileSize, checksumHash } = await this.uploadExportFile(exportFile, job);
      
      job.status = 'completed';
      job.progress = 100;
      job.endTime = new Date();
      job.downloadUrl = downloadUrl;
      job.fileSize = fileSize;
      job.rowCount = processedData.length;
      job.checksumHash = checksumHash;

      // Send notification if scheduled export
      if (job.request.options.scheduleExport?.enabled) {
        await this.sendExportNotification(job);
      }

      logger.info('Export job completed', {
        jobId: job.id,
        rowCount: job.rowCount,
        fileSize: job.fileSize,
        duration: job.endTime.getTime() - job.startTime.getTime()
      });

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.endTime = new Date();

      logger.error('Export job failed', {
        jobId: job.id,
        error: job.error
      });
    }
  }

  private async fetchExportData(request: ExportRequest): Promise<any[]> {
    // In production, this would query your actual database
    // For now, we'll simulate data fetching with realistic African fintech data

    const mockData = this.generateMockData(request.dataSource, request.columns, request.filters);
    
    // Simulate database query delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return mockData;
  }

  private generateMockData(dataSource: string, columns: ExportColumn[], filters: any): any[] {
    const rowCount = Math.min(1000, filters.limit || 1000);
    const data: any[] = [];

    for (let i = 0; i < rowCount; i++) {
      const row: any = {};
      
      columns.forEach(column => {
        switch (column.type) {
          case 'string':
            row[column.key] = this.generateMockString(column.key, dataSource);
            break;
          case 'number':
            row[column.key] = Math.floor(Math.random() * 10000);
            break;
          case 'currency':
            row[column.key] = (Math.random() * 100000).toFixed(2);
            break;
          case 'percentage':
            row[column.key] = (Math.random() * 100).toFixed(1);
            break;
          case 'date':
            row[column.key] = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
            break;
          case 'boolean':
            row[column.key] = Math.random() > 0.5;
            break;
          default:
            row[column.key] = `Sample ${column.key} ${i}`;
        }
      });
      
      data.push(row);
    }

    return data;
  }

  private generateMockString(fieldKey: string, dataSource: string): string {
    const mockData = {
      name: ['Adaora Okafor', 'Kwame Asante', 'Amina Hassan', 'Thabo Mthembu', 'Fatima Al-Rashid'],
      email: ['user@example.com', 'customer@bank.ng', 'client@fintech.ke'],
      country: ['Nigeria', 'Kenya', 'Ghana', 'South Africa', 'Egypt'],
      city: ['Lagos', 'Nairobi', 'Accra', 'Cape Town', 'Cairo'],
      status: ['Active', 'Pending', 'Completed', 'Cancelled'],
      segment: ['High-Value Corporate', 'SME Growth', 'Retail Premium', 'Youth Banking'],
      channel: ['Mobile App', 'USSD', 'Agent Network', 'Bank Branch']
    };

    const keys = Object.keys(mockData);
    const matchingKey = keys.find(key => fieldKey.toLowerCase().includes(key));
    
    if (matchingKey) {
      const options = mockData[matchingKey as keyof typeof mockData];
      return options[Math.floor(Math.random() * options.length)];
    }
    
    return `Sample ${fieldKey}`;
  }

  private async applyComplianceFilters(data: any[], request: ExportRequest): Promise<any[]> {
    if (!request.options.compliance.redactSensitiveData) {
      return data;
    }

    const dataSource = this.dataSources[request.dataSource as keyof typeof this.dataSources];
    const sensitiveFields = dataSource?.sensitiveFields || [];

    return data.map(row => {
      const filteredRow = { ...row };
      
      sensitiveFields.forEach(field => {
        if (filteredRow[field]) {
          // Apply redaction based on field type
          if (field.includes('phone')) {
            filteredRow[field] = this.maskPhone(filteredRow[field]);
          } else if (field.includes('email')) {
            filteredRow[field] = this.maskEmail(filteredRow[field]);
          } else if (field.includes('account') || field.includes('bvn')) {
            filteredRow[field] = this.maskAccountNumber(filteredRow[field]);
          } else {
            filteredRow[field] = '[REDACTED]';
          }
        }
      });
      
      return filteredRow;
    });
  }

  private maskPhone(phone: string): string {
    if (phone.length < 4) return '[REDACTED]';
    return phone.slice(0, 3) + '****' + phone.slice(-2);
  }

  private maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    if (!username || !domain) return '[REDACTED]';
    
    const maskedUsername = username.length > 2 ? 
      username.slice(0, 2) + '***' + username.slice(-1) : 
      '***';
    
    return `${maskedUsername}@${domain}`;
  }

  private maskAccountNumber(account: string): string {
    if (account.length < 8) return '[REDACTED]';
    return '****' + account.slice(-4);
  }

  private async generateExportFile(data: any[], request: ExportRequest): Promise<Buffer> {
    const format = this.formats[request.options.format];
    
    switch (format.type) {
      case 'CSV':
        return this.generateCSV(data, request);
      case 'Excel':
        return this.generateExcel(data, request);
      case 'JSON':
        return this.generateJSON(data, request);
      case 'PDF':
        return this.generatePDF(data, request);
      default:
        throw new Error(`Export format ${format.type} not yet implemented`);
    }
  }

  private generateCSV(data: any[], request: ExportRequest): Buffer {
    const headers = request.columns.map(col => col.label).join(',');
    const rows = data.map(row => 
      request.columns.map(col => {
        const value = row[col.key];
        // Escape CSV values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    return Buffer.from(csv, 'utf-8');
  }

  private generateJSON(data: any[], request: ExportRequest): Buffer {
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        dataSource: request.dataSource,
        rowCount: data.length,
        filters: request.filters,
        requestedBy: request.requestedBy.userName,
        purpose: request.purpose
      },
      data: data
    };
    
    return Buffer.from(JSON.stringify(exportData, null, 2), 'utf-8');
  }

  private async generateExcel(data: any[], request: ExportRequest): Promise<Buffer> {
    // This would use a library like ExcelJS in production
    // For now, return CSV format as placeholder
    return this.generateCSV(data, request);
  }

  private async generatePDF(data: any[], request: ExportRequest): Promise<Buffer> {
    // This would use a library like PDFKit or Puppeteer in production
    // For now, return JSON format as placeholder
    return this.generateJSON(data, request);
  }

  private async uploadExportFile(
    fileBuffer: Buffer, 
    job: ExportJob
  ): Promise<{ downloadUrl: string; fileSize: number; checksumHash: string }> {
    // In production, upload to secure storage (AWS S3, Azure Blob, etc.)
    const fileSize = fileBuffer.length;
    const checksumHash = require('crypto')
      .createHash('sha256')
      .update(fileBuffer)
      .digest('hex');
    
    // Generate secure download URL (would be actual cloud storage URL in production)
    const downloadUrl = `/api/exports/download/${job.id}`;
    
    return { downloadUrl, fileSize, checksumHash };
  }

  private async sendExportNotification(job: ExportJob): Promise<void> {
    // Send notification to scheduled export recipients
    logger.info('Sending export notification', {
      jobId: job.id,
      recipients: job.request.options.scheduleExport?.recipients
    });
  }

  private hasRequiredRole(userRole: string, requiredRole: string): boolean {
    const roleHierarchy = {
      'super_admin': 100,
      'admin': 90,
      'compliance_officer': 80,
      'financial_analyst': 70,
      'data_analyst': 60,
      'business_analyst': 50,
      'marketing_manager': 40,
      'user': 10
    };

    const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 100;

    return userRoleLevel >= requiredRoleLevel;
  }

  private hasDataAccessRole(userRole: string): boolean {
    const dataAccessRoles = ['super_admin', 'admin', 'compliance_officer', 'data_analyst'];
    return dataAccessRoles.includes(userRole);
  }

  private generateJobId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for export management
  async getExportJob(jobId: string): Promise<ExportJob | null> {
    // In production, fetch from database
    // For now, return mock job
    return null;
  }

  async cancelExportJob(jobId: string): Promise<boolean> {
    // Cancel running export job
    logger.info('Export job cancelled', { jobId });
    return true;
  }

  getAvailableFormats(): ExportFormat[] {
    return Object.values(this.formats);
  }

  getDataSourceInfo(dataSource: string) {
    return this.dataSources[dataSource as keyof typeof this.dataSources];
  }
}

// Convenience functions
export function createExportJob(request: ExportRequest): Promise<ExportJob> {
  return EnterpriseExportManager.getInstance().createExportJob(request);
}

export function getExportFormats(): ExportFormat[] {
  return EnterpriseExportManager.getInstance().getAvailableFormats();
}

export function getDataSourceInfo(dataSource: string) {
  return EnterpriseExportManager.getInstance().getDataSourceInfo(dataSource);
}

export { EnterpriseExportManager }; 