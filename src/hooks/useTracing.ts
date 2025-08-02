import { useEffect, useState, useCallback } from 'react';
import { ClientTracing } from '@/lib/tracing/client-tracing';

export interface UseTracingReturn {
  correlationId: string;
  generateNewCorrelationId: () => string;
  tracedFetch: typeof ClientTracing.fetch;
  tracedRequest: typeof ClientTracing.request;
  getTrace: (traceId: string) => Promise<any>;
  clearCorrelationId: () => void;
}

export function useTracing(): UseTracingReturn {
  const [correlationId, setCorrelationId] = useState<string>('');

  useEffect(() => {
    // Initialize correlation ID when component mounts
    const id = ClientTracing.getCorrelationId();
    setCorrelationId(id);
  }, []);

  const generateNewCorrelationId = useCallback(() => {
    const newId = ClientTracing.generateCorrelationId();
    setCorrelationId(newId);
    return newId;
  }, []);

  const clearCorrelationId = useCallback(() => {
    ClientTracing.clearCorrelationId();
    setCorrelationId('');
  }, []);

  const getTrace = useCallback(async (traceId: string) => {
    return await ClientTracing.getTrace(traceId);
  }, []);

  return {
    correlationId,
    generateNewCorrelationId,
    tracedFetch: ClientTracing.fetch,
    tracedRequest: ClientTracing.request,
    getTrace,
    clearCorrelationId,
  };
}

// Hook specifically for API calls with automatic tracing
export function useTracedApi() {
  const { correlationId } = useTracing();

  const get = useCallback(async (url: string, headers?: Record<string, string>) => {
    return await ClientTracing.get(url, headers);
  }, []);

  const post = useCallback(async (url: string, data?: any, headers?: Record<string, string>) => {
    return await ClientTracing.post(url, data, headers);
  }, []);

  const put = useCallback(async (url: string, data?: any, headers?: Record<string, string>) => {
    return await ClientTracing.put(url, data, headers);
  }, []);

  const del = useCallback(async (url: string, headers?: Record<string, string>) => {
    return await ClientTracing.delete(url, headers);
  }, []);

  return {
    correlationId,
    get,
    post,
    put,
    delete: del,
  };
}