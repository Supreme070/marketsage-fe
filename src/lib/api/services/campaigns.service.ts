import { BaseApiClient } from '../base/api-client';
import type {
  CreateCampaignDto,
  UpdateCampaignDto,
  Campaign,
  CampaignAnalytics,
  GetCampaignsQueryDto,
  PaginatedCampaignsResponse,
  CampaignTestDto,
  CampaignTestResult,
  DuplicateCampaignDto,
  CampaignBulkActionDto,
  CampaignBulkActionResult,
  CampaignPreview,
  CampaignScheduleDto,
  CampaignType,
  CampaignStatus,
  CampaignPriority,
} from '../types/campaigns';
import { ApiResponse } from '../types/common';

export class CampaignsService extends BaseApiClient {
  /**
   * Create a new campaign
   */
  async createCampaign(campaignData: CreateCampaignDto): Promise<Campaign> {
    try {
      const response = await this.post<Campaign>('/campaigns', campaignData);
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get all campaigns with filtering and pagination
   */
  async getCampaigns(query: GetCampaignsQueryDto = {}): Promise<PaginatedCampaignsResponse> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await this.get<PaginatedCampaignsResponse>(
        `/campaigns?${params.toString()}`
      );
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(campaignId: string): Promise<Campaign> {
    try {
      const response = await this.get<Campaign>(`/campaigns/${campaignId}`);
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update campaign
   */
  async updateCampaign(campaignId: string, updateData: UpdateCampaignDto): Promise<Campaign> {
    try {
      const response = await this.put<Campaign>(`/campaigns/${campaignId}`, updateData);
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId: string): Promise<{ success: boolean }> {
    try {
      const response = await this.delete<{ success: boolean }>(`/campaigns/${campaignId}`);
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Duplicate campaign
   */
  async duplicateCampaign(
    campaignId: string,
    duplicateOptions: DuplicateCampaignDto
  ): Promise<Campaign> {
    try {
      const response = await this.post<Campaign>(
        `/campaigns/${campaignId}/duplicate`,
        duplicateOptions
      );
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Send campaign
   */
  async sendCampaign(campaignId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.post<{ success: boolean; message: string }>(
        `/campaigns/${campaignId}/send`
      );
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.post<{ success: boolean; message: string }>(
        `/campaigns/${campaignId}/pause`
      );
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Resume campaign
   */
  async resumeCampaign(campaignId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.post<{ success: boolean; message: string }>(
        `/campaigns/${campaignId}/resume`
      );
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Test campaign
   */
  async testCampaign(campaignId: string, testData: CampaignTestDto): Promise<CampaignTestResult> {
    try {
      const response = await this.post<CampaignTestResult>(
        `/campaigns/${campaignId}/test`,
        testData
      );
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string, days?: number): Promise<CampaignAnalytics> {
    try {
      const params = days ? `?days=${days}` : '';
      const response = await this.get<CampaignAnalytics>(
        `/campaigns/${campaignId}/analytics${params}`
      );
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Perform bulk actions on campaigns
   */
  async bulkActionCampaigns(actionData: CampaignBulkActionDto): Promise<CampaignBulkActionResult> {
    try {
      const response = await this.post<CampaignBulkActionResult>('/campaigns/bulk-action', actionData);
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Preview campaign content
   */
  async previewCampaign(campaignId: string, previewType = 'html'): Promise<CampaignPreview> {
    try {
      const response = await this.get<CampaignPreview>(
        `/campaigns/${campaignId}/preview?type=${previewType}`
      );
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Schedule campaign
   */
  async scheduleCampaign(
    campaignId: string,
    scheduleData: CampaignScheduleDto
  ): Promise<{ success: boolean; message: string; scheduledAt: string }> {
    try {
      const response = await this.post<{ success: boolean; message: string; scheduledAt: string }>(
        `/campaigns/${campaignId}/schedule`,
        scheduleData
      );
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get campaigns by type
   */
  async getCampaignsByType(
    type: CampaignType,
    query: GetCampaignsQueryDto = {}
  ): Promise<PaginatedCampaignsResponse> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await this.get<PaginatedCampaignsResponse>(
        `/campaigns/type/${type}?${params.toString()}`
      );
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get campaigns by status
   */
  async getCampaignsByStatus(
    status: CampaignStatus,
    query: GetCampaignsQueryDto = {}
  ): Promise<PaginatedCampaignsResponse> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await this.get<PaginatedCampaignsResponse>(
        `/campaigns/status/${status}?${params.toString()}`
      );
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get campaigns by priority
   */
  async getCampaignsByPriority(
    priority: CampaignPriority,
    query: GetCampaignsQueryDto = {}
  ): Promise<PaginatedCampaignsResponse> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await this.get<PaginatedCampaignsResponse>(
        `/campaigns/priority/${priority}?${params.toString()}`
      );
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get recent campaigns
   */
  async getRecentCampaigns(limit = 10): Promise<PaginatedCampaignsResponse> {
    try {
      const response = await this.get<PaginatedCampaignsResponse>(
        `/campaigns/recent/list?limit=${limit}`
      );
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get draft campaigns
   */
  async getDraftCampaigns(query: GetCampaignsQueryDto = {}): Promise<PaginatedCampaignsResponse> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await this.get<PaginatedCampaignsResponse>(
        `/campaigns/draft/list?${params.toString()}`
      );
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get scheduled campaigns
   */
  async getScheduledCampaigns(query: GetCampaignsQueryDto = {}): Promise<PaginatedCampaignsResponse> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await this.get<PaginatedCampaignsResponse>(
        `/campaigns/scheduled/list?${params.toString()}`
      );
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get active/sending campaigns
   */
  async getActiveCampaigns(query: GetCampaignsQueryDto = {}): Promise<PaginatedCampaignsResponse> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await this.get<PaginatedCampaignsResponse>(
        `/campaigns/active/list?${params.toString()}`
      );
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Clone campaign template
   */
  async cloneCampaignTemplate(
    campaignId: string,
    newName: string
  ): Promise<Campaign> {
    try {
      const response = await this.post<Campaign>(`/campaigns/${campaignId}/duplicate`, {
        name: newName,
        copyContent: true,
        copyAudience: false,
        copySchedule: false,
      });
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get campaign recipients
   */
  async getCampaignRecipients(
    campaignId: string,
    page = 1,
    limit = 10
  ): Promise<{
    recipients: Array<{
      id: string;
      email: string;
      name?: string;
      status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
      sentAt?: Date;
      deliveredAt?: Date;
      openedAt?: Date;
      clickedAt?: Date;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await this.get<any>(
        `/campaigns/${campaignId}/recipients?${params.toString()}`
      );
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }
}