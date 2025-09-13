import { BaseApiClient, ApiResponse } from '../base/api-client';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PAUSED';
  definition: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  organizationId?: string;
}

export interface CreateWorkflowRequest {
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PAUSED';
  definition: any;
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'PAUSED';
  definition?: any;
}

export interface WorkflowListResponse {
  workflows: Workflow[];
  total: number;
  page: number;
  limit: number;
}

export class WorkflowsService extends BaseApiClient {
  constructor(baseUrl?: string) {
    super(baseUrl);
  }

  /**
   * Get all workflows for the current user
   */
  async getWorkflows(options?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<WorkflowListResponse> {
    const params = new URLSearchParams();
    
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.status) params.append('status', options.status);
    if (options?.search) params.append('search', options.search);

    const queryString = params.toString();
    const endpoint = queryString ? `/workflows?${queryString}` : '/workflows';
    
    return this.get<WorkflowListResponse>(endpoint);
  }

  /**
   * Get a specific workflow by ID
   */
  async getWorkflow(id: string): Promise<Workflow> {
    return this.get<Workflow>(`/workflows/${id}`);
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(workflowData: CreateWorkflowRequest): Promise<Workflow> {
    return this.post<Workflow>('/workflows', workflowData);
  }

  /**
   * Update an existing workflow
   */
  async updateWorkflow(id: string, workflowData: UpdateWorkflowRequest): Promise<Workflow> {
    return this.put<Workflow>(`/workflows/${id}`, workflowData);
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(id: string): Promise<void> {
    return this.delete<void>(`/workflows/${id}`);
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(id: string, context?: any): Promise<{ executionId: string; status: string }> {
    return this.post<{ executionId: string; status: string }>(`/workflows/${id}/execute`, context);
  }

  /**
   * Get workflow analytics
   */
  async getWorkflowAnalytics(id: string, dateRange?: {
    start: string;
    end: string;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (dateRange?.start) params.append('start', dateRange.start);
    if (dateRange?.end) params.append('end', dateRange.end);

    const queryString = params.toString();
    const endpoint = queryString ? `/workflows/${id}/analytics?${queryString}` : `/workflows/${id}/analytics`;
    
    return this.get<any>(endpoint);
  }

  /**
   * Get workflow execution history
   */
  async getWorkflowExecutions(id: string, options?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<any> {
    const params = new URLSearchParams();
    
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.status) params.append('status', options.status);

    const queryString = params.toString();
    const endpoint = queryString ? `/workflows/${id}/executions?${queryString}` : `/workflows/${id}/executions`;
    
    return this.get<any>(endpoint);
  }
}
