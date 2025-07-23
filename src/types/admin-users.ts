// Admin Users Management API Types

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'SUSPENDED';
  emailVerified: Date | null;
  lastActiveAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isSuspended: boolean;
  suspendedAt: Date | null;
  suspensionReason: string | null;
  adminNotes: string | null;
  organization: {
    id: string;
    name: string;
    domain?: string | null;
  } | null;
  subscription?: {
    id: string;
    plan: string;
    status: string;
    currentPeriodEnd: Date;
  } | null;
  _count: {
    campaigns: number;
    contacts: number;
    workflows: number;
    auditLogs?: number;
  };
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  status?: 'ACTIVE' | 'SUSPENDED';
  organizationId?: string;
  sortBy?: 'createdAt' | 'email' | 'name' | 'lastActiveAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UserListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total: number;
    active: number;
    suspended: number;
    verified: number;
    unverified: number;
    byRole: {
      SUPER_ADMIN: number;
      ADMIN: number;
      USER: number;
    };
  };
}

export interface UserDetailResponse {
  user: User;
  activityLogs: ActivityLog[];
  adminNotes: AdminNote[];
}

export interface ActivityLog {
  id: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress: string;
  details: any;
  adminUser?: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface AdminNote {
  id: string;
  note: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL';
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  updatedBy: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export interface UpdateUserData {
  name?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  isSuspended?: boolean;
  suspensionReason?: string;
  adminNotes?: string;
  organizationId?: string;
}

export interface UpdateUserResponse {
  success: boolean;
  user: Partial<User>;
  message: string;
}

export interface ImpersonationRequest {
  reason: string;
  duration: number; // Hours
}

export interface ImpersonationResponse {
  success: boolean;
  impersonationToken: string;
  targetUser: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    organization: {
      id: string;
      name: string;
    } | null;
  };
  expiresAt: string;
  duration: number;
  message: string;
}

export interface UserStatsResponse {
  overview: {
    total: number;
    active: number;
    suspended: number;
    verified: number;
    unverified: number;
    newThisMonth: number;
    activeToday: number;
  };
  byRole: {
    SUPER_ADMIN: number;
    ADMIN: number;
    USER: number;
  };
  byOrganization: Array<{
    organizationId: string | null;
    organizationName: string | null;
    count: number;
    active: number;
    suspended: number;
  }>;
  growth: {
    period: string;
    data: Array<{
      date: string;
      newUsers: number;
      totalUsers: number;
      activeUsers: number;
    }>;
  };
  activity: {
    topCountries: Array<{
      country: string;
      count: number;
    }>;
    loginStats: {
      totalLogins: number;
      uniqueUsers: number;
      averageSessionDuration: number;
    };
  };
  engagement: {
    campaignCreators: number;
    contactImporters: number;
    workflowBuilders: number;
    aiUsage: number;
  };
}

export interface CreateNoteRequest {
  note: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface UpdateNoteRequest {
  note: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface BatchActionRequest {
  action: 'suspend' | 'unsuspend' | 'change_role' | 'delete' | 'export';
  userIds: string[];
  reason?: string;
  newRole?: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
}

export interface BatchOperationResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  results: Array<{
    userId: string;
    email: string;
    success: boolean;
    error?: string;
  }>;
  message: string;
}

export interface BatchExportParams {
  userIds: string;
  format?: 'json' | 'csv';
}

export interface BatchExportResponse {
  success: boolean;
  users: User[];
  exportedAt: string;
  totalCount: number;
}

// Hook types for React components
export interface UseUsersParams extends UserListParams {}

export interface UseUserParams {
  id: string;
}

export interface UseUserStatsParams {
  period?: '7d' | '30d' | '90d' | '1y';
  timezone?: string;
}

// API Response wrapper type
export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Filter and sort options
export const USER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'USER'] as const;
export const USER_STATUS_OPTIONS = ['ACTIVE', 'SUSPENDED'] as const;
export const SORT_FIELDS = ['createdAt', 'email', 'name', 'lastActiveAt'] as const;
export const SORT_ORDERS = ['asc', 'desc'] as const;
export const BATCH_ACTIONS = ['suspend', 'unsuspend', 'change_role', 'delete', 'export'] as const;
export const NOTE_TYPES = ['INFO', 'WARNING', 'CRITICAL'] as const;
export const EXPORT_FORMATS = ['json', 'csv'] as const;

// Validation schemas (for frontend use)
export const USER_VALIDATION = {
  name: {
    minLength: 1,
    maxLength: 100,
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  suspensionReason: {
    minLength: 10,
    maxLength: 500,
  },
  adminNotes: {
    maxLength: 1000,
  },
  impersonationReason: {
    minLength: 10,
    maxLength: 500,
  },
  note: {
    minLength: 1,
    maxLength: 1000,
  },
} as const;

// Permission constants
export const PERMISSIONS = {
  VIEW_USERS: ['SUPER_ADMIN', 'ADMIN'],
  CREATE_USER: ['SUPER_ADMIN'],
  UPDATE_USER: ['SUPER_ADMIN', 'ADMIN'],
  DELETE_USER: ['SUPER_ADMIN'],
  CHANGE_ROLE: ['SUPER_ADMIN'],
  IMPERSONATE_USER: ['SUPER_ADMIN'],
  VIEW_USER_NOTES: ['SUPER_ADMIN', 'ADMIN'],
  CREATE_USER_NOTE: ['SUPER_ADMIN', 'ADMIN'],
  UPDATE_USER_NOTE: ['SUPER_ADMIN', 'ADMIN'], // With restrictions
  DELETE_USER_NOTE: ['SUPER_ADMIN', 'ADMIN'], // With restrictions
  BATCH_OPERATIONS: ['SUPER_ADMIN', 'ADMIN'],
  EXPORT_USERS: ['SUPER_ADMIN', 'ADMIN'],
} as const;

export type Permission = keyof typeof PERMISSIONS;
export type UserRole = typeof USER_ROLES[number];
export type UserStatus = typeof USER_STATUS_OPTIONS[number];
export type SortField = typeof SORT_FIELDS[number];
export type SortOrder = typeof SORT_ORDERS[number];
export type BatchAction = typeof BATCH_ACTIONS[number];
export type NoteType = typeof NOTE_TYPES[number];
export type ExportFormat = typeof EXPORT_FORMATS[number];