"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, MessageSquare, RefreshCw, Send, Sparkles, Zap, ArrowLeft, RotateCcw, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { useSupremeAI } from '@/hooks/useSupremeAI';
import Link from 'next/link';

export default function AIChatPage() {
  const [chatInput, setChatInput] = useState('');

  // Supreme-AI Chat Hook
  const aiChat = useSupremeAI();

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    try {
      await aiChat.sendMessage(chatInput);
      setChatInput('');
    } catch (error) {
      toast.error('Failed to send message to Supreme-AI');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ai-intelligence">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Intelligence
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Supreme-AI Assistant</h1>
            <p className="text-gray-400">Advanced AI assistant for African fintech automation and task execution</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-purple-400 border-purple-400 bg-purple-900/20">
            🤖 AI Assistant
          </Badge>
          <Badge variant="outline" className="text-green-400 border-green-400 bg-green-900/20">
            Task Execution Enabled
          </Badge>
          {aiChat.currentSessionId && (
            <Badge variant="outline" className="text-blue-400 border-blue-400 bg-blue-900/20">
              Session: {aiChat.currentSessionId.slice(-8)}
            </Badge>
          )}
        </div>
      </div>

      {/* Supreme-AI Chat Interface */}
      <Card className="flex flex-col" style={{ height: 'calc(100vh - 220px)' }}>
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-400" />
              🤖 Supreme-AI Assistant
              <Badge variant="secondary" className="ml-2 bg-purple-900/30 text-purple-300 border-purple-700">
                Professional
              </Badge>
              {aiChat.isLoadingHistory && (
                <Badge variant="outline" className="text-orange-400 border-orange-400 bg-orange-900/20">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Loading History
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {aiChat.messages.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={aiChat.startNewSession}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  New Session
                </Button>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            Advanced AI assistant for workflow creation, campaign building, and automated task execution
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col min-h-0">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 border rounded-lg bg-muted/20 min-h-0">
            {aiChat.isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-purple-400" />
                  <p className="text-sm text-muted-foreground">Loading your conversation history...</p>
                </div>
              </div>
            ) : aiChat.messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Brain className="h-16 w-16 mx-auto mb-4 opacity-60 text-purple-400" />
                <h3 className="text-xl font-medium mb-3 text-purple-300">🤖 MarketSage AI Ready</h3>
                <p className="text-lg mb-4">Professional fintech automation assistant ready to execute your business tasks.</p>
                
                <div className="text-left max-w-2xl mx-auto space-y-3 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg bg-purple-900/20">
                      <h4 className="font-semibold text-purple-300 mb-2">⚡ Workflow Manifestation</h4>
                      <p>"Create Nigerian onboarding workflow with BVN verification"</p>
                    </div>
                    
                    <div className="p-3 border rounded-lg bg-blue-900/20">
                      <h4 className="font-semibold text-blue-300 mb-2">📱 Campaign Creation</h4>
                      <p>"Build WhatsApp campaign for Kenyan diaspora"</p>
                    </div>
                    
                    <div className="p-3 border rounded-lg bg-green-900/20">
                      <h4 className="font-semibold text-green-300 mb-2">👥 Team Delegation</h4>
                      <p>"Assign campaign review to marketing team"</p>
                    </div>
                    
                    <div className="p-3 border rounded-lg bg-orange-900/20">
                      <h4 className="font-semibold text-orange-300 mb-2">🌍 Cross-Border Automation</h4>
                      <p>"Setup Ghana to UK remittance automation"</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 border-2 border-purple-500/30 rounded-lg bg-purple-900/10">
                    <h4 className="font-semibold text-purple-300 mb-2">🌍 African Market Expertise:</h4>
                    <ul className="text-xs space-y-1">
                      <li>🇳🇬 Nigeria: CBN compliance, BVN integration, regulatory frameworks</li>
                      <li>🇰🇪 Kenya: M-Pesa integration, Safaricom ecosystem, mobile money</li>
                      <li>🇿🇦 South Africa: Banking regulation compliance, payment systems</li>
                      <li>🇬🇭 Ghana: Mobile money platforms, GhIPSS integration</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {aiChat.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-4 ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-card border border-purple-200/20"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-2 mb-3">
                          <Brain className="h-5 w-5 text-purple-400" />
                          <span className="text-sm font-medium text-purple-400">🤖 MarketSage AI</span>
                          <Badge variant="outline" className="text-xs">
                            Assistant
                          </Badge>
                        </div>
                      )}
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </div>
                      <div className="text-xs opacity-70 mt-3 flex items-center gap-2">
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                        {message.role === "assistant" && (
                          <Badge variant="outline" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {aiChat.isLoading && (
              <div className="flex justify-start">
                <div className="bg-card border border-purple-200/20 p-4 rounded-lg max-w-[85%]">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-5 w-5 text-purple-400 animate-pulse" />
                    <span className="text-sm font-medium text-purple-400">🤖 Supreme-AI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-purple-400 border-t-transparent rounded-full"></div>
                    <span className="text-sm text-muted-foreground">
                      Processing your request and creating automation solution...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="border-t pt-4 flex-shrink-0">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Ask Supreme-AI to create workflows, campaigns, segments, or automate tasks..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-background"
                disabled={aiChat.isLoading}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={aiChat.isLoading || !chatInput.trim()}
                className="px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                size="lg"
              >
                {aiChat.isLoading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                {aiChat.messages.length > 0 && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={aiChat.clearMessages}
                      className="text-xs"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Clear Session
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={aiChat.startNewSession}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      New Session
                    </Button>
                  </>
                )}
                {aiChat.currentSessionId && (
                  <span className="text-xs text-muted-foreground">
                    Session: {aiChat.currentSessionId.slice(-8)}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="h-3 w-3 text-green-400" />
                <span>Task Execution: Active</span>
              </div>
            </div>

            {aiChat.error && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  <span className="font-medium">MarketSage AI - System Issue:</span>
                </div>
                <p className="mt-1">{aiChat.error}</p>
                <p className="text-xs mt-2 opacity-70">Technical support is continuously monitoring system performance for optimal service delivery.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-muted/20 transition-colors" 
              onClick={() => setChatInput("Create Nigerian fintech onboarding workflow with BVN verification")}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">🇳🇬</div>
            <div className="font-medium text-sm">Nigeria Onboarding</div>
            <div className="text-xs text-muted-foreground mt-1">BVN + CBN Compliance</div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-muted/20 transition-colors"
              onClick={() => setChatInput("Build WhatsApp marketing campaign for Kenyan diaspora in Canada")}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">🇰🇪</div>
            <div className="font-medium text-sm">Kenya WhatsApp</div>
            <div className="text-xs text-muted-foreground mt-1">M-Pesa Integration</div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-muted/20 transition-colors"
              onClick={() => setChatInput("Create cross-border remittance automation from Ghana to UK")}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">🌍</div>
            <div className="font-medium text-sm">Cross-Border</div>
            <div className="text-xs text-muted-foreground mt-1">Ghana → UK Flow</div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-muted/20 transition-colors"
              onClick={() => setChatInput("Assign urgent campaign optimization task to marketing team lead")}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">👥</div>
            <div className="font-medium text-sm">Team Delegation</div>
            <div className="text-xs text-muted-foreground mt-1">Task Assignment</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 