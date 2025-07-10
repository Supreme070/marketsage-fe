"use client";

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain, Send, ArrowLeft, RotateCcw, Plus, Copy, ThumbsUp, ThumbsDown,
  Sparkles, Zap, MessageSquare, Bot, User, Loader2, Settings, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { useSupremeAI } from '@/hooks/useSupremeAI';
import { MarkdownRenderer } from '@/components/ai/MarkdownRenderer';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AIChatPage() {
  const [chatInput, setChatInput] = useState('');
  const [showMetrics, setShowMetrics] = useState(false);
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Supreme-AI Chat Hook
  const aiChat = useSupremeAI();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [aiChat.messages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || aiChat.isLoading) return;
    
    try {
      await aiChat.sendMessage(chatInput, streamingEnabled);
      setChatInput('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      toast.error('Failed to send message to Supreme-AI');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const exportConversation = () => {
    const conversationData = {
      sessionId: aiChat.currentSessionId,
      messages: aiChat.messages,
      exportedAt: new Date().toISOString(),
      metadata: {
        messageCount: aiChat.messages.length,
        streamingEnabled,
        version: 'supreme-ai-v3'
      }
    };

    const blob = new Blob([JSON.stringify(conversationData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supreme-ai-conversation-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Conversation exported successfully');
  };

  const quickPrompts = [
    "Analyze customer behavior for the past month",
    "Create a retention campaign for high-value customers",
    "Assign task to sales team for follow-up",
    "Generate insights on email campaign performance"
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/intelligence">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Intelligence
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900 dark:text-white">Supreme-AI</h1>
              <p className="text-xs text-slate-500">Fintech automation assistant</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
            Online
          </Badge>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowMetrics(!showMetrics)}
            className={cn(showMetrics && 'bg-slate-100 dark:bg-slate-800')}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Performance Metrics Bar */}
      {showMetrics && (
        <div className="border-b bg-slate-50 dark:bg-slate-800 px-6 py-3">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-slate-600 dark:text-slate-300">Messages: {aiChat.messages.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-slate-600 dark:text-slate-300">Session: {aiChat.currentSessionId?.slice(-8) || 'New'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-slate-600 dark:text-slate-300">Streaming: {streamingEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStreamingEnabled(!streamingEnabled)}
              className="text-xs h-6"
            >
              Toggle Streaming
            </Button>
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="flex-1 flex">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {aiChat.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mb-6">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">
                  Welcome to Supreme-AI
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                  Your intelligent assistant for African fintech automation. I can help you create campaigns, 
                  analyze customer data, assign tasks, and optimize your business operations.
                </p>
                
                {/* Quick Prompts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                  {quickPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setChatInput(prompt)}
                      className="p-4 text-left bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 group"
                    >
                      <div className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {prompt}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-6">
                {aiChat.messages.map((message, index) => (
                  <div key={index} className={cn(
                    "flex gap-4",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}>
                    {message.role === 'assistant' && (
                      <Avatar className="w-8 h-8 border">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={cn(
                      "max-w-[70%] rounded-2xl px-4 py-3 relative group",
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white ml-12' 
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                    )}>
                      <div className="text-sm leading-relaxed">
                        {message.role === 'assistant' ? (
                          <MarkdownRenderer content={message.content} />
                        ) : (
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        )}
                      </div>
                      
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-slate-500 hover:text-slate-700"
                            onClick={() => copyToClipboard(message.content)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-slate-500 hover:text-green-600"
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-slate-500 hover:text-red-600"
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {message.role === 'user' && (
                      <Avatar className="w-8 h-8 border">
                        <AvatarFallback className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                
                {aiChat.isLoading && (
                  <div className="flex gap-4 justify-start">
                    <Avatar className="w-8 h-8 border">
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 max-w-[70%]">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Supreme-AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-6 py-4">
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={chatInput}
                  onChange={(e) => {
                    setChatInput(e.target.value);
                    adjustTextareaHeight();
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Supreme-AI..."
                  className="min-h-[52px] max-h-[200px] resize-none border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl pr-12 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={aiChat.isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || aiChat.isLoading}
                  size="sm"
                  className="absolute right-2 bottom-2 w-8 h-8 p-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {aiChat.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                <span>Supreme-AI can make mistakes. Verify important information.</span>
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" className="h-6 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    New Chat
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs"
                    onClick={exportConversation}
                    disabled={aiChat.messages.length === 0}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs"
                    onClick={aiChat.clearMessages}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 border-l bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-6 hidden xl:block">
          <div className="space-y-6">
            {/* AI Capabilities */}
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Capabilities</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Zap className="h-4 w-4 text-blue-500" />
                  Task automation & execution
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Brain className="h-4 w-4 text-purple-500" />
                  Customer behavior analysis
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  Campaign creation & optimization
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <BarChart3 className="h-4 w-4 text-orange-500" />
                  Real-time streaming responses
                </div>
              </div>
            </div>

            {/* Model Info */}
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Model Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Version</span>
                  <Badge variant="outline" className="text-xs">Supreme-AI v3</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Status</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600">Active</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Streaming</span>
                  <div className="flex items-center gap-1">
                    <div className={cn("w-2 h-2 rounded-full", streamingEnabled ? "bg-blue-500" : "bg-gray-400")}></div>
                    <span className="text-xs text-slate-500">{streamingEnabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Markdown</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-xs text-purple-600">Enabled</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Session Info */}
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Session</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Messages</span>
                  <span className="text-xs text-slate-500">{aiChat.messages.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Session ID</span>
                  <span className="text-xs text-slate-500 font-mono">{aiChat.currentSessionId?.slice(-8) || 'New'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Loading</span>
                  <div className="flex items-center gap-1">
                    <div className={cn("w-2 h-2 rounded-full", aiChat.isLoading ? "bg-yellow-500" : "bg-gray-400")}></div>
                    <span className="text-xs text-slate-500">{aiChat.isLoading ? 'Processing' : 'Ready'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-sm h-9"
                  onClick={() => setChatInput("Analyze top performing customers this month")}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Analyze Customers
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-sm h-9"
                  onClick={() => setChatInput("Create a WhatsApp campaign for new product launch")}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-sm h-9"
                  onClick={() => setChatInput("Assign follow-up tasks to sales team")}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Assign Tasks
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-sm h-9"
                  onClick={() => setChatInput("Generate a markdown report of our email campaign performance")}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}