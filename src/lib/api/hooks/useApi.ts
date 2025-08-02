'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../client';
import type { ApiClientError } from '../base/api-client';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiClientError | null;
  refetch: () => Promise<void>;
  mutate: (newData: T) => void;
}

export interface UseApiOptions {
  immediate?: boolean;
  cacheKey?: string;
  retryOnError?: boolean;
  retryDelay?: number;
  maxRetries?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiClientError) => void;
}

/**
 * Custom hook for API calls with loading states, error handling, and caching
 */
export function useApi<T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions = {}
): UseApiState<T> {
  const {
    immediate = true,
    cacheKey,
    retryOnError = false,
    retryDelay = 1000,
    maxRetries = 3,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<ApiClientError | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef<number>(0);

  const executeCall = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.executeWithRetry(apiCall, {
        cacheKey,
      });

      if (!abortControllerRef.current.signal.aborted) {
        setData(result);
        retryCountRef.current = 0;
        
        if (onSuccess) {
          onSuccess(result);
        }
      }
    } catch (err) {
      if (!abortControllerRef.current.signal.aborted) {
        const apiError = err as ApiClientError;
        setError(apiError);

        if (onError) {
          onError(apiError);
        }

        // Retry logic
        if (retryOnError && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          setTimeout(() => {
            executeCall();
          }, retryDelay * Math.pow(2, retryCountRef.current - 1));
        }
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [apiCall, cacheKey, retryOnError, retryDelay, maxRetries, onSuccess, onError]);

  const refetch = useCallback(async () => {
    await executeCall();
  }, [executeCall]);

  const mutate = useCallback((newData: T) => {
    setData(newData);
    setError(null);
  }, []);

  useEffect(() => {
    if (immediate) {
      executeCall();
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [immediate, executeCall]);

  return {
    data,
    loading,
    error,
    refetch,
    mutate,
  };
}

/**
 * Hook for mutations (POST, PUT, DELETE operations)
 */
export function useMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: ApiClientError, variables: TVariables) => void;
    onSettled?: (data: TData | undefined, error: ApiClientError | null, variables: TVariables) => void;
  } = {}
) {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiClientError | null>(null);

  const mutate = useCallback(
    async (variables: TVariables) => {
      try {
        setLoading(true);
        setError(null);

        const result = await mutationFn(variables);
        setData(result);

        if (options.onSuccess) {
          options.onSuccess(result, variables);
        }

        return result;
      } catch (err) {
        const apiError = err as ApiClientError;
        setError(apiError);

        if (options.onError) {
          options.onError(apiError, variables);
        }

        throw apiError;
      } finally {
        setLoading(false);
        
        if (options.onSettled) {
          options.onSettled(data, error, variables);
        }
      }
    },
    [mutationFn, options, data, error]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    mutate,
    data,
    loading,
    error,
    reset,
  };
}

/**
 * Hook for paginated data
 */
export function usePaginatedApi<T>(
  apiCall: (page: number, limit: number) => Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>,
  options: {
    initialPage?: number;
    pageSize?: number;
    cacheKey?: string;
  } = {}
) {
  const { initialPage = 1, pageSize = 10, cacheKey } = options;
  
  const [page, setPage] = useState(initialPage);
  const [allData, setAllData] = useState<T[]>([]);
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: pageSize,
    total: 0,
    pages: 0,
  });

  const {
    data: currentPageData,
    loading,
    error,
    refetch,
  } = useApi(
    () => apiCall(page, pageSize),
    {
      cacheKey: cacheKey ? `${cacheKey}_page_${page}_limit_${pageSize}` : undefined,
    }
  );

  useEffect(() => {
    if (currentPageData) {
      setAllData(prev => {
        // Replace data for current page
        const newData = [...prev];
        const startIndex = (page - 1) * pageSize;
        
        // Clear existing data for this page range
        for (let i = 0; i < pageSize; i++) {
          const index = startIndex + i;
          if (index < newData.length) {
            newData.splice(index, 1);
          }
        }
        
        // Insert new data
        newData.splice(startIndex, 0, ...currentPageData.data);
        
        return newData;
      });
      
      setPagination(currentPageData.pagination);
    }
  }, [currentPageData, page, pageSize]);

  const nextPage = useCallback(() => {
    if (page < pagination.pages) {
      setPage(prev => prev + 1);
    }
  }, [page, pagination.pages]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  }, [page]);

  const goToPage = useCallback((targetPage: number) => {
    if (targetPage >= 1 && targetPage <= pagination.pages) {
      setPage(targetPage);
    }
  }, [pagination.pages]);

  const loadMore = useCallback(() => {
    if (page < pagination.pages) {
      setPage(prev => prev + 1);
    }
  }, [page, pagination.pages]);

  return {
    data: allData,
    currentPageData: currentPageData?.data || [],
    loading,
    error,
    pagination,
    page,
    nextPage,
    prevPage,
    goToPage,
    loadMore,
    refetch,
    hasNextPage: page < pagination.pages,
    hasPrevPage: page > 1,
  };
}

/**
 * Hook for infinite scrolling/loading
 */
export function useInfiniteApi<T>(
  apiCall: (page: number, limit: number) => Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>,
  options: {
    pageSize?: number;
    cacheKey?: string;
  } = {}
) {
  const { pageSize = 10, cacheKey } = options;
  
  const [pages, setPages] = useState<T[][]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiClientError | null>(null);

  const loadNextPage = useCallback(async () => {
    if (loading || !hasNextPage) return;

    try {
      setLoading(true);
      setError(null);

      const result = await apiCall(currentPage, pageSize);
      
      setPages(prev => [...prev, result.data]);
      setHasNextPage(currentPage < result.pagination.pages);
      setCurrentPage(prev => prev + 1);
    } catch (err) {
      setError(err as ApiClientError);
    } finally {
      setLoading(false);
    }
  }, [apiCall, currentPage, pageSize, loading, hasNextPage]);

  const reset = useCallback(() => {
    setPages([]);
    setCurrentPage(1);
    setHasNextPage(true);
    setError(null);
  }, []);

  // Load first page on mount
  useEffect(() => {
    if (pages.length === 0) {
      loadNextPage();
    }
  }, [pages.length, loadNextPage]);

  const allData = pages.flat();

  return {
    data: allData,
    loading,
    error,
    hasNextPage,
    loadNextPage,
    reset,
    totalPages: pages.length,
  };
}