// Contact related types based on backend DTOs

export interface CreateContactDto {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  source?: string;
  tags?: string[];
  customFields?: string;
  isSubscribed?: boolean;
  listId?: string;
  segmentIds?: string[];
}

export interface UpdateContactDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  source?: string;
  tags?: string[];
  customFields?: string;
  isSubscribed?: boolean;
  listId?: string;
  segmentIds?: string[];
}

export interface Contact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  source?: string;
  tags: string[];
  customFields?: Record<string, any>;
  isSubscribed: boolean;
  listId?: string;
  segmentIds: string[];
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactList {
  id: string;
  name: string;
  description?: string;
  contactCount: number;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactSegment {
  id: string;
  name: string;
  description?: string;
  conditions: Record<string, any>;
  contactCount: number;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedContactsResponse {
  contacts: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ContactImportDto {
  file: File;
  mappings: Record<string, string>;
  listId?: string;
  skipDuplicates?: boolean;
}

export interface ContactImportResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
}