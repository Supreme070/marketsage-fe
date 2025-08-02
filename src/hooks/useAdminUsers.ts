import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  type User,
  type UserListParams,
  type UserListResponse,
  type UserDetailResponse,
  type UserStatsResponse,
  type UpdateUserData,
  type UpdateUserResponse,
  type ImpersonationRequest,
  type ImpersonationResponse,
  type CreateNoteRequest,
  UpdateNoteRequest,
  type BatchActionRequest,
  type BatchOperationResult,
  type BatchExportParams,
  type BatchExportResponse,
  type AdminNote,
  ApiResponse,
} from '@/types/admin-users';

// Custom hook for managing users list
export function useAdminUsers(params: UserListParams = {}) {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    verified: 0,
    unverified: 0,
    byRole: {
      SUPER_ADMIN: 0,
      ADMIN: 0,
      USER: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (searchParams: UserListParams = {}) => {
    if (!session?.user) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      Object.entries({ ...params, ...searchParams }).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/admin/users?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const data: UserListResponse = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [session, params]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const refreshUsers = useCallback(() => {
    return fetchUsers();
  }, [fetchUsers]);

  const searchUsers = useCallback((searchParams: UserListParams) => {
    return fetchUsers(searchParams);
  }, [fetchUsers]);

  return {
    users,
    pagination,
    stats,
    loading,
    error,
    refreshUsers,
    searchUsers,
  };
}

// Custom hook for managing individual user details
export function useAdminUser(userId: string) {
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!session?.user || !userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user');
      }

      const data: UserDetailResponse = await response.json();
      setUser(data.user);
      setActivityLogs(data.activityLogs);
      setAdminNotes(data.adminNotes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  }, [session, userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const updateUser = useCallback(async (updateData: UpdateUserData): Promise<boolean> => {
    if (!session?.user || !userId) return false;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      const data: UpdateUserResponse = await response.json();
      if (data.success && user) {
        setUser({ ...user, ...data.user });
      }
      
      return data.success;
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
    }
  }, [session, userId, user]);

  const deleteUser = useCallback(async (): Promise<boolean> => {
    if (!session?.user || !userId) return false;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      const data = await response.json();
      return data.success;
    } catch (err) {
      console.error('Error deleting user:', err);
      throw err;
    }
  }, [session, userId]);

  const refreshUser = useCallback(() => {
    return fetchUser();
  }, [fetchUser]);

  return {
    user,
    activityLogs,
    adminNotes,
    loading,
    error,
    updateUser,
    deleteUser,
    refreshUser,
  };
}

// Custom hook for user statistics
export function useAdminUserStats(period: '7d' | '30d' | '90d' | '1y' = '30d') {
  const { data: session } = useSession();
  const [stats, setStats] = useState<UserStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!session?.user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/stats?period=${period}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch statistics');
      }

      const data: UserStatsResponse = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching user statistics:', err);
    } finally {
      setLoading(false);
    }
  }, [session, period]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refreshStats = useCallback(() => {
    return fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refreshStats,
  };
}

// Custom hook for user impersonation
export function useUserImpersonation() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const impersonateUser = useCallback(async (
    userId: string, 
    request: ImpersonationRequest
  ): Promise<ImpersonationResponse | null> => {
    if (!session?.user) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}/impersonate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create impersonation token');
      }

      const data: ImpersonationResponse = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error creating impersonation token:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session]);

  const endImpersonation = useCallback(async (userId: string): Promise<boolean> => {
    if (!session?.user) return false;

    try {
      const response = await fetch(`/api/admin/users/${userId}/impersonate`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to end impersonation');
      }

      const data = await response.json();
      return data.success;
    } catch (err) {
      console.error('Error ending impersonation:', err);
      throw err;
    }
  }, [session]);

  return {
    impersonateUser,
    endImpersonation,
    loading,
    error,
  };
}

// Custom hook for user notes management
export function useUserNotes(userId: string) {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!session?.user || !userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}/notes`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch notes');
      }

      const data = await response.json();
      setNotes(data.notes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  }, [session, userId]);

  const createNote = useCallback(async (request: CreateNoteRequest): Promise<boolean> => {
    if (!session?.user || !userId) return false;

    try {
      const response = await fetch(`/api/admin/users/${userId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create note');
      }

      const data = await response.json();
      if (data.success) {
        await fetchNotes(); // Refresh notes
      }
      
      return data.success;
    } catch (err) {
      console.error('Error creating note:', err);
      throw err;
    }
  }, [session, userId, fetchNotes]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const refreshNotes = useCallback(() => {
    return fetchNotes();
  }, [fetchNotes]);

  return {
    notes,
    loading,
    error,
    createNote,
    refreshNotes,
  };
}

// Custom hook for batch operations
export function useBatchUserOperations() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performBatchOperation = useCallback(async (
    request: BatchActionRequest
  ): Promise<BatchOperationResult | null> => {
    if (!session?.user) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v2/admin/users/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Batch operation failed');
      }

      const data: BatchOperationResult = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error in batch operation:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session]);

  const exportUsers = useCallback(async (
    params: BatchExportParams
  ): Promise<BatchExportResponse | Blob | null> => {
    if (!session?.user) return null;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams(params);
      const response = await fetch(`/api/admin/users/batch?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      if (params.format === 'csv') {
        return await response.blob();
      } else {
        const data: BatchExportResponse = await response.json();
        return data;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error exporting users:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session]);

  return {
    performBatchOperation,
    exportUsers,
    loading,
    error,
  };
}