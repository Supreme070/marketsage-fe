/**
 * Analytics Worker Hook
 * 
 * React hook for managing Web Worker communication for heavy analytics processing.
 * Provides a clean interface for offloading computationally intensive tasks.
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { AnalyticsWorkerMessage, AnalyticsWorkerResponse } from '@/workers/analytics-worker';

interface WorkerTask {
  id: string;
  type: string;
  promise: {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  };
  startTime: number;
  options: any;
}

interface AnalyticsWorkerState {
  isLoading: boolean;
  error: string | null;
  progress: number;
  activeTasks: number;
  processingTime: number;
  workerReady: boolean;
}

export function useAnalyticsWorker() {
  const workerRef = useRef<Worker | null>(null);
  const tasksRef = useRef<Map<string, WorkerTask>>(new Map());
  const [state, setState] = useState<AnalyticsWorkerState>({
    isLoading: false,
    error: null,
    progress: 0,
    activeTasks: 0,
    processingTime: 0,
    workerReady: false
  });

  // Initialize worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Worker' in window) {
      try {
        workerRef.current = new Worker(
          new URL('../workers/analytics-worker.ts', import.meta.url),
          { type: 'module' }
        );

        workerRef.current.onmessage = (event: MessageEvent<AnalyticsWorkerResponse>) => {
          const { id, type, result, error, progress, timestamp } = event.data;
          const task = tasksRef.current.get(id);

          if (task) {
            if (progress !== undefined) {
              // Progress update
              setState(prev => ({
                ...prev,
                progress,
                processingTime: timestamp - task.startTime
              }));
            } else if (error) {
              // Error
              task.promise.reject(new Error(error));
              tasksRef.current.delete(id);
              setState(prev => ({
                ...prev,
                isLoading: prev.activeTasks <= 1 ? false : prev.isLoading,
                error,
                activeTasks: prev.activeTasks - 1,
                progress: 0
              }));
            } else if (result) {
              // Success
              task.promise.resolve(result);
              tasksRef.current.delete(id);
              setState(prev => ({
                ...prev,
                isLoading: prev.activeTasks <= 1 ? false : prev.isLoading,
                error: null,
                activeTasks: prev.activeTasks - 1,
                progress: 100,
                processingTime: result.processingTime || 0
              }));
            }
          }
        };

        workerRef.current.onerror = (error) => {
          console.error('Analytics worker error:', error);
          setState(prev => ({
            ...prev,
            error: 'Worker error occurred',
            workerReady: false
          }));
        };

        workerRef.current.onmessageerror = (error) => {
          console.error('Analytics worker message error:', error);
          setState(prev => ({
            ...prev,
            error: 'Worker communication error',
            workerReady: false
          }));
        };

        setState(prev => ({ ...prev, workerReady: true }));

      } catch (error) {
        console.error('Failed to initialize analytics worker:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to initialize worker',
          workerReady: false
        }));
      }
    } else {
      setState(prev => ({
        ...prev,
        error: 'Web Workers not supported',
        workerReady: false
      }));
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      tasksRef.current.clear();
    };
  }, []);

  // Generic task execution
  const executeTask = useCallback(async <T>(
    type: string,
    data: any,
    options: any = {}
  ): Promise<T> => {
    if (!workerRef.current || !state.workerReady) {
      throw new Error('Analytics worker not available');
    }

    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const task: WorkerTask = {
        id,
        type,
        promise: { resolve, reject },
        startTime,
        options
      };

      tasksRef.current.set(id, task);

      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        activeTasks: prev.activeTasks + 1,
        progress: 0
      }));

      const message: AnalyticsWorkerMessage = {
        id,
        type: type as any,
        data,
        options
      };

      workerRef.current!.postMessage(message);

      // Set timeout for long-running tasks
      const timeout = options.timeout || 30000; // 30 seconds default
      setTimeout(() => {
        if (tasksRef.current.has(id)) {
          tasksRef.current.delete(id);
          reject(new Error('Task timeout'));
          setState(prev => ({
            ...prev,
            isLoading: prev.activeTasks <= 1 ? false : prev.isLoading,
            error: 'Task timeout',
            activeTasks: prev.activeTasks - 1,
            progress: 0
          }));
        }
      }, timeout);
    });
  }, [state.workerReady]);

  // Specific analytics functions
  const segmentVisitors = useCallback(async (visitors: any[], criteria: any) => {
    return executeTask('segment_visitors', { visitors, criteria });
  }, [executeTask]);

  const calculateStatistics = useCallback(async (values: number[]) => {
    return executeTask('calculate_stats', { values });
  }, [executeTask]);

  const predictChurn = useCallback(async (visitors: any[]) => {
    return executeTask('predict_churn', { visitors });
  }, [executeTask]);

  const analyzePatterns = useCallback(async (visitors: any[]) => {
    return executeTask('analyze_patterns', { visitors });
  }, [executeTask]);

  const processFunnel = useCallback(async (visitors: any[], steps: string[]) => {
    return executeTask('process_funnel', { visitors, steps });
  }, [executeTask]);

  // Batch processing
  const processBatch = useCallback(async (tasks: Array<{
    type: string;
    data: any;
    options?: any;
  }>) => {
    const promises = tasks.map(task => 
      executeTask(task.type, task.data, task.options)
    );
    return Promise.all(promises);
  }, [executeTask]);

  // Cancel all tasks
  const cancelAllTasks = useCallback(() => {
    tasksRef.current.forEach((task, id) => {
      task.promise.reject(new Error('Task cancelled'));
    });
    tasksRef.current.clear();
    setState(prev => ({
      ...prev,
      isLoading: false,
      activeTasks: 0,
      progress: 0
    }));
  }, []);

  // Get worker performance metrics
  const getPerformanceMetrics = useCallback(() => {
    return {
      activeTasks: state.activeTasks,
      isLoading: state.isLoading,
      processingTime: state.processingTime,
      workerReady: state.workerReady,
      error: state.error,
      progress: state.progress
    };
  }, [state]);

  return {
    // State
    isLoading: state.isLoading,
    error: state.error,
    progress: state.progress,
    activeTasks: state.activeTasks,
    processingTime: state.processingTime,
    workerReady: state.workerReady,
    
    // Analytics functions
    segmentVisitors,
    calculateStatistics,
    predictChurn,
    analyzePatterns,
    processFunnel,
    
    // Utility functions
    executeTask,
    processBatch,
    cancelAllTasks,
    getPerformanceMetrics
  };
}

// Performance monitoring hook
export function useAnalyticsPerformance() {
  const [metrics, setMetrics] = useState({
    memoryUsage: 0,
    taskCount: 0,
    averageProcessingTime: 0,
    errorRate: 0,
    throughput: 0
  });

  const updateMetrics = useCallback((newMetrics: Partial<typeof metrics>) => {
    setMetrics(prev => ({ ...prev, ...newMetrics }));
  }, []);

  // Memory monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / memory.jsHeapSizeLimit
        }));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    updateMetrics
  };
}

// Batch processing hook for large datasets
export function useBatchProcessor() {
  const { executeTask, workerReady } = useAnalyticsWorker();
  const [batchState, setBatchState] = useState({
    isProcessing: false,
    currentBatch: 0,
    totalBatches: 0,
    progress: 0,
    results: [] as any[]
  });

  const processBatches = useCallback(async (
    data: any[],
    taskType: string,
    batchSize = 100,
    options: any = {}
  ) => {
    if (!workerReady) {
      throw new Error('Worker not ready');
    }

    const batches = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }

    setBatchState({
      isProcessing: true,
      currentBatch: 0,
      totalBatches: batches.length,
      progress: 0,
      results: []
    });

    const results = [];
    for (let i = 0; i < batches.length; i++) {
      try {
        const batchResult = await executeTask(taskType, batches[i], options);
        results.push(batchResult);
        
        setBatchState(prev => ({
          ...prev,
          currentBatch: i + 1,
          progress: ((i + 1) / batches.length) * 100,
          results: [...prev.results, batchResult]
        }));
      } catch (error) {
        console.error(`Batch ${i + 1} failed:`, error);
        // Continue with other batches
      }
    }

    setBatchState(prev => ({
      ...prev,
      isProcessing: false,
      progress: 100
    }));

    return results;
  }, [executeTask, workerReady]);

  return {
    batchState,
    processBatches
  };
}

export default useAnalyticsWorker;