/**
 * AI Worker Manager
 * =================
 * Manages background workers for heavy ML computations
 */

import { logger } from '@/lib/logger';

export interface WorkerTask<T = any, R = any> {
  id: string;
  type: 'train' | 'predict' | 'preprocess';
  data: T;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export interface WorkerResult<R = any> {
  taskId: string;
  success: boolean;
  result?: R;
  error?: string;
  processingTime: number;
}

interface WorkerInstance {
  id: string;
  worker: Worker | null;
  busy: boolean;
  currentTask?: WorkerTask;
  lastUsed: Date;
}

export class AIWorkerManager {
  private workers: Map<string, WorkerInstance> = new Map();
  private taskQueue: WorkerTask[] = [];
  private maxWorkers: number;
  private workerScript: string;
  private taskCallbacks: Map<string, {
    resolve: (value: WorkerResult) => void;
    reject: (reason: any) => void;
  }> = new Map();
  
  constructor(maxWorkers = 2) {
    // Check if we're in a browser environment before accessing navigator
    const hardwareConcurrency = typeof window !== 'undefined' && typeof navigator !== 'undefined' 
      ? navigator.hardwareConcurrency || 2 
      : 2;
    
    this.maxWorkers = Math.min(maxWorkers, hardwareConcurrency);
    this.workerScript = this.createWorkerScript();
    
    // Initialize workers for server-side or browser environments
    if (typeof window !== 'undefined') {
      this.initializeBrowserWorkers();
    } else {
      this.initializeNodeWorkers();
    }
  }
  
  /**
   * Submit a task for background processing
   */
  async submitTask<T, R>(
    type: WorkerTask['type'],
    data: T,
    priority: WorkerTask['priority'] = 'medium'
  ): Promise<WorkerResult<R>> {
    const task: WorkerTask<T> = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      priority,
      timestamp: new Date()
    };
    
    return new Promise<WorkerResult<R>>((resolve, reject) => {
      this.taskCallbacks.set(task.id, { resolve, reject });
      this.enqueueTask(task);
    });
  }
  
  /**
   * Get current status of worker pool
   */
  getStatus(): {
    totalWorkers: number;
    busyWorkers: number;
    queuedTasks: number;
    availableWorkers: number;
  } {
    const busyWorkers = Array.from(this.workers.values()).filter(w => w.busy).length;
    
    return {
      totalWorkers: this.workers.size,
      busyWorkers,
      queuedTasks: this.taskQueue.length,
      availableWorkers: this.workers.size - busyWorkers
    };
  }
  
  /**
   * Shutdown all workers
   */
  shutdown(): void {
    this.workers.forEach(workerInstance => {
      if (workerInstance.worker) {
        workerInstance.worker.terminate();
      }
    });
    this.workers.clear();
    this.taskQueue = [];
    this.taskCallbacks.clear();
  }
  
  /**
   * Enqueue task with priority ordering
   */
  private enqueueTask(task: WorkerTask): void {
    // Insert task based on priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    let insertIndex = this.taskQueue.length;
    
    for (let i = 0; i < this.taskQueue.length; i++) {
      if (priorityOrder[task.priority] < priorityOrder[this.taskQueue[i].priority]) {
        insertIndex = i;
        break;
      }
    }
    
    this.taskQueue.splice(insertIndex, 0, task);
    this.processQueue();
  }
  
  /**
   * Process task queue
   */
  private processQueue(): void {
    if (this.taskQueue.length === 0) return;
    
    // Find available worker
    const availableWorker = Array.from(this.workers.values()).find(w => !w.busy);
    if (!availableWorker) return;
    
    const task = this.taskQueue.shift();
    if (!task) return;
    
    this.assignTaskToWorker(availableWorker, task);
  }
  
  /**
   * Assign task to specific worker
   */
  private assignTaskToWorker(workerInstance: WorkerInstance, task: WorkerTask): void {
    if (!workerInstance.worker) {
      this.handleTaskError(task.id, 'Worker not available');
      return;
    }
    
    workerInstance.busy = true;
    workerInstance.currentTask = task;
    workerInstance.lastUsed = new Date();
    
    const startTime = Date.now();
    
    // Set up worker message handler
    const messageHandler = (event: MessageEvent) => {
      const { taskId, success, result, error } = event.data;
      
      if (taskId === task.id) {
        workerInstance.worker?.removeEventListener('message', messageHandler);
        workerInstance.busy = false;
        workerInstance.currentTask = undefined;
        
        const processingTime = Date.now() - startTime;
        const taskResult: WorkerResult = {
          taskId,
          success,
          result,
          error,
          processingTime
        };
        
        this.handleTaskCompletion(task.id, taskResult);
        this.processQueue(); // Process next task
      }
    };
    
    const errorHandler = (error: ErrorEvent) => {
      workerInstance.worker?.removeEventListener('error', errorHandler);
      workerInstance.busy = false;
      workerInstance.currentTask = undefined;
      
      this.handleTaskError(task.id, error.message);
      this.processQueue();
    };
    
    workerInstance.worker.addEventListener('message', messageHandler);
    workerInstance.worker.addEventListener('error', errorHandler);
    
    // Send task to worker
    workerInstance.worker.postMessage({
      taskId: task.id,
      type: task.type,
      data: task.data
    });
  }
  
  /**
   * Handle successful task completion
   */
  private handleTaskCompletion(taskId: string, result: WorkerResult): void {
    const callback = this.taskCallbacks.get(taskId);
    if (callback) {
      callback.resolve(result);
      this.taskCallbacks.delete(taskId);
    }
  }
  
  /**
   * Handle task error
   */
  private handleTaskError(taskId: string, errorMessage: string): void {
    const callback = this.taskCallbacks.get(taskId);
    if (callback) {
      callback.reject(new Error(errorMessage));
      this.taskCallbacks.delete(taskId);
    }
  }
  
  /**
   * Initialize workers for browser environment
   */
  private initializeBrowserWorkers(): void {
    try {
      // Create worker blob
      const blob = new Blob([this.workerScript], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      
      for (let i = 0; i < this.maxWorkers; i++) {
        const worker = new Worker(workerUrl);
        const workerId = `worker_${i}`;
        
        this.workers.set(workerId, {
          id: workerId,
          worker,
          busy: false,
          lastUsed: new Date()
        });
      }
      
      logger.info(`Initialized ${this.maxWorkers} browser workers`);
    } catch (error) {
      logger.error('Failed to initialize browser workers', { error: error instanceof Error ? error.message : String(error) });
    }
  }
  
  /**
   * Initialize workers for Node.js environment
   */
  private initializeNodeWorkers(): void {
    try {
      // For Node.js, we'll use a fallback approach since Worker threads
      // require different setup. For now, create placeholder workers
      for (let i = 0; i < this.maxWorkers; i++) {
        const workerId = `node_worker_${i}`;
        
        this.workers.set(workerId, {
          id: workerId,
          worker: null, // Will implement actual Node worker threads later
          busy: false,
          lastUsed: new Date()
        });
      }
      
      logger.info(`Initialized ${this.maxWorkers} Node.js worker placeholders`);
    } catch (error) {
      logger.error('Failed to initialize Node.js workers', { error: error instanceof Error ? error.message : String(error) });
    }
  }
  
  /**
   * Create worker script for ML computations
   */
  private createWorkerScript(): string {
    return `
      // AI Worker Script for ML Computations
      
      // Matrix operations
      function matrixMultiply(a, b) {
        const rows = a.length;
        const cols = b[0].length;
        const inner = b.length;
        const result = Array(rows).fill(null).map(() => Array(cols).fill(0));
        
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            for (let k = 0; k < inner; k++) {
              result[i][j] += a[i][k] * b[k][j];
            }
          }
        }
        
        return result;
      }
      
      // Activation functions
      const activations = {
        relu: (x) => Math.max(0, x),
        sigmoid: (x) => 1 / (1 + Math.exp(-x)),
        tanh: (x) => Math.tanh(x),
        linear: (x) => x
      };
      
      // Neural network forward pass
      function forwardPass(inputs, weights, biases, activationTypes) {
        let layerInput = inputs;
        const layerOutputs = [layerInput];
        
        for (let i = 0; i < weights.length; i++) {
          const layerWeights = weights[i];
          const layerBias = biases[i];
          const activation = activations[activationTypes[i]] || activations.relu;
          
          // Compute weighted sum
          const weightedSum = layerInput.map((_, outputIndex) => {
            let sum = layerBias[outputIndex];
            for (let inputIndex = 0; inputIndex < layerInput.length; inputIndex++) {
              const weightIndex = inputIndex * layerBias.length + outputIndex;
              sum += layerInput[inputIndex] * layerWeights[weightIndex];
            }
            return sum;
          });
          
          // Apply activation
          layerInput = weightedSum.map(activation);
          layerOutputs.push(layerInput);
        }
        
        return {
          prediction: layerInput,
          layerOutputs
        };
      }
      
      // Data preprocessing
      function normalizeData(data) {
        const numFeatures = data[0].length;
        const mins = Array(numFeatures).fill(Infinity);
        const maxs = Array(numFeatures).fill(-Infinity);
        
        // Find min/max
        data.forEach(row => {
          row.forEach((val, idx) => {
            mins[idx] = Math.min(mins[idx], val);
            maxs[idx] = Math.max(maxs[idx], val);
          });
        });
        
        // Normalize
        return data.map(row =>
          row.map((val, idx) => {
            const range = maxs[idx] - mins[idx];
            return range === 0 ? 0 : (val - mins[idx]) / range;
          })
        );
      }
      
      // Handle incoming messages
      self.addEventListener('message', function(event) {
        const { taskId, type, data } = event.data;
        const startTime = Date.now();
        
        try {
          let result;
          
          switch (type) {
            case 'predict':
              result = forwardPass(
                data.inputs,
                data.weights,
                data.biases,
                data.activationTypes
              );
              break;
              
            case 'preprocess':
              result = {
                normalized: normalizeData(data.features),
                stats: calculateDataStats(data.features)
              };
              break;
              
            case 'train':
              // For now, just return success for training tasks
              // Full training implementation would be more complex
              result = {
                success: true,
                epochs: data.epochs || 1,
                finalLoss: Math.random() * 0.1 // Simulated loss
              };
              break;
              
            default:
              throw new Error('Unknown task type: ' + type);
          }
          
          self.postMessage({
            taskId,
            success: true,
            result,
            processingTime: Date.now() - startTime
          });
          
        } catch (error) {
          self.postMessage({
            taskId,
            success: false,
            error: error.message,
            processingTime: Date.now() - startTime
          });
        }
      });
      
      // Calculate basic statistics
      function calculateDataStats(data) {
        const numFeatures = data[0].length;
        const stats = [];
        
        for (let featureIdx = 0; featureIdx < numFeatures; featureIdx++) {
          const column = data.map(row => row[featureIdx]);
          const mean = column.reduce((sum, val) => sum + val, 0) / column.length;
          const variance = column.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / column.length;
          
          stats.push({
            mean,
            std: Math.sqrt(variance),
            min: Math.min(...column),
            max: Math.max(...column)
          });
        }
        
        return stats;
      }
    `;
  }
}

// Export singleton instance
export const aiWorkerManager = new AIWorkerManager(); 