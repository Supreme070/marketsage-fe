/**
 * Collaborative AI Chat Component
 * ==============================
 * Multi-user AI chat interface with real-time collaboration features
 */

"use client";

import type React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Brain, Send, Users, Share2, MessageSquare, Bot, User, Loader2, 
  Eye, Hand, AtSign, Bell, Activity, Copy, ThumbsUp, Settings,
  UserPlus, Video, Phone, MoreHorizontal, Minimize2, Maximize2
} from 'lucide-react';
import { toast } from 'sonner';
import { useSupremeAI } from '@/hooks/useSupremeAI';
import { useCollaboration } from '@/hooks/useCollaboration';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface CollaborativeAIChatProps {
  sessionId?: string;
  initialParticipants?: string[];
  workspaceId?: string;
  className?: string;
  showParticipants?: boolean;
  allowInvites?: boolean;
  compactMode?: boolean;
}

export function CollaborativeAIChat({
  sessionId = `ai-session-${Date.now()}`,
  initialParticipants = [],
  workspaceId,
  className,
  showParticipants = true,
  allowInvites = true,
  compactMode = false
}: CollaborativeAIChatProps) {
  const { data: session } = useSession();
  const [chatInput, setChatInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(!compactMode);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Hooks
  const aiChat = useSupremeAI();
  const collaboration = useCollaboration();

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [aiChat.messages, scrollToBottom]);

  // Join AI session on mount
  useEffect(() => {
    if (collaboration.isConnected && sessionId) {
      collaboration.joinAISession(sessionId);
    }

    return () => {
      if (collaboration.currentAISession === sessionId) {
        collaboration.leaveAISession();
      }
    };
  }, [collaboration.isConnected, sessionId]);

  // Handle mention detection
  const handleInputChange = (value: string) => {
    setChatInput(value);

    // Detect @mentions
    const mentionMatch = value.match(/@(\w*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }

    // Handle typing indicators
    if (!collaboration.typingUsers.includes(session?.user?.id || '')) {
      collaboration.startTyping();
    }

    // Clear previous timeout and set new one
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      collaboration.stopTyping();
    }, 1000);
  };

  // Send message
  const handleSendMessage = async () => {
    if (!chatInput.trim() || aiChat.isLoading) return;
    
    try {
      // Stop typing indicator
      collaboration.stopTyping();
      
      // Create message with collaboration metadata
      const messageData = {
        content: chatInput,
        sessionId,
        participants: collaboration.aiSessionParticipants.map(p => p.userId),
        timestamp: new Date()
      };

      // Send to AI
      await aiChat.sendMessage(chatInput, { 
        enableTaskExecution: true,
        sessionId,
        collaborationMode: true
      });

      // Send to collaboration
      collaboration.sendAIMessage(sessionId, messageData);

      // Check for mentions and notify users
      const mentions = chatInput.match(/@(\w+)/g);
      if (mentions) {
        mentions.forEach(mention => {
          const username = mention.slice(1);
          const user = collaboration.activeUsers.find(u => 
            u.name.toLowerCase().includes(username.toLowerCase()) ||
            u.email.toLowerCase().includes(username.toLowerCase())
          );
          if (user && user.id !== session?.user?.id) {
            collaboration.mentionUser(user.id, chatInput);
          }
        });
      }

      setChatInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Share AI response
  const handleShareResponse = (messageId: string) => {
    const message = aiChat.messages.find(m => m.id === messageId);
    if (!message) return;

    const participantIds = collaboration.aiSessionParticipants
      .map(p => p.userId)
      .filter(id => id !== session?.user?.id);

    if (participantIds.length > 0) {
      collaboration.shareAIResponse(participantIds, {
        id: messageId,
        content: message.content,
        timestamp: message.timestamp
      });
      toast.success(`Shared with ${participantIds.length} participant(s)`);
    } else {
      toast.info('No other participants to share with');
    }
  };

  // Insert mention
  const insertMention = (user: any) => {
    const beforeMention = chatInput.replace(/@\w*$/, '');
    const newInput = `${beforeMention}@${user.name} `;
    setChatInput(newInput);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  // Get typing users display
  const getTypingDisplay = () => {
    const typingOthers = collaboration.typingUsers.filter(userId => userId !== session?.user?.id);
    if (typingOthers.length === 0) return null;

    const typingNames = typingOthers.map(userId => {
      const user = collaboration.getUserById(userId);
      return user?.name || 'Someone';
    });

    if (typingNames.length === 1) {
      return `${typingNames[0]} is typing...`;
    } else if (typingNames.length === 2) {
      return `${typingNames[0]} and ${typingNames[1]} are typing...`;
    } else {
      return `${typingNames.length} people are typing...`;
    }
  };

  // Filter users for mentions
  const filteredUsers = collaboration.activeUsers.filter(user => 
    user.id !== session?.user?.id &&
    (user.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
     user.email.toLowerCase().includes(mentionQuery.toLowerCase()))
  );

  if (compactMode && !isExpanded) {
    return (
      <Card className={cn("w-80 fixed bottom-4 right-4 z-50", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">AI Collaboration</span>
              {collaboration.aiSessionParticipants.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {collaboration.aiSessionParticipants.length + 1} users
                </Badge>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExpanded(true)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className={cn("flex flex-col h-full", className)}>
        {/* Header */}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Collaborative AI Assistant</h3>
              </div>
              
              {/* Connection Status */}
              <Badge 
                variant={collaboration.isConnected ? "default" : "destructive"}
                className="text-xs"
              >
                <div className={cn(
                  "w-2 h-2 rounded-full mr-1",
                  collaboration.isConnected ? "bg-green-500" : "bg-red-500"
                )} />
                {collaboration.isConnected ? 'Connected' : 'Disconnected'}
              </Badge>

              {/* Participants Count */}
              {collaboration.aiSessionParticipants.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  {collaboration.aiSessionParticipants.length + 1}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              {allowInvites && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Invite Users</TooltipContent>
                </Tooltip>
              )}
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>

              {compactMode && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsExpanded(false)}
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Participants List */}
          {showParticipants && collaboration.aiSessionParticipants.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">Active participants:</span>
              <div className="flex -space-x-1">
                {collaboration.aiSessionParticipants.slice(0, 5).map((participant) => (
                  <Tooltip key={participant.userId}>
                    <TooltipTrigger asChild>
                      <Avatar className="w-6 h-6 border-2 border-white">
                        <AvatarImage src={participant.avatar} />
                        <AvatarFallback className="text-xs">
                          {participant.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>{participant.name}</TooltipContent>
                  </Tooltip>
                ))}
                {collaboration.aiSessionParticipants.length > 5 && (
                  <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                    <span className="text-xs">+{collaboration.aiSessionParticipants.length - 5}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full px-4">
            <div className="space-y-4 pb-4">
              {aiChat.messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">Start a collaborative AI conversation</p>
                  <p className="text-xs mt-1">Use @mentions to notify team members</p>
                </div>
              ) : (
                aiChat.messages.map((message, index) => (
                  <div key={index} className={cn(
                    "flex gap-3",
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  )}>
                    {message.sender === 'ai' && (
                      <Avatar className="w-8 h-8 mt-1">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      message.sender === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    )}>
                      <div className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </div>
                      
                      {message.sender === 'ai' && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-xs"
                            onClick={() => navigator.clipboard.writeText(message.content)}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-xs"
                            onClick={() => handleShareResponse(message.id || String(index))}
                          >
                            <Share2 className="w-3 h-3 mr-1" />
                            Share
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {message.sender === 'user' && (
                      <Avatar className="w-8 h-8 mt-1">
                        <AvatarFallback className="bg-gray-200">
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              )}

              {/* Typing Indicator */}
              {getTypingDisplay() && (
                <div className="flex items-center gap-2 text-xs text-gray-500 animate-pulse">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  {getTypingDisplay()}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>

        {/* Input Area */}
        <div className="p-4 border-t relative">
          {/* Mention Suggestions */}
          {showMentions && filteredUsers.length > 0 && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border rounded-lg shadow-lg max-h-32 overflow-y-auto z-10">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 text-left"
                  onClick={() => insertMention(user)}
                >
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {user.status}
                  </Badge>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={chatInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask AI anything... (use @name to mention teammates)"
                className="min-h-[44px] max-h-32 resize-none pr-12"
                disabled={aiChat.isLoading || !collaboration.isConnected}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0"
                onClick={() => setShowMentions(!showMentions)}
              >
                <AtSign className="w-4 h-4" />
              </Button>
            </div>
            
            <Button 
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || aiChat.isLoading || !collaboration.isConnected}
              className="h-11"
            >
              {aiChat.isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Status Info */}
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>
                {collaboration.isConnected ? 'Connected' : 'Connecting...'}
              </span>
              {collaboration.aiSessionParticipants.length > 0 && (
                <span>
                  {collaboration.aiSessionParticipants.length + 1} participant(s)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">⏎</kbd>
              <span>Send</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">⇧⏎</kbd>
              <span>New line</span>
            </div>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}

export default CollaborativeAIChat;