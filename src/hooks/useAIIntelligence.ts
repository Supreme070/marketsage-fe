/**
 * AI Intelligence CRUD Hooks
 * ==========================
 * Complete CRUD operations for all AI Intelligence sections
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

// Types for AI Intelligence records
export interface ContentAnalysis {
  id?: string;
  title: string;
  content: string;
  supremeScore: number;
  sentiment?: number;
  readability?: number;
  engagement?: number;
  analysis?: Record<string, any>;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: { id: string; name: string; email: string };
}

export interface CustomerSegment {
  id?: string;
  name: string;
  description?: string;
  criteria?: Record<string, any>;
  customerCount?: number;
  churnRisk?: number;
  lifetimeValue?: number;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: { id: string; name: string; email: string };
}

export interface ChatHistory {
  id?: string;
  userId: string;
  sessionId?: string;
  question: string;
  answer: string;
  context?: Record<string, any>;
  confidence?: number;
  createdAt?: Date;
}

export interface AITool {
  id?: string;
  name: string;
  description?: string;
  category: string;
  config?: Record<string, any>;
  usage?: Record<string, any>;
  isPublic?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: { id: string; name: string; email: string };
}

// Generic CRUD hook
function useAICRUD<T>(
  type: 'content' | 'customer' | 'chat' | 'tool',
  userId: string = 'default'
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch records
  const fetchData = useCallback(async (limit: number = 10) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/ai/intelligence?type=${type}&userId=${userId}&limit=${limit}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const result = await response.json();
      setData(result.data || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      toast.error(`Failed to load ${type} data`);
    } finally {
      setLoading(false);
    }
  }, [type, userId]);

  // Create record
  const create = useCallback(async (newRecord: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data: newRecord, userId })
      });

      if (!response.ok) throw new Error('Failed to create record');

      const result = await response.json();
      setData(prev => [result.data, ...prev]);
      toast.success(result.message);
      return result.data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      toast.error(`Failed to create ${type}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [type, userId]);

  // Update record
  const update = useCallback(async (id: string, updates: Partial<T>) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/intelligence', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type, data: updates, userId })
      });

      if (!response.ok) throw new Error('Failed to update record');

      const result = await response.json();
      setData(prev => prev.map(item => 
        (item as any).id === id ? result.data : item
      ));
      toast.success(result.message);
      return result.data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      toast.error(`Failed to update ${type}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [type, userId]);

  // Delete record
  const remove = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/ai/intelligence?id=${id}&type=${type}&userId=${userId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete record');

      const result = await response.json();
      setData(prev => prev.filter(item => (item as any).id !== id));
      toast.success(result.message);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      toast.error(`Failed to delete ${type}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [type, userId]);

  return {
    data,
    loading,
    error,
    fetchData,
    create,
    update,
    remove,
    refresh: fetchData
  };
}

// Specialized hooks for each AI Intelligence section

// Content Intelligence CRUD
export function useContentAnalysis(userId?: string) {
  const crud = useAICRUD<ContentAnalysis>('content', userId);
  
  // Auto-fetch on mount
  useEffect(() => {
    crud.fetchData();
  }, [crud.fetchData]);

  // Content-specific methods
  const analyzeAndSave = useCallback(async (title: string, content: string) => {
    // First analyze the content using Supreme-AI
    const analysisResponse = await fetch('/api/ai/supreme-v3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'content',
        userId,
        content
      })
    });

    if (!analysisResponse.ok) throw new Error('Analysis failed');
    
    const analysis = await analysisResponse.json();
    
    // Then save the analysis
    return crud.create({
      title,
      content,
      supremeScore: analysis.supremeScore || 0,
      sentiment: analysis.data?.sentiment || 0,
      readability: analysis.data?.readability || 0,
      engagement: analysis.data?.engagement || 0,
      analysis: analysis.data || {},
      tags: analysis.data?.categories || []
    });
  }, [crud.create, userId]);

  return {
    ...crud,
    analyzeAndSave,
    analyses: crud.data
  };
}

// Customer Intelligence CRUD
export function useCustomerSegments(userId?: string) {
  const crud = useAICRUD<CustomerSegment>('customer', userId);
  
  useEffect(() => {
    crud.fetchData();
  }, [crud.fetchData]);

  // Customer-specific methods
  const createSegmentFromAnalysis = useCallback(async (
    name: string,
    description: string,
    customers: any[]
  ) => {
    // First analyze customers using Supreme-AI
    const analysisResponse = await fetch('/api/ai/supreme-v3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'customer',
        userId,
        customers
      })
    });

    if (!analysisResponse.ok) throw new Error('Customer analysis failed');
    
    const analysis = await analysisResponse.json();
    
    // Create segment from analysis
    return crud.create({
      name,
      description,
      criteria: analysis.data?.segmentCriteria || {},
      customerCount: customers.length,
      churnRisk: analysis.data?.averageChurnRisk || 0,
      lifetimeValue: analysis.data?.totalLifetimeValue || 0,
      tags: analysis.data?.tags || []
    });
  }, [crud.create, userId]);

  return {
    ...crud,
    createSegmentFromAnalysis,
    segments: crud.data
  };
}

// Chat History CRUD
export function useChatHistory(userId?: string) {
  const crud = useAICRUD<ChatHistory>('chat', userId);
  
  useEffect(() => {
    crud.fetchData(50); // Load more chat history
  }, [crud.fetchData]);

  // Chat-specific methods
  const saveChat = useCallback(async (
    question: string,
    answer: string,
    context?: Record<string, any>,
    confidence?: number,
    sessionId?: string
  ) => {
    return crud.create({
      userId: userId || 'default',
      question,
      answer,
      context,
      confidence,
      sessionId
    });
  }, [crud.create, userId]);

  const clearHistory = useCallback(async () => {
    const deletePromises = crud.data.map(chat => 
      chat.id ? crud.remove(chat.id) : Promise.resolve()
    );
    await Promise.all(deletePromises);
  }, [crud.data, crud.remove]);

  return {
    ...crud,
    saveChat,
    clearHistory,
    chats: crud.data
  };
}

// AI Tools CRUD
export function useAITools(userId?: string) {
  const crud = useAICRUD<AITool>('tool', userId);
  
  useEffect(() => {
    crud.fetchData();
  }, [crud.fetchData]);

  // Tool-specific methods
  const createTool = useCallback(async (
    name: string,
    description: string,
    category: string,
    config: Record<string, any> = {},
    isPublic: boolean = false
  ) => {
    return crud.create({
      name,
      description,
      category,
      config,
      isPublic,
      usage: { count: 0, lastUsed: null }
    });
  }, [crud.create]);

  const useTool = useCallback(async (toolId: string) => {
    const tool = crud.data.find(t => t.id === toolId);
    if (!tool) throw new Error('Tool not found');

    const newUsage = {
      ...tool.usage,
      count: (tool.usage?.count || 0) + 1,
      lastUsed: new Date().toISOString()
    };

    return crud.update(toolId, { usage: newUsage });
  }, [crud.data, crud.update]);

  return {
    ...crud,
    createTool,
    useTool,
    tools: crud.data
  };
}

// Overview hook - combines all AI Intelligence data
export function useAIIntelligenceOverview(
  userId?: string,
  timeRange: '24h' | '7d' | '30d' | 'all' = 'all'
) {
  const [overview, setOverview] = useState({
    counts: { contentCount: 0, customerCount: 0, chatCount: 0, toolCount: 0 },
    recent: [] as any[]
  });
  const [loading, setLoading] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/ai/intelligence?userId=${userId}&timeRange=${timeRange}`
      );
      if (!response.ok) throw new Error('Failed to fetch overview');
      
      const result = await response.json();
      setOverview(result.data);
    } catch (error) {
      toast.error('Failed to load AI Intelligence overview');
    } finally {
      setLoading(false);
    }
  }, [userId, timeRange]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return {
    overview,
    loading,
    refresh: fetchOverview
  };
} 