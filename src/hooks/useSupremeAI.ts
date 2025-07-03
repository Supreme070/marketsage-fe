/**
 * Supreme-AI v3 React Hooks - Enhanced Local Processing
 * ====================================================
 * Supreme-AI integration with task execution capabilities
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
// Quantum AI removed - using Supreme-AI v3 directly

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  // Quantum optimization removed - using Supreme-AI v3 direct processing
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
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  // Quantum optimizations removed - direct Supreme-AI processing
  const [chatSession, setChatSession] = useState<any>(null);
  const { data: session } = useSession();

  // Generate session ID and load chat history on mount
  useEffect(() => {
    if (!session?.user?.id) return;

    // Get or create session ID
    let sessionId = localStorage.getItem('chatSessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chatSessionId', sessionId);
    }
    setCurrentSessionId(sessionId);

    // Initialize Supreme-AI chat session
    const supremeSession = {
      sessionId,
      userId: session.user.id,
      messages: [],
      context: {},
      startTime: new Date(),
      lastActivity: new Date(),
      market: (session.user as any)?.market || 'NGN',
      userProfile: {
        role: session.user.role || 'USER',
        expertise: [],
        preferences: {},
        interaction_history: []
      }
    };
    setChatSession(supremeSession);

    // Load chat history
    loadChatHistory(sessionId);
  }, [session?.user?.id]);

  // Load chat history from database
  const loadChatHistory = useCallback(async (sessionId: string) => {
    if (!session?.user?.id) return;

    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/api/ai/chat-history?sessionId=${sessionId}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.messages) {
          const formattedMessages = data.messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            role: msg.role,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(formattedMessages);
        }
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [session?.user?.id]);

  // Save message to database
  const saveMessageToDatabase = useCallback(async (message: ChatMessage, isResponse = false, context?: any) => {
    if (!session?.user?.id || !currentSessionId) return;

    try {
      await fetch('/api/ai/chat-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          question: message.role === 'user' ? message.content : '',
          answer: message.role === 'assistant' ? message.content : '',
          context: context ? JSON.stringify(context) : null,
          confidence: 0.95
        })
      });
    } catch (error) {
      console.error('Failed to save message to database:', error);
    }
  }, [session?.user?.id, currentSessionId]);

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
    
    // Business Intelligence queries - these should trigger analysis
    const biPatterns = [
      'who is the best performing', 'best performing', 'top performing', 'highest performing',
      'team performance', 'staff performance', 'employee performance',
      'conversion rate', 'conversion by channel', 'channel performance',
      'revenue breakdown', 'revenue analysis', 'financial performance',
      'customer acquisition cost', 'cac', 'acquisition metrics',
      'workflow completion', 'workflow success', 'automation performance',
      'how many sales', 'how many marketing', 'count of', 'personnel count',
      'sales data', 'marketing data', 'performance metrics'
    ];
    
    for (const pattern of biPatterns) {
      if (lowerContent.includes(pattern)) {
        return { type: 'analyze' };
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
    if (!content.trim() || !chatSession) return;

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
      
      // Enhanced intent recognition via Supreme-AI v3 built-in intelligence
      console.log('🧠 Supreme-AI v3 processing intent for:', content.trim());
      
      const requestBody: any = {
        type,
        question: content.trim(),
        userId: session.user.id,
        enableTaskExecution: hasAdminPrivileges,
        forceLocal: false
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

      // Update chat session with new message
      const updatedChatSession = {
        ...chatSession,
        messages: [...chatSession.messages, userMessage],
        lastActivity: new Date()
      };
      
      console.log('✅ Supreme-AI v3 response received:', data.data.answer);
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        content: data.data.answer,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      // Supreme-AI v3 handles all optimizations internally
      
      // Update chat session
      setChatSession({
        ...updatedChatSession,
        messages: [...updatedChatSession.messages, assistantMessage]
      });

      // Save user and assistant messages to database
      await saveMessageToDatabase(userMessage);
      await saveMessageToDatabase(assistantMessage, true, {
        confidence: data.confidence,
        processingTime: data.processingTime,
        source: data.data.source,
        taskExecution: data.data.taskExecution
      });
      
      // Show Supreme-AI feedback
      if (data.confidence && data.confidence > 0.8) {
        toast.success(`🧠 Supreme-AI v3 high confidence response (${(data.confidence * 100).toFixed(1)}%)`);
      }
      
      // Show task execution feedback if available
      if (data.data.taskExecution) {
        console.log('✅ Task execution result:', data.data.taskExecution);
        if (data.data.taskExecution.success) {
          toast.success('Task executed successfully!');
        }
      }
      
      // Show recommendations if available from Supreme-AI
      if (data.data.recommendations && data.data.recommendations.length > 0) {
        setTimeout(() => {
          toast.success(`🎯 ${data.data.recommendations.length} AI recommendations available`);
        }, 2000);
      }

    } catch (error) {
      console.error('Supreme-AI request failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get Supreme-AI response';
      setError(errorMessage);
      toast.error('Failed to process request - Supreme-AI error');
    } finally {
      setIsLoading(false);
    }
  }, [detectTaskType, chatSession, session?.user]);

  const clearMessages = useCallback(async () => {
    if (!currentSessionId) return;

    try {
      // Clear from database
      const response = await fetch(`/api/ai/chat-history?sessionId=${currentSessionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Clear local state
        setMessages([]);
        setError(null);
        toast.success('Chat history cleared');
      }
    } catch (error) {
      console.error('Failed to clear chat history:', error);
      toast.error('Failed to clear chat history');
    }
  }, [currentSessionId]);

  const startNewSession = useCallback(() => {
    // Generate new session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('chatSessionId', sessionId);
    setCurrentSessionId(sessionId);
    
    // Initialize new Supreme-AI chat session
    if (session?.user) {
      const supremeSession = {
        sessionId,
        userId: session.user.id,
        messages: [],
        context: {},
        startTime: new Date(),
        lastActivity: new Date(),
        market: (session.user as any)?.market || 'NGN',
        userProfile: {
          role: session.user.role || 'USER',
          expertise: [],
          preferences: {},
          interaction_history: []
        }
      };
      setChatSession(supremeSession);
    }
    
    // Clear current messages
    setMessages([]);
    setError(null);
    
    toast.success('🧠 New Supreme-AI chat session started');
  }, [session?.user]);

  return {
    messages,
    isLoading,
    isLoadingHistory,
    error,
    sendMessage,
    clearMessages,
    startNewSession,
    currentSessionId,
    chatSession
  };
}; 