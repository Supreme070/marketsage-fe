"use client";

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, Brain, Send, User, Bot, Sparkles, 
  Clock, TrendingUp, Users, Mail, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useSupremeChat } from '@/hooks/useSupremeAI';

export default function AIChatPage() {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const chat = useSupremeChat("dashboard-user");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    setIsTyping(true);
    try {
      await chat.ask(inputMessage);
      setInputMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "How can I improve my email campaign performance?",
    "What are the best times to send WhatsApp messages to Nigerian customers?",
    "Analyze my customer churn risk",
    "Show me conversion optimization opportunities",
    "What's driving my revenue growth?",
    "Help me set up a new campaign workflow"
  ];

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
            <MessageSquare className="h-8 w-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              AI Chat Assistant
              <Badge variant="secondary" className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-400 border-blue-500/20">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                Online
              </Badge>
            </h1>
            <p className="text-muted-foreground">Chat with Supreme-AI about your MarketSage data • Get insights • Ask questions • Receive recommendations</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-400" />
                Supreme-AI Assistant
              </CardTitle>
              <CardDescription>
                Ask me anything about your MarketSage data and campaigns
              </CardDescription>
            </CardHeader>
            
            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
              <AnimatePresence>
                {chat.messages?.length > 0 ? (
                  chat.messages.map((message: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="p-2 bg-blue-500/20 rounded-full">
                          <Bot className="h-4 w-4 text-blue-400" />
                        </div>
                      )}
                      
                      <div className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-blue-500/20 text-blue-100 border border-blue-500/30' 
                          : 'bg-gray-800/50 text-gray-100 border border-gray-700/50'
                      }`}>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date().toLocaleTimeString()}
                        </p>
                      </div>
                      
                      {message.role === 'user' && (
                        <div className="p-2 bg-green-500/20 rounded-full">
                          <User className="h-4 w-4 text-green-400" />
                        </div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Brain className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-white mb-2">Start a conversation with Supreme-AI</h3>
                    <p className="text-muted-foreground mb-6">Ask me about your campaigns, customers, or any MarketSage feature.</p>
                  </div>
                )}
              </AnimatePresence>
              
              {/* Typing indicator */}
              {(isTyping || chat.loading) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="p-2 bg-blue-500/20 rounded-full">
                    <Bot className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="bg-gray-800/50 border border-gray-700/50 p-3 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </CardContent>
            
            {/* Input */}
            <div className="p-4 border-t border-gray-700/50">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Supreme-AI about your campaigns, customers, or get recommendations..."
                  className="flex-1"
                  disabled={chat.loading}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || chat.loading}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions & Info */}
        <div className="space-y-6">
          {/* Quick Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-400" />
                Quick Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 px-3 text-xs whitespace-normal"
                    onClick={() => handleQuickQuestion(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Chat Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Messages Today</span>
                  <span className="font-medium">{chat.messages?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Response Time</span>
                  <span className="font-medium">1.2s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">AI Accuracy</span>
                  <span className="font-medium text-green-400">94%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Conversations</span>
                  <span className="font-medium">147</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle>What Supreme-AI Can Help With</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-sm">Campaign Performance Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span className="text-sm">Customer Segmentation Insights</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-purple-400" />
                  <span className="text-sm">Content Optimization Tips</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm">Workflow Automation Setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-red-400" />
                  <span className="text-sm">Predictive Analytics</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 