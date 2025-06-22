/**
 * Error Handling & Type Safety Module
 * Replaces @ts-ignore statements and provides robust error handling
 */

import { logger } from '@/lib/logger';

// Custom error classes for different ML scenarios
export class MLError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MLError';
  }
}

export class DataValidationError extends MLError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'DATA_VALIDATION_ERROR', details);
    this.name = 'DataValidationError';
  }
}

export class ModelTrainingError extends MLError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'MODEL_TRAINING_ERROR', details);
    this.name = 'ModelTrainingError';
  }
}

export class PredictionError extends MLError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PREDICTION_ERROR', details);
    this.name = 'PredictionError';
  }
}

export class FeatureEngineeringError extends MLError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'FEATURE_ENGINEERING_ERROR', details);
    this.name = 'FeatureEngineeringError';
  }
}

// Type-safe wrappers for external libraries
export class SafeNLPLibrary {
  private nlpInstance: any = null;
  private sentimentInstance: any = null;

  async initializeNLP(): Promise<boolean> {
    try {
      // Try to load compromise
      const { default: nlp } = await this.safeImport('compromise');
      this.nlpInstance = nlp;
      return true;
    } catch (error) {
      logger.warn('Failed to load NLP library, using fallback', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  async initializeSentiment(): Promise<boolean> {
    try {
      // Try to load sentiment
      const { default: Sentiment } = await this.safeImport('sentiment');
      this.sentimentInstance = new Sentiment();
      return true;
    } catch (error) {
      logger.warn('Failed to load Sentiment library, using fallback', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  analyzeText(text: string): {
    words: string[];
    sentences: string[];
    nouns: string[];
    verbs: string[];
    adjectives: string[];
  } {
    if (!this.nlpInstance) {
      return this.fallbackTextAnalysis(text);
    }

    try {
      const doc = this.nlpInstance(text);
      return {
        words: text.split(/\s+/).filter(w => w.length > 0),
        sentences: text.split(/[.!?]+/).filter(s => s.trim().length > 0),
        nouns: doc.nouns().out('array') || [],
        verbs: doc.verbs().out('array') || [],
        adjectives: doc.adjectives().out('array') || []
      };
    } catch (error) {
      logger.warn('NLP analysis failed, using fallback', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return this.fallbackTextAnalysis(text);
    }
  }

  analyzeSentiment(text: string): {
    score: number;
    comparative: number;
    positive: string[];
    negative: string[];
  } {
    if (!this.sentimentInstance) {
      return this.fallbackSentimentAnalysis(text);
    }

    try {
      const result = this.sentimentInstance.analyze(text);
      return {
        score: result.score || 0,
        comparative: result.comparative || 0,
        positive: result.positive || [],
        negative: result.negative || []
      };
    } catch (error) {
      logger.warn('Sentiment analysis failed, using fallback', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return this.fallbackSentimentAnalysis(text);
    }
  }

  private async safeImport(moduleName: string): Promise<any> {
    try {
      return await import(moduleName);
    } catch (error) {
      throw new Error(`Failed to import ${moduleName}: ${error}`);
    }
  }

  private fallbackTextAnalysis(text: string) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Simple heuristic-based extraction
    const nouns = words.filter(word => 
      word.length > 3 && 
      !['the', 'and', 'but', 'for', 'are', 'with'].includes(word.toLowerCase())
    );
    
    return {
      words,
      sentences,
      nouns: nouns.slice(0, 10),
      verbs: [],
      adjectives: []
    };
  }

  private fallbackSentimentAnalysis(text: string) {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing', 'poor'];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    const positive: string[] = [];
    const negative: string[] = [];
    
    words.forEach(word => {
      if (positiveWords.includes(word)) {
        score += 1;
        positive.push(word);
      } else if (negativeWords.includes(word)) {
        score -= 1;
        negative.push(word);
      }
    });
    
    return {
      score,
      comparative: score / Math.max(words.length, 1),
      positive,
      negative
    };
  }
}

// Input validation utilities
export class InputValidator {
  static validateNumber(
    value: unknown,
    fieldName: string,
    options: {
      min?: number;
      max?: number;
      required?: boolean;
    } = {}
  ): number {
    if (value === null || value === undefined) {
      if (options.required) {
        throw new DataValidationError(`${fieldName} is required`);
      }
      return 0;
    }

    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) {
      throw new DataValidationError(`${fieldName} must be a valid number`, {
        value,
        fieldName
      });
    }

    if (options.min !== undefined && num < options.min) {
      throw new DataValidationError(`${fieldName} must be >= ${options.min}`, {
        value: num,
        min: options.min
      });
    }

    if (options.max !== undefined && num > options.max) {
      throw new DataValidationError(`${fieldName} must be <= ${options.max}`, {
        value: num,
        max: options.max
      });
    }

    return num;
  }

  static validateString(
    value: unknown,
    fieldName: string,
    options: {
      minLength?: number;
      maxLength?: number;
      required?: boolean;
      pattern?: RegExp;
    } = {}
  ): string {
    if (value === null || value === undefined) {
      if (options.required) {
        throw new DataValidationError(`${fieldName} is required`);
      }
      return '';
    }

    const str = String(value);

    if (options.minLength !== undefined && str.length < options.minLength) {
      throw new DataValidationError(`${fieldName} must be at least ${options.minLength} characters`, {
        value: str,
        actualLength: str.length,
        minLength: options.minLength
      });
    }

    if (options.maxLength !== undefined && str.length > options.maxLength) {
      throw new DataValidationError(`${fieldName} must be at most ${options.maxLength} characters`, {
        value: str,
        actualLength: str.length,
        maxLength: options.maxLength
      });
    }

    if (options.pattern && !options.pattern.test(str)) {
      throw new DataValidationError(`${fieldName} format is invalid`, {
        value: str,
        pattern: options.pattern.toString()
      });
    }

    return str;
  }

  static validateArray<T>(
    value: unknown,
    fieldName: string,
    validator: (item: unknown, index: number) => T,
    options: {
      minLength?: number;
      maxLength?: number;
      required?: boolean;
    } = {}
  ): T[] {
    if (value === null || value === undefined) {
      if (options.required) {
        throw new DataValidationError(`${fieldName} is required`);
      }
      return [];
    }

    if (!Array.isArray(value)) {
      throw new DataValidationError(`${fieldName} must be an array`, {
        value,
        actualType: typeof value
      });
    }

    if (options.minLength !== undefined && value.length < options.minLength) {
      throw new DataValidationError(`${fieldName} must have at least ${options.minLength} items`, {
        actualLength: value.length,
        minLength: options.minLength
      });
    }

    if (options.maxLength !== undefined && value.length > options.maxLength) {
      throw new DataValidationError(`${fieldName} must have at most ${options.maxLength} items`, {
        actualLength: value.length,
        maxLength: options.maxLength
      });
    }

    return value.map((item, index) => {
      try {
        return validator(item, index);
      } catch (error) {
        throw new DataValidationError(`${fieldName}[${index}] is invalid`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          index,
          value: item
        });
      }
    });
  }

  static validateEmail(value: unknown, fieldName = 'email'): string {
    const email = this.validateString(value, fieldName, {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    });
    return email;
  }

  static validateFeatureVector(
    value: unknown,
    expectedLength: number,
    fieldName = 'features'
  ): number[] {
    const features = this.validateArray(
      value,
      fieldName,
      (item, index) => this.validateNumber(item, `${fieldName}[${index}]`, { required: true }),
      { required: true, minLength: expectedLength, maxLength: expectedLength }
    );
    return features;
  }
}

// Safe execution wrapper
export class SafeExecutor {
  static async executeWithFallback<T>(
    primaryFn: () => Promise<T>,
    fallbackFn: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      return await primaryFn();
    } catch (error) {
      logger.warn(`${operationName} primary method failed, using fallback`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      try {
        return await fallbackFn();
      } catch (fallbackError) {
        logger.error(`${operationName} fallback also failed`, {
          originalError: error instanceof Error ? error.message : 'Unknown error',
          fallbackError: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
        });
        throw fallbackError;
      }
    }
  }

  static executeWithRetry<T>(
    fn: () => T,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const attempt = () => {
        try {
          const result = fn();
          resolve(result);
        } catch (error) {
          attempts++;
          if (attempts >= maxRetries) {
            reject(error);
          } else {
            setTimeout(attempt, delay * attempts);
          }
        }
      };

      attempt();
    });
  }

  static validateAndExecute<T>(
    data: unknown,
    validator: (data: unknown) => void,
    executor: (data: any) => T,
    operationName: string
  ): T {
    try {
      validator(data);
      return executor(data);
    } catch (error) {
      if (error instanceof DataValidationError) {
        throw error;
      }
      throw new MLError(`${operationName} execution failed`, 'EXECUTION_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Configuration validation
export interface MLConfig {
  modelType: 'churn' | 'ltv' | 'content' | 'engagement';
  features: string[];
  scalingMethod: 'minmax' | 'standard' | 'robust' | 'quantile';
  validationSplit: number;
  maxTrainingTime: number;
  enableFallbacks: boolean;
}

export class ConfigValidator {
  static validateMLConfig(config: unknown): MLConfig {
    if (!config || typeof config !== 'object') {
      throw new DataValidationError('Configuration must be an object');
    }

    const c = config as Record<string, unknown>;

    const modelType = InputValidator.validateString(c.modelType, 'modelType', {
      required: true
    });

    if (!['churn', 'ltv', 'content', 'engagement'].includes(modelType)) {
      throw new DataValidationError('Invalid model type', {
        validTypes: ['churn', 'ltv', 'content', 'engagement'],
        provided: modelType
      });
    }

    const features = InputValidator.validateArray(
      c.features,
      'features',
      (item) => InputValidator.validateString(item, 'feature', { required: true }),
      { required: true, minLength: 1 }
    );

    const scalingMethod = InputValidator.validateString(c.scalingMethod, 'scalingMethod', {
      required: true
    });

    if (!['minmax', 'standard', 'robust', 'quantile'].includes(scalingMethod)) {
      throw new DataValidationError('Invalid scaling method', {
        validMethods: ['minmax', 'standard', 'robust', 'quantile'],
        provided: scalingMethod
      });
    }

    const validationSplit = InputValidator.validateNumber(c.validationSplit, 'validationSplit', {
      required: true,
      min: 0.1,
      max: 0.5
    });

    const maxTrainingTime = InputValidator.validateNumber(c.maxTrainingTime, 'maxTrainingTime', {
      required: true,
      min: 1000,
      max: 300000
    });

    const enableFallbacks = Boolean(c.enableFallbacks);

    return {
      modelType: modelType as MLConfig['modelType'],
      features,
      scalingMethod: scalingMethod as MLConfig['scalingMethod'],
      validationSplit,
      maxTrainingTime,
      enableFallbacks
    };
  }
}

// Global error boundary for ML operations
export class MLErrorBoundary {
  private static instance: MLErrorBoundary;
  private errorHandlers: Map<string, (error: MLError) => void> = new Map();

  static getInstance(): MLErrorBoundary {
    if (!this.instance) {
      this.instance = new MLErrorBoundary();
    }
    return this.instance;
  }

  registerErrorHandler(errorType: string, handler: (error: MLError) => void): void {
    this.errorHandlers.set(errorType, handler);
  }

  handleError(error: unknown, context: string): never {
    let mlError: MLError;

    if (error instanceof MLError) {
      mlError = error;
    } else if (error instanceof Error) {
      mlError = new MLError(error.message, 'UNKNOWN_ERROR', { context });
    } else {
      mlError = new MLError('Unknown error occurred', 'UNKNOWN_ERROR', { context, error });
    }

    // Log error
    logger.error(`ML Error in ${context}`, {
      code: mlError.code,
      message: mlError.message,
      details: mlError.details
    });

    // Call registered handler if available
    const handler = this.errorHandlers.get(mlError.code);
    if (handler) {
      try {
        handler(mlError);
      } catch (handlerError) {
        logger.error('Error handler failed', {
          originalError: mlError.message,
          handlerError: handlerError instanceof Error ? handlerError.message : 'Unknown'
        });
      }
    }

    throw mlError;
  }
}

// Export instances
export const safeNLP = new SafeNLPLibrary();
export const errorBoundary = MLErrorBoundary.getInstance(); 