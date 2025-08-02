import { BaseApiClient } from '../base/api-client';
import {
  type CreateContactDto,
  type UpdateContactDto,
  type Contact,
  ContactList,
  ContactSegment,
  type PaginatedContactsResponse,
  type ContactImportDto,
  type ContactImportResult,
} from '../types/contacts';
import type { ApiResponse, BaseQueryDto } from '../types/common';

export class ContactsService extends BaseApiClient {
  /**
   * Create a new contact
   */
  async createContact(contactData: CreateContactDto): Promise<Contact> {
    try {
      const response = await this.post<ApiResponse<Contact>>('/contacts', contactData);
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get all contacts with pagination and filtering
   */
  async getContacts(options: BaseQueryDto = {}): Promise<PaginatedContactsResponse> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await this.get<ApiResponse<PaginatedContactsResponse>>(
        `/contacts?${params.toString()}`
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get contact by ID
   */
  async getContactById(contactId: string): Promise<Contact> {
    try {
      const response = await this.get<ApiResponse<Contact>>(`/contacts/${contactId}`);
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get contact by email
   */
  async getContactByEmail(email: string): Promise<Contact> {
    try {
      const response = await this.get<ApiResponse<Contact>>(
        `/contacts/email/${encodeURIComponent(email)}`
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update contact
   */
  async updateContact(contactId: string, updateData: UpdateContactDto): Promise<Contact> {
    try {
      const response = await this.patch<ApiResponse<Contact>>(`/contacts/${contactId}`, updateData);
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete contact
   */
  async deleteContact(contactId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.delete<ApiResponse<any>>(`/contacts/${contactId}`);
      return {
        success: response.success,
        message: response.message || 'Contact deleted successfully',
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Search contacts
   */
  async searchContacts(
    query: string,
    filters?: {
      listId?: string;
      segmentIds?: string[];
      tags?: string[];
      isSubscribed?: boolean;
    },
    page = 1,
    limit = 10
  ): Promise<PaginatedContactsResponse> {
    try {
      const params = new URLSearchParams({
        search: query,
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            if (Array.isArray(value)) {
              value.forEach(v => params.append(key, v));
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      const response = await this.get<ApiResponse<PaginatedContactsResponse>>(
        `/contacts?${params.toString()}`
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get contacts by list
   */
  async getContactsByList(
    listId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedContactsResponse> {
    try {
      const params = new URLSearchParams({
        listId,
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await this.get<ApiResponse<PaginatedContactsResponse>>(
        `/contacts?${params.toString()}`
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get contacts by segment
   */
  async getContactsBySegment(
    segmentId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedContactsResponse> {
    try {
      const params = new URLSearchParams({
        segmentIds: segmentId,
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await this.get<ApiResponse<PaginatedContactsResponse>>(
        `/contacts?${params.toString()}`
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get contacts by tags
   */
  async getContactsByTags(
    tags: string[],
    page = 1,
    limit = 10
  ): Promise<PaginatedContactsResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      tags.forEach(tag => params.append('tags', tag));

      const response = await this.get<ApiResponse<PaginatedContactsResponse>>(
        `/contacts?${params.toString()}`
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Add tags to contact
   */
  async addTagsToContact(contactId: string, tags: string[]): Promise<Contact> {
    try {
      const response = await this.post<ApiResponse<Contact>>(`/contacts/${contactId}/tags`, {
        tags,
      });
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Remove tags from contact
   */
  async removeTagsFromContact(contactId: string, tags: string[]): Promise<Contact> {
    try {
      const response = await this.delete<ApiResponse<Contact>>(`/contacts/${contactId}/tags`, {
        headers: { 'Content-Type': 'application/json' },
      });
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Subscribe/unsubscribe contact
   */
  async updateSubscriptionStatus(
    contactId: string,
    isSubscribed: boolean
  ): Promise<Contact> {
    try {
      const response = await this.patch<ApiResponse<Contact>>(`/contacts/${contactId}`, {
        isSubscribed,
      });
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Bulk operations on contacts
   */
  async bulkUpdateContacts(
    contactIds: string[],
    updateData: Partial<UpdateContactDto>
  ): Promise<{
    success: boolean;
    updated: number;
    errors: Array<{ id: string; error: string }>;
  }> {
    try {
      const response = await this.post<ApiResponse<any>>('/contacts/bulk-update', {
        contactIds,
        updateData,
      });
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Bulk delete contacts
   */
  async bulkDeleteContacts(
    contactIds: string[]
  ): Promise<{
    success: boolean;
    deleted: number;
    errors: Array<{ id: string; error: string }>;
  }> {
    try {
      const response = await this.post<ApiResponse<any>>('/contacts/bulk-delete', {
        contactIds,
      });
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Import contacts from CSV/Excel
   */
  async importContacts(importData: ContactImportDto): Promise<ContactImportResult> {
    try {
      const formData = new FormData();
      formData.append('file', importData.file);
      formData.append('mappings', JSON.stringify(importData.mappings));
      
      if (importData.listId) {
        formData.append('listId', importData.listId);
      }
      
      if (importData.skipDuplicates !== undefined) {
        formData.append('skipDuplicates', importData.skipDuplicates.toString());
      }

      const response = await this.post<ApiResponse<ContactImportResult>>(
        '/contacts/import',
        formData,
        {
          headers: {
            // Remove Content-Type to let browser set it for FormData
          },
        }
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Export contacts
   */
  async exportContacts(
    filters?: {
      listId?: string;
      segmentIds?: string[];
      tags?: string[];
      isSubscribed?: boolean;
    },
    format: 'csv' | 'xlsx' = 'csv'
  ): Promise<{ downloadUrl: string; expiresAt: Date }> {
    try {
      const response = await this.post<ApiResponse<{ downloadUrl: string; expiresAt: Date }>>(
        '/contacts/export',
        {
          filters,
          format,
        }
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get contact activity/history
   */
  async getContactActivity(
    contactId: string,
    page = 1,
    limit = 10
  ): Promise<{
    activities: Array<{
      id: string;
      type: string;
      description: string;
      metadata?: Record<string, any>;
      createdAt: Date;
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

      const response = await this.get<ApiResponse<any>>(
        `/contacts/${contactId}/activity?${params.toString()}`
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Merge duplicate contacts
   */
  async mergeContacts(
    primaryContactId: string,
    duplicateContactIds: string[]
  ): Promise<Contact> {
    try {
      const response = await this.post<ApiResponse<Contact>>(`/contacts/${primaryContactId}/merge`, {
        duplicateContactIds,
      });
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }
}