"use client";

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, Brain, Send, User, Bot, Sparkles, 
  Clock, TrendingUp, Users, Mail, Zap, Lightbulb,
  CheckCircle, AlertCircle, ArrowRight
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
    <div className="container mx-auto p-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-400" />
                Supreme-AI Assistant
                <Badge variant="secondary" className="ml-2">v3.0</Badge>
              </CardTitle>
              <CardDescription>
                Your intelligent partner for MarketSage optimization
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
                        {/* Message Content */}
                        <p className="text-sm leading-relaxed">{message.content}</p>

                        {/* Thought Process */}
                        {message.thoughts && message.thoughts.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-700/50">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="h-4 w-4 text-yellow-400" />
                              <span className="text-xs font-medium text-yellow-400">Thought Process</span>
                            </div>
                            {message.thoughts.map((thought: any, i: number) => (
                              <div key={i} className="mb-2">
                                <div className="flex items-center gap-2 text-xs text-gray-300">
                                  <span className="font-medium">{thought.type}</span>
                                  <span className="text-gray-500">•</span>
                                  <span className="text-gray-400">{Math.round(thought.confidence * 100)}% confidence</span>
                                </div>
                                <ul className="mt-1 space-y-1">
                                  {thought.steps.map((step: string, j: number) => (
                                    <li key={j} className="flex items-center gap-2 text-xs text-gray-400">
                                      <ArrowRight className="h-3 w-3" />
                                      {step}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        {message.actions && message.actions.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-700/50">
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className="h-4 w-4 text-green-400" />
                              <span className="text-xs font-medium text-green-400">Suggested Actions</span>
                            </div>
                            <div className="space-y-2">
                              {message.actions.map((action: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  {action.type === 'suggestion' ? (
                                    <CheckCircle className="h-3 w-3 text-green-400" />
                                  ) : (
                                    <AlertCircle className="h-3 w-3 text-yellow-400" />
                                  )}
                                  <span className="text-gray-300">{action.details.content || action.details.action}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

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
                    <p className="text-muted-foreground mb-6">I can help optimize your marketing strategies and improve campaign performance.</p>
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
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-blue-400 animate-pulse" />
                      <span className="text-sm text-gray-400">Thinking...</span>
                    </div>
                    <div className="flex gap-1 mt-2">
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
            <div className="p-4 border-t border-gray-800">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1"
                  disabled={isTyping || chat.loading}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={isTyping || chat.loading || !inputMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Access Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-400" />
                Quick Questions
              </CardTitle>
              <CardDescription>
                Common queries to get you started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left"
                    onClick={() => handleQuickQuestion(question)}
                  >
                    <span className="truncate">{question}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Feature Highlights */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                AI Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Brain className="h-5 w-5 text-blue-400" />
                  <div>
                    <h4 className="text-sm font-medium">Dynamic Thinking</h4>
                    <p className="text-xs text-gray-400">Advanced problem-solving with context awareness</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-purple-400" />
                  <div>
                    <h4 className="text-sm font-medium">Behavioral Analysis</h4>
                    <p className="text-xs text-gray-400">Customer patterns and predictions</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-red-400" />
                  <div>
                    <h4 className="text-sm font-medium">Campaign Optimization</h4>
                    <p className="text-xs text-gray-400">Data-driven marketing improvements</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-400" />
                  <div>
                    <h4 className="text-sm font-medium">Predictive Analytics</h4>
                    <p className="text-xs text-gray-400">Future trends and opportunities</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 