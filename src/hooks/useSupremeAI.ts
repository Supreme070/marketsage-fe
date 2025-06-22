/**
 * Supreme-AI v3 React Hooks - Enhanced Local Processing
 * ====================================================
 * Supreme-AI integration with task execution capabilities
 */

'use client';

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface SupremeAIResponse {
  success: boolean;
  data: {
    answer: string;
    source?: string;
    model?: string;
    taskExecution?: any;
  };
  confidence?: number;
  mode?: string;
  processingTime?: number;
  meta?: {
    processingTime: number;
    version: string;
    timestamp: string;
    requestId: string;
  };
}

export const useSupremeAI = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  // Intelligent task type detection
  const detectTaskType = useCallback((content: string): { type: string; taskType?: string } => {
    const lowerContent = content.toLowerCase();
    
    // Task assignment patterns
    const taskPatterns = {
      'assign_task': ['assign task', 'create task', 'task assignment', 'give task', 'assign to team', 'delegate task', 'assign urgent', 'create urgent task'],
      'create_workflow': ['create workflow', 'build workflow', 'make workflow', 'set up workflow', 'workflow creation', 'automate process'],
      'create_campaign': ['create campaign', 'build campaign', 'campaign creation', 'email campaign', 'marketing campaign', 'launch campaign'],
      'create_segment': ['create segment', 'customer segment', 'segment customers', 'build segment', 'customer group'],
      'generate_content': ['generate content', 'create content', 'write content', 'content creation', 'marketing content'],
      'setup_automation': ['setup automation', 'create automation', 'build automation', 'automate', 'automated flow']
    };
    
    // Check for task patterns
    for (const [taskType, patterns] of Object.entries(taskPatterns)) {
      for (const pattern of patterns) {
        if (lowerContent.includes(pattern)) {
          return { type: 'task', taskType };
        }
      }
    }
    
    // Check for other action types
    if (lowerContent.includes('analyze') || lowerContent.includes('analysis')) {
      return { type: 'analyze' };
    }
    
    if (lowerContent.includes('predict') || lowerContent.includes('forecast')) {
      return { type: 'predict' };
    }
    
    // Default to question for conversational queries
    return { type: 'question' };
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: content.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Check if user has admin privileges for task execution
      const hasAdminPrivileges = session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMIN' || session?.user?.role === 'IT_ADMIN';
      
      if (!session?.user) {
        throw new Error('Please log in to use AI task execution');
      }
      
      // Detect the appropriate task type
      const { type, taskType } = detectTaskType(content.trim());
      
      const requestBody: any = {
        type,
        question: content.trim(),
        userId: session.user.id,
        enableTaskExecution: hasAdminPrivileges, // Only enable for users with admin privileges
        forceLocal: false, // Allow OpenAI + Supreme-AI hybrid mode
      };
      
      // Add taskType if it's a task request
      if (taskType) {
        requestBody.taskType = taskType;
      }
      
      console.log('🔍 Detected task type:', { type, taskType, content: content.trim(), hasAdminPrivileges, userRole: session?.user?.role });
      
      // Show user feedback about task execution capabilities
      if (type === 'task' && !hasAdminPrivileges) {
        toast.error('Task execution requires ADMIN, IT_ADMIN, or SUPER_ADMIN privileges');
      }

      const response = await fetch('/api/ai/supreme-v3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: SupremeAIResponse = await response.json();

      if (!data.success) {
        throw new Error('Supreme-AI request failed');
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        content: data.data.answer,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Show task execution feedback if available
      if (data.data.taskExecution) {
        console.log('✅ Task execution result:', data.data.taskExecution);
        if (data.data.taskExecution.success) {
          toast.success('Task executed successfully!');
        }
      }

    } catch (error) {
      console.error('Supreme-AI request failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get Supreme-AI response';
      setError(errorMessage);
      toast.error('Failed to process request - Supreme-AI error');
    } finally {
      setIsLoading(false);
    }
  }, [detectTaskType]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}; 