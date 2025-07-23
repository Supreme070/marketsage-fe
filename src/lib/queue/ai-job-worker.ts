/**
 * AI Job Worker
 * 
 * Worker process that handles AI job execution from the job queue
 * Supports concurrent processing and automatic retries
 */

import { aiJobQueue, type AIJobData } from './ai-job-queue';
import { SupremeAIv3 } from '../ai/supreme-ai-v3-engine';
import { logger } from '../logger';

export class AIJobWorker {
  private isRunning = false;
  private workerId: string;
  private processingCount = 0;
  private maxConcurrency = 3; // Maximum concurrent jobs
  private pollInterval = 1000; // Poll every second
  private shutdownTimeout = 30000; // 30 seconds to gracefully shutdown

  constructor(workerId?: string) {
    this.workerId = workerId || `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start the worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn(`⚠️  Worker ${this.workerId} is already running`);
      return;
    }

    this.isRunning = true;
    console.log(`🚀 AI Job Worker started: ${this.workerId}`);
    
    // Start the main processing loop
    this.processJobs();
    
    // Setup graceful shutdown
    this.setupGracefulShutdown();
  }

  /**
   * Stop the worker
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.warn(`⚠️  Worker ${this.workerId} is not running`);
      return;
    }

    console.log(`🛑 Stopping AI Job Worker: ${this.workerId}`);
    this.isRunning = false;

    // Wait for current jobs to complete
    const startTime = Date.now();
    while (this.processingCount > 0 && (Date.now() - startTime) < this.shutdownTimeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (this.processingCount > 0) {
      console.warn(`⚠️  Worker ${this.workerId} stopped with ${this.processingCount} jobs still processing`);
    } else {
      console.log(`✅ Worker ${this.workerId} stopped gracefully`);
    }
  }

  /**
   * Main job processing loop
   */
  private async processJobs(): Promise<void> {
    while (this.isRunning) {
      try {
        // Check if we can process more jobs
        if (this.processingCount < this.maxConcurrency) {
          const job = await aiJobQueue.getNextJob();
          
          if (job) {
            // Process job concurrently
            this.processingCount++;
            this.processJob(job)
              .finally(() => {
                this.processingCount--;
              });
          } else {
            // No jobs available, wait before polling again
            await new Promise(resolve => setTimeout(resolve, this.pollInterval));
          }
        } else {
          // At max capacity, wait before checking again
          await new Promise(resolve => setTimeout(resolve, this.pollInterval));
        }
      } catch (error) {
        console.error(`Error in worker ${this.workerId}:`, error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds on error
      }
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: AIJobData): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Worker ${this.workerId} processing job: ${job.id} (${job.type})`);
      
      // Update job with worker ID
      job.workerId = this.workerId;
      
      let result: any;
      
      // Process based on job type
      switch (job.type) {
        case 'analysis':
          result = await this.processAnalysisJob(job);
          break;
          
        case 'prediction':
          result = await this.processPredictionJob(job);
          break;
          
        case 'task_execution':
          result = await this.processTaskExecutionJob(job);
          break;
          
        case 'content_generation':
          result = await this.processContentGenerationJob(job);
          break;
          
        case 'workflow_execution':
          result = await this.processWorkflowExecutionJob(job);
          break;
          
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }
      
      // Mark job as completed
      await aiJobQueue.completeJob(job.id, result);
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ Worker ${this.workerId} completed job: ${job.id} in ${processingTime}ms`);
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`❌ Worker ${this.workerId} failed job: ${job.id} after ${processingTime}ms:`, errorMessage);
      
      // Mark job as failed
      await aiJobQueue.failJob(job.id, errorMessage);
      
      // Log error for monitoring
      logger.error('AI Job processing error', {
        workerId: this.workerId,
        jobId: job.id,
        jobType: job.type,
        error: errorMessage,
        processingTime,
        userId: job.payload.userId
      });
    }
  }

  /**
   * Process analysis job
   */
  private async processAnalysisJob(job: AIJobData): Promise<any> {
    const { input, userId } = job.payload;
    
    const task = {
      type: 'analyze',
      userId,
      data: input,
      enableTaskExecution: false
    };
    
    const result = await SupremeAIv3.process(task);
    
    if (!result.success) {
      throw new Error(result.error || 'Analysis failed');
    }
    
    return {
      type: 'analysis',
      result: result.data,
      confidence: result.confidence,
      processingTime: Date.now() - new Date(job.createdAt).getTime()
    };
  }

  /**
   * Process prediction job
   */
  private async processPredictionJob(job: AIJobData): Promise<any> {
    const { input, userId } = job.payload;
    
    const task = {
      type: 'predict',
      userId,
      features: input.features,
      targets: input.targets,
      enableTaskExecution: false
    };
    
    const result = await SupremeAIv3.process(task);
    
    if (!result.success) {
      throw new Error(result.error || 'Prediction failed');
    }
    
    return {
      type: 'prediction',
      predictions: result.data,
      confidence: result.confidence,
      processingTime: Date.now() - new Date(job.createdAt).getTime()
    };
  }

  /**
   * Process task execution job
   */
  private async processTaskExecutionJob(job: AIJobData): Promise<any> {
    const { input, userId } = job.payload;
    
    const task = {
      type: 'task',
      userId,
      question: input.question || input.task,
      enableTaskExecution: true,
      context: input.context
    };
    
    const result = await SupremeAIv3.process(task);
    
    if (!result.success) {
      throw new Error(result.error || 'Task execution failed');
    }
    
    return {
      type: 'task_execution',
      result: result.data,
      taskExecution: result.data?.taskExecution,
      confidence: result.confidence,
      processingTime: Date.now() - new Date(job.createdAt).getTime()
    };
  }

  /**
   * Process content generation job
   */
  private async processContentGenerationJob(job: AIJobData): Promise<any> {
    const { input, userId } = job.payload;
    
    const task = {
      type: 'content',
      userId,
      content: input.prompt,
      context: input.context,
      enableTaskExecution: false
    };
    
    const result = await SupremeAIv3.process(task);
    
    if (!result.success) {
      throw new Error(result.error || 'Content generation failed');
    }
    
    return {
      type: 'content_generation',
      content: result.data,
      confidence: result.confidence,
      processingTime: Date.now() - new Date(job.createdAt).getTime()
    };
  }

  /**
   * Process workflow execution job
   */
  private async processWorkflowExecutionJob(job: AIJobData): Promise<any> {
    const { input, userId } = job.payload;
    
    // This would integrate with the workflow engine
    // For now, we'll use a simple task execution
    const task = {
      type: 'task',
      userId,
      question: `Execute workflow: ${input.workflowId}`,
      enableTaskExecution: true,
      context: {
        workflowId: input.workflowId,
        workflowData: input.data
      }
    };
    
    const result = await SupremeAIv3.process(task);
    
    if (!result.success) {
      throw new Error(result.error || 'Workflow execution failed');
    }
    
    return {
      type: 'workflow_execution',
      workflowId: input.workflowId,
      result: result.data,
      confidence: result.confidence,
      processingTime: Date.now() - new Date(job.createdAt).getTime()
    };
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async () => {
      console.log(`🛑 Received shutdown signal for worker: ${this.workerId}`);
      await this.stop();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    process.on('SIGQUIT', shutdown);
  }

  /**
   * Get worker status
   */
  getStatus() {
    return {
      workerId: this.workerId,
      isRunning: this.isRunning,
      processingCount: this.processingCount,
      maxConcurrency: this.maxConcurrency
    };
  }
}

// Worker Manager class for managing multiple workers
export class AIWorkerManager {
  private workers: AIJobWorker[] = [];
  private workerCount: number;

  constructor(workerCount = 2) {
    this.workerCount = workerCount;
  }

  /**
   * Start all workers
   */
  async startWorkers(): Promise<void> {
    console.log(`🚀 Starting ${this.workerCount} AI job workers...`);
    
    for (let i = 0; i < this.workerCount; i++) {
      const worker = new AIJobWorker(`worker-${i + 1}`);
      this.workers.push(worker);
      await worker.start();
    }
    
    console.log(`✅ All ${this.workerCount} AI job workers started`);
  }

  /**
   * Stop all workers
   */
  async stopWorkers(): Promise<void> {
    console.log(`🛑 Stopping ${this.workers.length} AI job workers...`);
    
    const stopPromises = this.workers.map(worker => worker.stop());
    await Promise.all(stopPromises);
    
    this.workers = [];
    console.log(`✅ All AI job workers stopped`);
  }

  /**
   * Get status of all workers
   */
  getWorkersStatus() {
    return this.workers.map(worker => worker.getStatus());
  }

  /**
   * Add a worker
   */
  async addWorker(): Promise<void> {
    const workerId = `worker-${this.workers.length + 1}`;
    const worker = new AIJobWorker(workerId);
    this.workers.push(worker);
    await worker.start();
    console.log(`✅ Added new AI job worker: ${workerId}`);
  }

  /**
   * Remove a worker
   */
  async removeWorker(): Promise<void> {
    if (this.workers.length === 0) {
      console.warn('⚠️  No workers to remove');
      return;
    }
    
    const worker = this.workers.pop()!;
    await worker.stop();
    console.log(`✅ Removed AI job worker: ${worker.getStatus().workerId}`);
  }
}

// Export singleton instances
export const aiJobWorker = new AIJobWorker();
export const aiWorkerManager = new AIWorkerManager();