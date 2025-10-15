/**
 * Advanced A/B Testing Framework
 *
 * This module provides functionality for creating and managing sophisticated A/B tests
 * including multi-variant testing, statistical significance analysis, and automated
 * winner selection.
 */

import { ABTestMetric, ABTestStatus, type ABTestType, type EntityType } from '@/types/prisma-types';
// NOTE: Prisma removed - using backend API (tables exist in backend)
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NESTJS_BACKEND_URL || 'http://localhost:3006';

// Types for A/B Testing
export interface ABTestConfig {
  name: string;
  description?: string;
  entityType: EntityType;
  entityId: string;
  testType: ABTestType;
  testElements: string[]; // Array of element keys being tested
  winnerMetric: ABTestMetric;
  winnerThreshold?: number; // Confidence level (0-1)
  distributionPercent: number; // Percent of audience for testing (0-1)
  variants: ABTestVariantConfig[];
}

export interface ABTestVariantConfig {
  name: string;
  description?: string;
  content: Record<string, any>; // Values for each test element
  trafficPercent: number; // Distribution within test group (0-1)
}

export interface ABTestResult {
  testId: string;
  variantId: string;
  metric: ABTestMetric;
  value: number;
  sampleSize: number;
}

export interface ABTestStats {
  testId: string;
  status: ABTestStatus;
  startedAt?: Date;
  endedAt?: Date;
  totalParticipants: number;
  variants: ABTestVariantStats[];
  winner?: string; // Variant ID of winner
  confidence?: number; // Statistical confidence in winner
}

export interface ABTestVariantStats {
  variantId: string;
  name: string;
  participants: number;
  metrics: Record<ABTestMetric, { value: number; sampleSize: number }>;
  improvement?: number; // Percent improvement over control
}

/**
 * Create a new A/B test
 */
export async function createABTest(
  config: ABTestConfig,
  userId: string
): Promise<string> {
  try {
    // Validate configuration
    validateABTestConfig(config);

    const testId = randomUUID();

    // Create the A/B test via backend API
    const response = await fetch(`${BACKEND_URL}/api/v2/ab-tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testId,
        name: config.name,
        description: config.description,
        entityType: config.entityType,
        entityId: config.entityId,
        status: ABTestStatus.DRAFT,
        testType: config.testType,
        testElements: JSON.stringify(config.testElements),
        winnerMetric: config.winnerMetric,
        winnerThreshold: config.winnerThreshold,
        distributionPercent: config.distributionPercent,
        createdById: userId,
        variants: config.variants.map(v => ({
          id: randomUUID(),
          name: v.name,
          description: v.description,
          content: JSON.stringify(v.content),
          trafficPercent: v.trafficPercent,
        }))
      })
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }

    logger.info(`Created A/B test: ${testId}`, { testId, name: config.name });

    return testId;
  } catch (error) {
    logger.error("Error creating A/B test", error);
    throw error;
  }
}

/**
 * Start an A/B test
 */
export async function startABTest(testId: string): Promise<boolean> {
  try {
    // Update test status to RUNNING via backend API
    const response = await fetch(`${BACKEND_URL}/api/v2/ab-tests/${testId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: ABTestStatus.RUNNING,
        startedAt: new Date(),
      })
    });

    if (!response.ok) {
      logger.warn(`A/B test not found: ${testId}`);
      return false;
    }

    logger.info(`Started A/B test: ${testId}`, { testId });

    return true;
  } catch (error) {
    logger.error(`Error starting A/B test: ${testId}`, error);
    return false;
  }
}

/**
 * Stop an A/B test
 */
export async function stopABTest(testId: string): Promise<boolean> {
  try {
    // Update test status to COMPLETED via backend API
    const response = await fetch(`${BACKEND_URL}/api/v2/ab-tests/${testId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: ABTestStatus.COMPLETED,
        endedAt: new Date(),
      })
    });

    if (!response.ok) {
      return false;
    }

    logger.info(`Stopped A/B test: ${testId}`, { testId });

    return true;
  } catch (error) {
    logger.error(`Error stopping A/B test: ${testId}`, error);
    return false;
  }
}

/**
 * Record a result for an A/B test variant
 */
export async function recordABTestResult(
  testId: string,
  variantId: string,
  metric: ABTestMetric,
  value: number,
  sampleSize: number
): Promise<boolean> {
  try {
    // Check if result exists and upsert via backend API
    const response = await fetch(`${BACKEND_URL}/api/v2/ab-tests/${testId}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variantId,
        metric,
        value,
        sampleSize
      })
    });

    if (!response.ok) {
      return false;
    }

    // Check if we should determine a winner
    await checkForWinner(testId);

    return true;
  } catch (error) {
    logger.error("Error recording A/B test result", error);
    return false;
  }
}

/**
 * Get the stats for an A/B test
 */
export async function getABTestStats(testId: string): Promise<ABTestStats | null> {
  try {
    // Get the test and its variants and results via backend API
    const response = await fetch(`${BACKEND_URL}/api/v2/ab-tests/${testId}?include=variants,results`);

    if (!response.ok) {
      logger.warn(`A/B test not found: ${testId}`);
      return null;
    }

    const test = await response.json();

    // Calculate stats for each variant
    const variantStats: ABTestVariantStats[] = [];

    // Used to calculate improvement percentages
    const controlVariant = test.variants.find((v: any) => v.name.toLowerCase() === 'control' || v.name === 'a');

    const totalParticipants = test.variants.reduce((sum: number, variant: any) => {
      const variantResults = variant.results || [];
      const participantResult = variantResults.find((r: any) => r.metric === ABTestMetric.OPEN_RATE);
      return sum + (participantResult?.sampleSize || 0);
    }, 0);

    for (const variant of test.variants) {
      const metrics: Record<ABTestMetric, { value: number; sampleSize: number }> = {} as any;

      // Initialize metrics with empty values
      Object.values(ABTestMetric).forEach(metric => {
        metrics[metric] = { value: 0, sampleSize: 0 };
      });

      // Fill in actual values
      for (const result of variant.results) {
        metrics[result.metric] = {
          value: result.value,
          sampleSize: result.sampleSize,
        };
      }

      // Calculate improvement over control if possible
      let improvement: number | undefined;

      if (controlVariant && variant.id !== controlVariant.id) {
        const winnerMetric = test.winnerMetric;
        const controlResult = controlVariant.results.find((r: any) => r.metric === winnerMetric);
        const variantResult = variant.results.find((r: any) => r.metric === winnerMetric);

        if (controlResult && variantResult && controlResult.value > 0) {
          improvement = ((variantResult.value - controlResult.value) / controlResult.value) * 100;
        }
      }

      variantStats.push({
        variantId: variant.id,
        name: variant.name,
        participants: metrics[ABTestMetric.OPEN_RATE]?.sampleSize || 0,
        metrics,
        improvement,
      });
    }

    return {
      testId: test.id,
      status: test.status,
      startedAt: test.startedAt ? new Date(test.startedAt) : undefined,
      endedAt: test.endedAt ? new Date(test.endedAt) : undefined,
      totalParticipants,
      variants: variantStats,
      winner: test.winnerVariantId || undefined,
      confidence: calculateConfidence(test),
    };
  } catch (error) {
    logger.error(`Error getting A/B test stats: ${testId}`, error);
    return null;
  }
}

/**
 * Assign a contact to a variant of an A/B test
 */
export async function assignContactToVariant(
  testId: string,
  contactId: string
): Promise<string | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v2/ab-tests/${testId}?include=variants`);

    if (!response.ok) {
      return null;
    }

    const test = await response.json();

    if (test.status !== ABTestStatus.RUNNING) {
      return null;
    }

    // Using the contactId as a consistent seed for randomization
    // This ensures the same contact always gets the same variant
    const hash = await hashString(contactId + testId);
    const hashValue = Number.parseInt(hash.substring(0, 8), 16) / 0xFFFFFFFF; // Normalize to 0-1

    // First decide if contact is in test group based on distribution percent
    if (hashValue > test.distributionPercent) {
      return null; // Contact not in test group
    }

    // Now assign to a specific variant based on traffic distribution
    let cumulativeProbability = 0;
    const normalizedHash = (Number.parseInt(hash.substring(8, 16), 16) / 0xFFFFFFFF); // Another 0-1 value

    for (const variant of test.variants) {
      cumulativeProbability += variant.trafficPercent;
      if (normalizedHash <= cumulativeProbability) {
        return variant.id;
      }
    }

    // Fallback to first variant if something went wrong with probabilities
    return test.variants[0]?.id || null;
  } catch (error) {
    logger.error("Error assigning contact to variant", error);
    return null;
  }
}

/**
 * Get the content for a specific variant
 */
export async function getVariantContent(
  variantId: string
): Promise<Record<string, any> | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v2/ab-test-variants/${variantId}`);

    if (!response.ok) {
      return null;
    }

    const variant = await response.json();

    return JSON.parse(variant.content);
  } catch (error) {
    logger.error(`Error getting variant content: ${variantId}`, error);
    return null;
  }
}

/**
 * Determine if a variant is the winner of an A/B test
 */
async function checkForWinner(testId: string): Promise<void> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v2/ab-tests/${testId}?include=variants,results`);

    if (!response.ok) {
      return;
    }

    const test = await response.json();

    if (test.status !== ABTestStatus.RUNNING || !test.winnerThreshold) {
      return;
    }

    // Calculate confidence level
    const confidence = calculateConfidence(test);

    if (confidence && confidence >= test.winnerThreshold) {
      // Find the variant with the best performance for the winner metric
      const metricResults = test.variants
        .map((variant: any) => {
          const result = variant.results.find((r: any) => r.metric === test.winnerMetric);
          return {
            variantId: variant.id,
            value: result?.value || 0,
          };
        })
        .filter((result: any) => result.value > 0);

      if (metricResults.length > 0) {
        // Find the highest value (best performing)
        const winner = metricResults.reduce((best: any, current: any) =>
          current.value > best.value ? current : best
        );

        // Update the test with the winner via backend API
        await fetch(`${BACKEND_URL}/api/v2/ab-tests/${testId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            winnerVariantId: winner.variantId,
            status: ABTestStatus.COMPLETED,
            endedAt: new Date(),
          })
        });

        logger.info(`Automatically determined winner for A/B test: ${testId}`, {
          testId,
          winnerId: winner.variantId,
          confidence
        });
      }
    }
  } catch (error) {
    logger.error(`Error checking for winner: ${testId}`, error);
  }
}

/**
 * Calculate the statistical confidence in a test result
 */
function calculateConfidence(test: any): number | undefined {
  if (!test.variants || test.variants.length < 2) {
    return undefined;
  }

  // Find control and variation results for the winner metric
  const controlVariant = test.variants.find((v: any) =>
    v.name.toLowerCase() === 'control' || v.name === 'a'
  );

  if (!controlVariant) {
    return undefined;
  }

  const controlResult = controlVariant.results.find((r: any) => r.metric === test.winnerMetric);
  if (!controlResult || controlResult.sampleSize < 30) {
    // Need at least 30 samples for statistical relevance
    return undefined;
  }

  // Find the best performing variant
  let bestVariant = null;
  let bestValue = 0;

  for (const variant of test.variants) {
    if (variant.id === controlVariant.id) continue;

    const result = variant.results.find((r: any) => r.metric === test.winnerMetric);
    if (result && result.value > bestValue) {
      bestVariant = variant;
      bestValue = result.value;
    }
  }

  if (!bestVariant) {
    return undefined;
  }

  const bestResult = bestVariant.results.find((r: any) => r.metric === test.winnerMetric);
  if (!bestResult || bestResult.sampleSize < 30) {
    return undefined;
  }

  // Calculate z-score using the z-test for proportions
  const p1 = controlResult.value; // Control conversion rate
  const p2 = bestResult.value; // Variation conversion rate
  const n1 = controlResult.sampleSize;
  const n2 = bestResult.sampleSize;

  // Pooled standard error
  const p = (p1 * n1 + p2 * n2) / (n1 + n2);
  const se = Math.sqrt(p * (1 - p) * (1/n1 + 1/n2));

  // Z-score
  const z = (p2 - p1) / se;

  // Probability from z-score (one-tailed test)
  const confidence = zScoreToProbability(z);

  return confidence;
}

/**
 * Convert a z-score to a probability value (0-1)
 */
function zScoreToProbability(z: number): number {
  // Approximation of the cumulative distribution function of the standard normal distribution
  const b0 = 0.2316419;
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;

  if (z < 0) {
    return 1 - zScoreToProbability(-z);
  }

  const t = 1 / (1 + b0 * z);
  const pdfValue = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);

  return 1 - pdfValue * (b1 * t + b2 * t * t + b3 * t * t * t + b4 * t * t * t * t + b5 * t * t * t * t * t);
}

/**
 * Validate an A/B test configuration
 */
function validateABTestConfig(config: ABTestConfig): void {
  // Basic validation
  if (!config.name) {
    throw new Error('A/B test name is required');
  }

  if (!config.entityType || !config.entityId) {
    throw new Error('Entity type and ID are required');
  }

  if (!config.testElements || config.testElements.length === 0) {
    throw new Error('At least one test element is required');
  }

  if (!config.variants || config.variants.length < 2) {
    throw new Error('At least two variants are required');
  }

  // Ensure the distributionPercent is between 0 and 1
  if (config.distributionPercent <= 0 || config.distributionPercent > 1) {
    throw new Error('Distribution percentage must be between 0 and 1');
  }

  // Variant validation
  let totalTrafficPercent = 0;

  for (const variant of config.variants) {
    if (!variant.name) {
      throw new Error('Each variant must have a name');
    }

    if (!variant.content) {
      throw new Error('Each variant must have content');
    }

    if (variant.trafficPercent <= 0 || variant.trafficPercent > 1) {
      throw new Error('Traffic percentage for each variant must be between 0 and 1');
    }

    totalTrafficPercent += variant.trafficPercent;
  }

  // Ensure traffic percentages sum to 1
  if (Math.abs(totalTrafficPercent - 1) > 0.01) {
    throw new Error('Traffic percentages must sum to 1');
  }
}

/**
 * Create a simple hash of a string for consistent variant assignment
 */
async function hashString(str: string): Promise<string> {
  // In a production environment, you'd use a secure hashing algorithm
  // This is a simple implementation for demonstration purposes
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Convert to hex string
  const hexHash = (hash >>> 0).toString(16).padStart(8, '0');
  return hexHash + Date.now().toString(16).padStart(8, '0');
}

/**
 * Get a list of A/B tests with optional filtering
 */
export async function getABTests({
  entityType,
  entityId,
  status,
  limit = 50,
  offset = 0
}: {
  entityType?: EntityType;
  entityId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  try {
    // Build query params
    const params = new URLSearchParams();
    if (entityType) params.append('entityType', entityType);
    if (entityId) params.append('entityId', entityId);
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    // Query tests via backend API
    const response = await fetch(`${BACKEND_URL}/api/v2/ab-tests?${params}`);

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }

    const tests = await response.json();

    return tests;
  } catch (error) {
    logger.error('Error getting A/B tests', error);
    throw error;
  }
}

/**
 * Get details of a specific A/B test by ID
 */
export async function getABTestById(id: string): Promise<any | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v2/ab-tests/${id}?include=variants,results`);

    if (!response.ok) {
      return null;
    }

    const test = await response.json();

    // Parse test elements from JSON string to array
    const testElements = JSON.parse(test.testElements);

    // Parse variant content from JSON string to object
    const variants = test.variants.map((variant: any) => ({
      ...variant,
      content: JSON.parse(variant.content)
    }));

    return {
      ...test,
      testElements,
      variants
    };
  } catch (error) {
    logger.error(`Error getting A/B test: ${id}`, error);
    return null;
  }
}

/**
 * Update an existing A/B test
 */
export async function updateABTest(
  id: string,
  data: {
    name?: string;
    description?: string;
    status?: ABTestStatus;
    winnerMetric?: ABTestMetric;
    winnerThreshold?: number;
    distributionPercent?: number;
    testElements?: string[];
    variants?: {
      id?: string;
      name?: string;
      description?: string;
      content?: Record<string, any>;
      trafficPercent?: number;
    }[];
  }
): Promise<boolean> {
  try {
    // Update via backend API
    const response = await fetch(`${BACKEND_URL}/api/v2/ab-tests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        testElements: data.testElements ? JSON.stringify(data.testElements) : undefined,
        variants: data.variants?.map(v => ({
          ...v,
          content: v.content ? JSON.stringify(v.content) : undefined
        }))
      })
    });

    if (!response.ok) {
      logger.warn(`A/B test not found for update: ${id}`);
      return false;
    }

    logger.info(`Updated A/B test: ${id}`);
    return true;
  } catch (error) {
    logger.error(`Error updating A/B test: ${id}`, error);
    return false;
  }
}

/**
 * Delete an A/B test and all related data
 */
export async function deleteABTest(id: string): Promise<boolean> {
  try {
    // Delete via backend API
    const response = await fetch(`${BACKEND_URL}/api/v2/ab-tests/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      return false;
    }

    logger.info(`Deleted A/B test: ${id}`);
    return true;
  } catch (error) {
    logger.error(`Error deleting A/B test: ${id}`, error);
    return false;
  }
}
