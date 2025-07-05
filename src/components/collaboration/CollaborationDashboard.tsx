/**
 * Collaboration Dashboard Component
 * ================================
 * Central hub for real-time collaboration features and multi-user AI assistance
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Users, Brain, Activity, Bell, MessageSquare, Eye, Hand, 
  Settings, Plus, Share2, Zap, Clock, CheckCircle, AlertCircle,
  Workspace, Video, Phone, Coffee, CircleSlash as Busy, Moon, Wifi, WifiOff, AtSign
} from 'lucide-react';
import { toast } from 'sonner';
import { useCollaboration } from '@/hooks/useCollaboration';
import { useSession } from 'next-auth/react';
import { CollaborativeAIChat } from './CollaborativeAIChat';
import { cn } from '@/lib/utils';

interface CollaborationDashboardProps {
  className?: string;
  defaultTab?: string;
  compactMode?: boolean;
}

export function CollaborationDashboard({ 
  className,
  defaultTab = "overview",
  compactMode = false 
}: CollaborationDashboardProps) {
  const { data: session } = useSession();
  const collaboration = useCollaboration();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Status icon mapping
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'away': return <Coffee className="w-3 h-3 text-yellow-500" />;
      case 'busy': return <Busy className="w-3 h-3 text-red-500" />;
      case 'offline': return <Moon className="w-3 h-3 text-gray-400" />;
      default: return <div className="w-2 h-2 bg-gray-300 rounded-full" />;
    }
  };

  // Get activity description
  const getActivityDescription = (activity: any) => {
    switch (activity.type) {
      case 'ai_message': return 'Sent AI message';
      case 'workspace_join': return 'Joined workspace';
      case 'ai_response_shared': return 'Shared AI response';
      case 'mention': return 'Mentioned someone';
      default: return activity.description || 'Unknown activity';
    }
  };

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Handle quick actions
  const handleStartAISession = () => {
    const sessionId = `ai-session-${Date.now()}`;
    collaboration.joinAISession(sessionId);
    setActiveTab('ai-chat');
    toast.success('Started new AI collaboration session');
  };

  const handleInviteUser = (userId: string) => {
    // Implementation for user invitation
    toast.success('Invitation sent');
  };

  const handleUpdatePresence = (status: 'online' | 'away' | 'busy') => {
    collaboration.updatePresence(status);
    toast.success(`Status updated to ${status}`);
  };

  if (compactMode) {
    return (
      <Card className={cn("w-80", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Collaboration</CardTitle>
            <Badge variant={collaboration.isConnected ? "default" : "destructive"} className="text-xs">
              {collaboration.isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
              {collaboration.isConnected ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="font-semibold text-blue-600">{collaboration.onlineUsers.length}</div>
              <div className="text-gray-600">Online</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="font-semibold text-green-600">{collaboration.unreadCount}</div>
              <div className="text-gray-600">Notifications</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <Button 
              size="sm" 
              className="w-full text-xs"
              onClick={handleStartAISession}
            >
              <Brain className="w-3 h-3 mr-1" />
              Start AI Session
            </Button>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="text-xs font-medium mb-1">Recent Activity</div>
            <ScrollArea className="h-20">
              {collaboration.workspaceActivity.slice(0, 3).map((activity) => (
                <div key={activity.id} className="flex items-center gap-2 py-1 text-xs">
                  <Avatar className="w-4 h-4">
                    <AvatarFallback className="text-xs">
                      {activity.userName.substring(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate">
                    {getActivityDescription(activity)}
                  </span>
                  <span className="text-gray-400">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
              ))}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className={cn("h-full flex flex-col", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Real-time Collaboration
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Connection Status */}
              <Badge variant={collaboration.isConnected ? "default" : "destructive"}>
                {collaboration.isConnected ? (
                  <><Wifi className="w-3 h-3 mr-1" />Connected</>
                ) : (
                  <><WifiOff className="w-3 h-3 mr-1" />Disconnected</>
                )}
              </Badge>

              {/* Notifications */}
              {collaboration.unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <Bell className="w-3 h-3 mr-1" />
                  {collaboration.unreadCount}
                </Badge>
              )}

              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {collaboration.onlineUsers.length}
              </div>
              <div className="text-xs text-gray-500">Online Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {collaboration.aiSessionParticipants.length}
              </div>
              <div className="text-xs text-gray-500">AI Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {collaboration.workspaceParticipants.length}
              </div>
              <div className="text-xs text-gray-500">Workspace Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {collaboration.unreadCount}
              </div>
              <div className="text-xs text-gray-500">Notifications</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mx-4 mb-4">
              <TabsTrigger value="overview" className="text-xs">
                <Activity className="w-3 h-3 mr-1" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="users" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                Users
              </TabsTrigger>
              <TabsTrigger value="ai-chat" className="text-xs">
                <Brain className="w-3 h-3 mr-1" />
                AI Chat
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs">
                <Bell className="w-3 h-3 mr-1" />
                Notifications
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="flex-1 px-4">
              <div className="space-y-4">
                {/* Quick Actions */}
                <div>
                  <h4 className="font-medium mb-2">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleStartAISession}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Start AI Session
                    </Button>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Workspace
                    </Button>
                    <Button variant="outline" size="sm">
                      <Video className="w-4 h-4 mr-2" />
                      Video Call
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Screen
                    </Button>
                  </div>
                </div>

                {/* Presence Controls */}
                <div>
                  <h4 className="font-medium mb-2">Your Status</h4>
                  <div className="flex gap-2">
                    <Button 
                      variant={session?.user && collaboration.getUserById(session.user.id)?.status === 'online' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleUpdatePresence('online')}
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                      Online
                    </Button>
                    <Button 
                      variant={session?.user && collaboration.getUserById(session.user.id)?.status === 'away' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleUpdatePresence('away')}
                    >
                      <Coffee className="w-3 h-3 mr-2" />
                      Away
                    </Button>
                    <Button 
                      variant={session?.user && collaboration.getUserById(session.user.id)?.status === 'busy' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleUpdatePresence('busy')}
                    >
                      <Busy className="w-3 h-3 mr-2" />
                      Busy
                    </Button>
                  </div>
                </div>

                {/* Active Sessions */}
                <div>
                  <h4 className="font-medium mb-2">Active Sessions</h4>
                  {collaboration.currentAISession ? (
                    <Card className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">AI Collaboration</span>
                          <Badge variant="secondary" className="text-xs">
                            {collaboration.aiSessionParticipants.length + 1} users
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No active sessions</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={handleStartAISession}
                      >
                        Start AI Session
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="flex-1 px-4">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {collaboration.activeUsers.map((user) => (
                    <Card key={user.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>
                                {user.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1">
                              {getStatusIcon(user.status)}
                            </div>
                          </div>
                          
                          <div>
                            <div className="font-medium text-sm">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                            {user.currentAISession && (
                              <Badge variant="outline" className="text-xs mt-1">
                                <Brain className="w-2 h-2 mr-1" />
                                In AI Session
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MessageSquare className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Send Message</TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleInviteUser(user.id)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Invite to Session</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {collaboration.activeUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm">No active users</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* AI Chat Tab */}
            <TabsContent value="ai-chat" className="flex-1 h-0">
              <div className="h-full px-4">
                <CollaborativeAIChat 
                  sessionId={collaboration.currentAISession}
                  className="h-full"
                  showParticipants={true}
                  allowInvites={true}
                />
              </div>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="flex-1 px-4">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {collaboration.workspaceActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {activity.userName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="text-sm">
                          <span className="font-medium">{activity.userName}</span>
                          {' '}
                          <span className="text-gray-600">{getActivityDescription(activity)}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTimeAgo(activity.timestamp)}
                        </div>
                      </div>

                      <Button variant="ghost" size="sm">
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}

                  {collaboration.workspaceActivity.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="flex-1 px-4">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {collaboration.notifications.map((notification) => (
                    <Card 
                      key={notification.id} 
                      className={cn(
                        "p-3 cursor-pointer transition-colors",
                        !notification.read && "border-blue-200 bg-blue-50"
                      )}
                      onClick={() => collaboration.markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-1 rounded-full bg-blue-100">
                          {notification.type === 'mention' && <AtSign className="w-3 h-3 text-blue-600" />}
                          {notification.type === 'ai_response' && <Brain className="w-3 h-3 text-blue-600" />}
                          {notification.type === 'task_completed' && <CheckCircle className="w-3 h-3 text-green-600" />}
                          {notification.type === 'workspace_invite' && <Users className="w-3 h-3 text-purple-600" />}
                          {notification.type === 'ai_suggestion' && <Zap className="w-3 h-3 text-yellow-600" />}
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-medium text-sm">{notification.title}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            {formatTimeAgo(notification.timestamp)}
                          </div>
                        </div>

                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />
                        )}
                      </div>
                    </Card>
                  ))}

                  {collaboration.notifications.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  )}

                  {collaboration.notifications.length > 0 && (
                    <div className="text-center pt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={collaboration.clearAllNotifications}
                      >
                        Clear All
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

export default CollaborationDashboard;