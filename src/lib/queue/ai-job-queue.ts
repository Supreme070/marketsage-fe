/**
 * AI Job Queue System
 * 
 * Redis-based job queue for handling asynchronous AI operations
 * Supports parallel processing, retries, and job monitoring
 */

import { redisCache } from '../cache/redis-client';
import { v4 as uuidv4 } from 'uuid';

export interface AIJobData {
  id: string;
  type: 'analysis' | 'prediction' | 'task_execution' | 'content_generation' | 'workflow_execution';
  payload: {
    userId: string;
    organizationId?: string;
    taskId?: string;
    input: any;
    options?: {
      priority?: 'low' | 'medium' | 'high' | 'critical';
      maxRetries?: number;
      timeout?: number;
      dependencies?: string[];
      scheduledFor?: Date;
    };
  };
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  retries: number;
  maxRetries: number;
  error?: string;
  result?: any;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  processingTime?: number;
  workerId?: string;
}

export interface AIJobStats {
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProcessingTime: number;
  throughput: number; // jobs per minute
  errorRate: number;
}

export class AIJobQueue {
  private readonly QUEUE_KEY = 'ai-job-queue';
  private readonly PROCESSING_KEY = 'ai-jobs-processing';
  private readonly COMPLETED_KEY = 'ai-jobs-completed';
  private readonly FAILED_KEY = 'ai-jobs-failed';
  private readonly STATS_KEY = 'ai-job-stats';
  
  private readonly PRIORITY_WEIGHTS = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4
  };

  /**
   * Add a new AI job to the queue
   */
  async addJob(
    type: AIJobData['type'],
    payload: AIJobData['payload'],
    options: AIJobData['payload']['options'] = {}
  ): Promise<string> {
    const jobId = uuidv4();
    
    const job: AIJobData = {
      id: jobId,
      type,
      payload: {
        ...payload,
        options: {
          priority: 'medium',
          maxRetries: 3,
          timeout: 300000, // 5 minutes default
          ...options
        }
      },
      status: 'pending',
      priority: options.priority || 'medium',
      retries: 0,
      maxRetries: options.maxRetries || 3,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store job data
    await redisCache.set(`job:${jobId}`, job, 3600); // 1 hour TTL
    
    // Add to priority queue
    const score = this.calculatePriorityScore(job);
    await this.addToQueue(jobId, score);
    
    // Update stats
    await this.updateStats('pending', 1);
    
    console.log(`📋 AI Job queued: ${jobId} (${type}, priority: ${job.priority})`);
    
    return jobId;
  }

  /**
   * Get the next job from the queue
   */
  async getNextJob(): Promise<AIJobData | null> {
    try {
      // Get highest priority job
      const result = await this.getFromQueue();
      if (!result) return null;
      
      const { jobId, score } = result;
      
      // Get job data
      const job = await redisCache.get<AIJobData>(`job:${jobId}`);
      if (!job) {
        console.warn(`⚠️  Job ${jobId} not found in cache`);
        return null;
      }
      
      // Mark as processing
      job.status = 'processing';
      job.startedAt = new Date();
      job.updatedAt = new Date();
      job.workerId = `worker-${Date.now()}`;
      
      // Update job data
      await redisCache.set(`job:${jobId}`, job, 3600);
      
      // Move to processing queue
      await this.moveToProcessing(jobId);
      
      // Update stats
      await this.updateStats('pending', -1);
      await this.updateStats('processing', 1);
      
      console.log(`🔄 AI Job processing started: ${jobId}`);
      
      return job;
      
    } catch (error) {
      console.error('Error getting next job:', error);
      return null;
    }
  }

  /**
   * Mark job as completed
   */
  async completeJob(jobId: string, result: any): Promise<void> {
    try {
      const job = await redisCache.get<AIJobData>(`job:${jobId}`);
      if (!job) {
        console.warn(`⚠️  Job ${jobId} not found for completion`);
        return;
      }
      
      const processingTime = job.startedAt 
        ? Date.now() - job.startedAt.getTime()
        : 0;
      
      // Update job status
      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date();
      job.updatedAt = new Date();
      job.processingTime = processingTime;
      
      // Save completed job
      await redisCache.set(`job:${jobId}`, job, 86400); // 24 hours for completed jobs
      
      // Remove from processing, add to completed
      await this.removeFromProcessing(jobId);
      await this.addToCompleted(jobId);
      
      // Update stats
      await this.updateStats('processing', -1);
      await this.updateStats('completed', 1);
      await this.updateProcessingTime(processingTime);
      
      console.log(`✅ AI Job completed: ${jobId} (${processingTime}ms)`);
      
    } catch (error) {
      console.error('Error completing job:', error);
    }
  }

  /**
   * Mark job as failed
   */
  async failJob(jobId: string, error: string): Promise<void> {
    try {
      const job = await redisCache.get<AIJobData>(`job:${jobId}`);
      if (!job) {
        console.warn(`⚠️  Job ${jobId} not found for failure`);
        return;
      }
      
      job.retries++;
      job.error = error;
      job.updatedAt = new Date();
      
      // Check if we should retry
      if (job.retries < job.maxRetries) {
        // Retry with backoff
        const delay = Math.pow(2, job.retries) * 1000; // Exponential backoff
        job.status = 'pending';
        
        // Re-queue with delay
        setTimeout(async () => {
          const score = this.calculatePriorityScore(job);
          await this.addToQueue(jobId, score);
          await this.removeFromProcessing(jobId);
          
          // Update stats
          await this.updateStats('processing', -1);
          await this.updateStats('pending', 1);
          
          console.log(`🔄 AI Job retry queued: ${jobId} (attempt ${job.retries})`);
        }, delay);
        
      } else {
        // Max retries reached
        job.status = 'failed';
        job.completedAt = new Date();
        
        // Move to failed queue
        await this.removeFromProcessing(jobId);
        await this.addToFailed(jobId);
        
        // Update stats
        await this.updateStats('processing', -1);
        await this.updateStats('failed', 1);
        
        console.error(`❌ AI Job failed permanently: ${jobId} - ${error}`);
      }
      
      // Update job data
      await redisCache.set(`job:${jobId}`, job, 3600);
      
    } catch (error) {
      console.error('Error failing job:', error);
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<AIJobData | null> {
    return await redisCache.get<AIJobData>(`job:${jobId}`);
  }

  /**
   * Get job statistics
   */
  async getStats(): Promise<AIJobStats> {
    try {
      const stats = await redisCache.get<AIJobStats>(this.STATS_KEY);
      
      if (!stats) {
        const defaultStats: AIJobStats = {
          totalJobs: 0,
          pendingJobs: 0,
          processingJobs: 0,
          completedJobs: 0,
          failedJobs: 0,
          averageProcessingTime: 0,
          throughput: 0,
          errorRate: 0
        };
        
        await redisCache.set(this.STATS_KEY, defaultStats, 3600);
        return defaultStats;
      }
      
      return stats;
      
    } catch (error) {
      console.error('Error getting job stats:', error);
      return {
        totalJobs: 0,
        pendingJobs: 0,
        processingJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        averageProcessingTime: 0,
        throughput: 0,
        errorRate: 0
      };
    }
  }

  /**
   * Get jobs by status
   */
  async getJobsByStatus(status: AIJobData['status'], limit = 10): Promise<AIJobData[]> {
    try {
      let queueKey: string;
      
      switch (status) {
        case 'pending':
          queueKey = this.QUEUE_KEY;
          break;
        case 'processing':
          queueKey = this.PROCESSING_KEY;
          break;
        case 'completed':
          queueKey = this.COMPLETED_KEY;
          break;
        case 'failed':
          queueKey = this.FAILED_KEY;
          break;
        default:
          return [];
      }
      
      // Get job IDs from queue
      const jobIds = await this.getJobIdsFromQueue(queueKey, limit);
      
      // Get job data
      const jobs: AIJobData[] = [];
      for (const jobId of jobIds) {
        const job = await redisCache.get<AIJobData>(`job:${jobId}`);
        if (job) {
          jobs.push(job);
        }
      }
      
      return jobs;
      
    } catch (error) {
      console.error('Error getting jobs by status:', error);
      return [];
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const job = await redisCache.get<AIJobData>(`job:${jobId}`);
      if (!job) {
        console.warn(`⚠️  Job ${jobId} not found for cancellation`);
        return false;
      }
      
      if (job.status === 'completed' || job.status === 'failed') {
        console.warn(`⚠️  Cannot cancel job ${jobId} - already ${job.status}`);
        return false;
      }
      
      // Update job status
      job.status = 'cancelled';
      job.updatedAt = new Date();
      job.completedAt = new Date();
      
      // Save job data
      await redisCache.set(`job:${jobId}`, job, 3600);
      
      // Remove from appropriate queue
      if (job.status === 'pending') {
        await this.removeFromQueue(jobId);
        await this.updateStats('pending', -1);
      } else if (job.status === 'processing') {
        await this.removeFromProcessing(jobId);
        await this.updateStats('processing', -1);
      }
      
      console.log(`🚫 AI Job cancelled: ${jobId}`);
      return true;
      
    } catch (error) {
      console.error('Error cancelling job:', error);
      return false;
    }
  }

  /**
   * Clear completed jobs older than specified time
   */
  async cleanupCompletedJobs(olderThanHours = 24): Promise<number> {
    try {
      const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
      let cleanedCount = 0;
      
      const completedJobs = await this.getJobsByStatus('completed', 100);
      
      for (const job of completedJobs) {
        if (job.completedAt && job.completedAt.getTime() < cutoffTime) {
          await this.removeFromCompleted(job.id);
          await redisCache.delete(`job:${job.id}`);
          cleanedCount++;
        }
      }
      
      console.log(`🧹 Cleaned up ${cleanedCount} completed AI jobs`);
      return cleanedCount;
      
    } catch (error) {
      console.error('Error cleaning up completed jobs:', error);
      return 0;
    }
  }

  // Private helper methods

  private calculatePriorityScore(job: AIJobData): number {
    const priorityWeight = this.PRIORITY_WEIGHTS[job.priority];
    const timeWeight = Date.now(); // Earlier jobs have higher priority
    
    return priorityWeight * 1000000 + timeWeight;
  }

  private async addToQueue(jobId: string, score: number): Promise<void> {
    // This would use Redis ZADD in a real implementation
    // For now, we'll use a simple list approach
    const queueJobs = await redisCache.get<string[]>(this.QUEUE_KEY) || [];
    queueJobs.push(jobId);
    await redisCache.set(this.QUEUE_KEY, queueJobs, 3600);
  }

  private async getFromQueue(): Promise<{ jobId: string; score: number } | null> {
    const queueJobs = await redisCache.get<string[]>(this.QUEUE_KEY) || [];
    if (queueJobs.length === 0) return null;
    
    const jobId = queueJobs.shift()!;
    await redisCache.set(this.QUEUE_KEY, queueJobs, 3600);
    
    return { jobId, score: 0 };
  }

  private async removeFromQueue(jobId: string): Promise<void> {
    const queueJobs = await redisCache.get<string[]>(this.QUEUE_KEY) || [];
    const filteredJobs = queueJobs.filter(id => id !== jobId);
    await redisCache.set(this.QUEUE_KEY, filteredJobs, 3600);
  }

  private async moveToProcessing(jobId: string): Promise<void> {
    const processingJobs = await redisCache.get<string[]>(this.PROCESSING_KEY) || [];
    processingJobs.push(jobId);
    await redisCache.set(this.PROCESSING_KEY, processingJobs, 3600);
  }

  private async removeFromProcessing(jobId: string): Promise<void> {
    const processingJobs = await redisCache.get<string[]>(this.PROCESSING_KEY) || [];
    const filteredJobs = processingJobs.filter(id => id !== jobId);
    await redisCache.set(this.PROCESSING_KEY, filteredJobs, 3600);
  }

  private async addToCompleted(jobId: string): Promise<void> {
    const completedJobs = await redisCache.get<string[]>(this.COMPLETED_KEY) || [];
    completedJobs.push(jobId);
    await redisCache.set(this.COMPLETED_KEY, completedJobs, 86400);
  }

  private async removeFromCompleted(jobId: string): Promise<void> {
    const completedJobs = await redisCache.get<string[]>(this.COMPLETED_KEY) || [];
    const filteredJobs = completedJobs.filter(id => id !== jobId);
    await redisCache.set(this.COMPLETED_KEY, filteredJobs, 86400);
  }

  private async addToFailed(jobId: string): Promise<void> {
    const failedJobs = await redisCache.get<string[]>(this.FAILED_KEY) || [];
    failedJobs.push(jobId);
    await redisCache.set(this.FAILED_KEY, failedJobs, 86400);
  }

  private async getJobIdsFromQueue(queueKey: string, limit: number): Promise<string[]> {
    const jobs = await redisCache.get<string[]>(queueKey) || [];
    return jobs.slice(0, limit);
  }

  private async updateStats(field: keyof AIJobStats, delta: number): Promise<void> {
    const stats = await this.getStats();
    
    switch (field) {
      case 'pending':
        stats.pendingJobs += delta;
        break;
      case 'processing':
        stats.processingJobs += delta;
        break;
      case 'completed':
        stats.completedJobs += delta;
        break;
      case 'failed':
        stats.failedJobs += delta;
        break;
    }
    
    // Update total and derived stats
    stats.totalJobs = stats.pendingJobs + stats.processingJobs + stats.completedJobs + stats.failedJobs;
    stats.errorRate = stats.totalJobs > 0 ? (stats.failedJobs / stats.totalJobs) * 100 : 0;
    
    await redisCache.set(this.STATS_KEY, stats, 3600);
  }

  private async updateProcessingTime(processingTime: number): Promise<void> {
    const stats = await this.getStats();
    
    // Update running average
    const totalCompleted = stats.completedJobs;
    if (totalCompleted === 1) {
      stats.averageProcessingTime = processingTime;
    } else {
      stats.averageProcessingTime = 
        ((stats.averageProcessingTime * (totalCompleted - 1)) + processingTime) / totalCompleted;
    }
    
    await redisCache.set(this.STATS_KEY, stats, 3600);
  }
}

// Export singleton instance
export const aiJobQueue = new AIJobQueue();

// Helper functions for common operations
export const addAIJob = (type: AIJobData['type'], payload: AIJobData['payload'], options?: AIJobData['payload']['options']) => {
  return aiJobQueue.addJob(type, payload, options);
};

export const getAIJobStatus = (jobId: string) => {
  return aiJobQueue.getJobStatus(jobId);
};

export const getAIJobStats = () => {
  return aiJobQueue.getStats();
};

export const cancelAIJob = (jobId: string) => {
  return aiJobQueue.cancelJob(jobId);
};

export const cleanupAIJobs = (olderThanHours?: number) => {
  return aiJobQueue.cleanupCompletedJobs(olderThanHours);
};