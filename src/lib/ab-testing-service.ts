/**
 * A/B Testing Service
 * 
 * Frontend service for interacting with the A/B testing API endpoints
 */

import { toast } from 'sonner';

// Types for A/B Testing UI
export interface ABTestFormData {
  name: string;
  description?: string;
  entityType: string;
  entityId: string;
  testType: string;
  testElements: string[];
  winnerMetric: string;
  winnerThreshold?: number;
  distributionPercent: number;
  variants: ABTestVariantFormData[];
}

export interface ABTestVariantFormData {
  id?: string;
  name: string;
  description?: string;
  content: Record<string, any>;
  trafficPercent: number;
}

export interface ABTest {
  id: string;
  name: string;
  description?: string;
  entityType: string;
  entityId: string;
  status: string;
  testType: string;
  testElements: string[];
  winnerMetric: string;
  winnerThreshold?: number;
  distributionPercent: number;
  startedAt?: string;
  endedAt?: string;
  winnerVariantId?: string;
  createdAt: string;
  updatedAt: string;
  variants: ABTestVariant[];
  _count: {
    results: number;
  };
}

export interface ABTestVariant {
  id: string;
  name: string;
  description?: string;
  content: Record<string, any>;
  trafficPercent: number;
  _count?: {
    results: number;
  };
  results?: Record<string, { value: number; sampleSize: number }>;
}

/**
 * Get all A/B tests with optional filtering
 */
export async function getABTests(filters?: {
  entityType?: string;
  entityId?: string;
  status?: string;
}): Promise<ABTest[]> {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    
    if (filters?.entityType) {
      queryParams.append('entityType', filters.entityType);
    }
    
    if (filters?.entityId) {
      queryParams.append('entityId', filters.entityId);
    }
    
    if (filters?.status) {
      queryParams.append('status', filters.status);
    }
    
    const queryString = queryParams.toString();
    const url = `/api/ab-tests${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch A/B tests');
    }
    
    const tests = await response.json();
    
    // Convert testElements from JSON string to array if needed
    return tests.map((test: any) => ({
      ...test,
      testElements: typeof test.testElements === 'string' 
        ? JSON.parse(test.testElements) 
        : test.testElements
    }));
  } catch (error: any) {
    console.error('Error fetching A/B tests:', error);
    toast.error('Failed to load A/B tests');
    return [];
  }
}

/**
 * Get a specific A/B test by ID with stats
 */
export async function getABTest(id: string): Promise<ABTest | null> {
  try {
    // Add loading delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const response = await fetch(`/api/ab-tests?id=${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        toast.error('A/B test not found');
        return null;
      }
      
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch A/B test');
    }
    
    const data = await response.json();
    
    // Return null if no data was found
    if (!data || !data.id) {
      toast.error('Invalid A/B test data received');
      return null;
    }
    
    return data;
  } catch (error: any) {
    console.error(`Error fetching A/B test ${id}:`, error);
    toast.error(error.message || 'Failed to load A/B test details');
    throw error; // Re-throw to allow the component to handle it
  }
}

/**
 * Create a new A/B test
 */
export async function createABTest(data: ABTestFormData): Promise<string | null> {
  try {
    const response = await fetch('/api/v2/ab-tests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create A/B test');
    }
    
    const result = await response.json();
    toast.success('A/B test created successfully');
    
    return result.id;
  } catch (error: any) {
    console.error('Error creating A/B test:', error);
    toast.error(error.message || 'Failed to create A/B test');
    return null;
  }
}

/**
 * Update an existing A/B test
 */
export async function updateABTest(id: string, data: Partial<ABTestFormData>): Promise<boolean> {
  try {
    const response = await fetch('/api/v2/ab-tests', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        ...data,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update A/B test');
    }
    
    toast.success('A/B test updated successfully');
    return true;
  } catch (error: any) {
    console.error(`Error updating A/B test ${id}:`, error);
    toast.error(error.message || 'Failed to update A/B test');
    return false;
  }
}

/**
 * Delete an A/B test
 */
export async function deleteABTest(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/ab-tests?id=${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete A/B test');
    }
    
    toast.success('A/B test deleted successfully');
    return true;
  } catch (error: any) {
    console.error(`Error deleting A/B test ${id}:`, error);
    toast.error(error.message || 'Failed to delete A/B test');
    return false;
  }
}

/**
 * Start an A/B test
 */
export async function startABTest(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/ab-tests/${id}/start`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start A/B test');
    }
    
    toast.success('A/B test started successfully');
    return true;
  } catch (error: any) {
    console.error(`Error starting A/B test ${id}:`, error);
    toast.error(error.message || 'Failed to start A/B test');
    return false;
  }
}

/**
 * Stop an A/B test
 */
export async function stopABTest(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/ab-tests/${id}/stop`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to stop A/B test');
    }
    
    toast.success('A/B test stopped successfully');
    return true;
  } catch (error: any) {
    console.error(`Error stopping A/B test ${id}:`, error);
    toast.error(error.message || 'Failed to stop A/B test');
    return false;
  }
} 