import { BaseApiClient } from '../base/api-client';
import {
  type LeadPulseForm,
  type CreateFormDto,
  type UpdateFormDto,
  type FormQueryDto,
  type LeadPulseFormListResponse,
  type LeadPulseFormSubmission,
  type FormSubmissionDto,
  type SubmissionQueryDto,
  type LeadPulseSubmissionListResponse,
  type LeadPulseVisitor,
  type CreateVisitorDto,
  type VisitorQueryDto,
  type LeadPulseVisitorListResponse,
  type LeadPulseTouchpoint,
  type CreateTouchpointDto,
  type LeadPulseInsight,
  type CreateInsightDto,
  type InsightQueryDto,
  type GenerateInsightDto,
  type LeadPulseInsightListResponse,
  type LeadPulseAnalytics,
  type LeadPulseApiKey,
  type CreateApiKeyDto,
  type UpdateApiKeyDto,
} from '../types/leadpulse';
import type { ApiResponse } from '../types/common';

export class LeadPulseService extends BaseApiClient {
  // ==================== FORM MANAGEMENT ====================

  /**
   * Create a new LeadPulse form
   */
  async createForm(formData: CreateFormDto): Promise<LeadPulseForm> {
    try {
      const response = await this.post<ApiResponse<LeadPulseForm>>('/leadpulse/forms', formData);
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get all forms with pagination and filtering
   */
  async getForms(options: FormQueryDto = {}): Promise<LeadPulseFormListResponse> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await this.get<ApiResponse<LeadPulseFormListResponse>>(
        `/leadpulse/forms?${params.toString()}`
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get form by ID
   */
  async getFormById(formId: string): Promise<LeadPulseForm> {
    try {
      const response = await this.get<ApiResponse<LeadPulseForm>>(`/leadpulse/forms/${formId}`);
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update form
   */
  async updateForm(formId: string, updateData: UpdateFormDto): Promise<LeadPulseForm> {
    try {
      const response = await this.patch<ApiResponse<LeadPulseForm>>(
        `/leadpulse/forms/${formId}`,
        updateData
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete form
   */
  async deleteForm(formId: string): Promise<void> {
    try {
      await this.delete(`/leadpulse/forms/${formId}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== FORM SUBMISSIONS ====================

  /**
   * Submit form data (Public endpoint - requires API key)
   */
  async submitForm(submissionData: FormSubmissionDto): Promise<LeadPulseFormSubmission> {
    try {
      const response = await this.post<ApiResponse<LeadPulseFormSubmission>>(
        '/leadpulse/forms/submit',
        submissionData
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get form submissions with pagination and filtering
   */
  async getSubmissions(options: SubmissionQueryDto = {}): Promise<LeadPulseSubmissionListResponse> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await this.get<ApiResponse<LeadPulseSubmissionListResponse>>(
        `/leadpulse/submissions?${params.toString()}`
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get submission by ID
   */
  async getSubmissionById(submissionId: string): Promise<LeadPulseFormSubmission> {
    try {
      const response = await this.get<ApiResponse<LeadPulseFormSubmission>>(
        `/leadpulse/submissions/${submissionId}`
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== VISITOR MANAGEMENT ====================

  /**
   * Create a new visitor (Public endpoint - requires API key)
   */
  async createVisitor(visitorData: CreateVisitorDto): Promise<LeadPulseVisitor> {
    try {
      const response = await this.post<ApiResponse<LeadPulseVisitor>>(
        '/leadpulse/visitors',
        visitorData
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get all visitors with pagination and filtering
   */
  async getVisitors(options: VisitorQueryDto = {}): Promise<LeadPulseVisitorListResponse> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await this.get<ApiResponse<LeadPulseVisitorListResponse>>(
        `/leadpulse/visitors?${params.toString()}`
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get visitor by ID
   */
  async getVisitorById(visitorId: string): Promise<LeadPulseVisitor> {
    try {
      const response = await this.get<ApiResponse<LeadPulseVisitor>>(
        `/leadpulse/visitors/${visitorId}`
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== TOUCHPOINT MANAGEMENT ====================

  /**
   * Create a new touchpoint (Public endpoint - requires API key)
   */
  async createTouchpoint(touchpointData: CreateTouchpointDto): Promise<LeadPulseTouchpoint> {
    try {
      const response = await this.post<ApiResponse<LeadPulseTouchpoint>>(
        '/leadpulse/touchpoints',
        touchpointData
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get touchpoints for a visitor
   */
  async getTouchpointsByVisitor(visitorId: string): Promise<LeadPulseTouchpoint[]> {
    try {
      const response = await this.get<ApiResponse<LeadPulseTouchpoint[]>>(
        `/leadpulse/visitors/${visitorId}/touchpoints`
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== INSIGHTS MANAGEMENT ====================

  /**
   * Create a new insight
   */
  async createInsight(insightData: CreateInsightDto): Promise<LeadPulseInsight> {
    try {
      const response = await this.post<ApiResponse<LeadPulseInsight>>(
        '/leadpulse/insights',
        insightData
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get all insights with pagination and filtering
   */
  async getInsights(options: InsightQueryDto = {}): Promise<LeadPulseInsightListResponse> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await this.get<ApiResponse<LeadPulseInsightListResponse>>(
        `/leadpulse/insights?${params.toString()}`
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Generate AI-powered insights
   */
  async generateInsight(generateData: GenerateInsightDto): Promise<LeadPulseInsight> {
    try {
      const response = await this.post<ApiResponse<LeadPulseInsight>>(
        '/leadpulse/insights/generate',
        generateData
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete insight
   */
  async deleteInsight(insightId: string): Promise<void> {
    try {
      await this.delete(`/leadpulse/insights/${insightId}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== ANALYTICS ====================

  /**
   * Get LeadPulse analytics dashboard data
   */
  async getAnalytics(): Promise<LeadPulseAnalytics> {
    try {
      const response = await this.get<ApiResponse<LeadPulseAnalytics>>('/leadpulse/analytics');
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get form analytics
   */
  async getFormAnalytics(formId: string): Promise<{
    formId: string;
    formName: string;
    totalSubmissions: number;
    conversionRate: number;
    averageScore: number;
    qualityBreakdown: {
      high: number;
      medium: number;
      low: number;
    };
    recentSubmissions: LeadPulseFormSubmission[];
  }> {
    try {
      const response = await this.get<ApiResponse<any>>(`/leadpulse/forms/${formId}/analytics`);
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== API KEY MANAGEMENT ====================

  /**
   * Create a new API key
   */
  async createApiKey(apiKeyData: CreateApiKeyDto): Promise<LeadPulseApiKey> {
    try {
      const response = await this.post<ApiResponse<LeadPulseApiKey>>(
        '/auth/api-keys',
        apiKeyData
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get all API keys
   */
  async getApiKeys(): Promise<LeadPulseApiKey[]> {
    try {
      const response = await this.get<ApiResponse<LeadPulseApiKey[]>>('/auth/api-keys');
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update API key
   */
  async updateApiKey(apiKeyId: string, updateData: UpdateApiKeyDto): Promise<LeadPulseApiKey> {
    try {
      const response = await this.patch<ApiResponse<LeadPulseApiKey>>(
        `/auth/api-keys/${apiKeyId}`,
        updateData
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete API key
   */
  async deleteApiKey(apiKeyId: string): Promise<void> {
    try {
      await this.delete(`/auth/api-keys/${apiKeyId}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Set API key for public endpoints
   */
  setApiKey(apiKey: string): void {
    this.setDefaultHeader('Authorization', `Bearer ${apiKey}`);
  }

  /**
   * Set domain for public endpoints
   */
  setDomain(domain: string): void {
    this.setDefaultHeader('Origin', domain);
  }

  /**
   * Clear API key
   */
  clearApiKey(): void {
    this.removeDefaultHeader('Authorization');
  }

  /**
   * Clear domain
   */
  clearDomain(): void {
    this.removeDefaultHeader('Origin');
  }

  /**
   * Configure public endpoint access
   */
  configurePublicAccess(apiKey: string, domain: string): void {
    this.setApiKey(apiKey);
    this.setDomain(domain);
  }

  /**
   * Clear public endpoint configuration
   */
  clearPublicAccess(): void {
    this.clearApiKey();
    this.clearDomain();
  }
}
