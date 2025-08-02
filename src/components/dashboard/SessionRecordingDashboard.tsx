/**
 * Session Recording Dashboard
 * ==========================
 * Management interface for viewing and analyzing session recordings
 * with filtering, search, and detailed replay capabilities.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Monitor, 
  Activity, 
  AlertTriangle, 
  Eye, 
  Clock, 
  MapPin, 
  Smartphone, 
  Laptop, 
  Tablet,
  Download,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// import SessionReplayPlayer from '@/components/analytics/SessionReplayPlayer';

interface SessionRecording {
  sessionId: string;
  visitorId: string;
  startTime: number;
  endTime?: number;
  page: string;
  viewport: { width: number; height: number };
  metadata: {
    totalEvents: number;
    duration: number;
    interactions: number;
    errors: number;
    formInteractions: number;
  };
  visitor?: {
    fingerprint: string;
    country: string;
    city: string;
    deviceType: string;
    browser: string;
    operatingSystem: string;
  };
  engagementScore: number;
  userIntent: string;
  conversionProbability: number;
  frustrationSignals: string[];
}

interface SessionRecordingDashboardProps {
  className?: string;
}

export default function SessionRecordingDashboard({ 
  className = '' 
}: SessionRecordingDashboardProps) {
  const [recordings, setRecordings] = useState<SessionRecording[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<SessionRecording | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIntent, setFilterIntent] = useState('all');
  const [filterDevice, setFilterDevice] = useState('all');
  const [sortBy, setSortBy] = useState('startTime');
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [fullRecordingData, setFullRecordingData] = useState(null);
  
  // Load session recordings
  useEffect(() => {
    loadRecordings();
  }, []);
  
  const loadRecordings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v2/leadpulse/analytics/session-recording');
      const data = await response.json();
      
      if (data.recordings) {
        setRecordings(data.recordings);
      }
    } catch (error) {
      console.error('Error loading session recordings:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load full recording data for replay
  const loadFullRecording = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/v2/leadpulse/analytics/session-recording?sessionId=${sessionId}`);
      const data = await response.json();
      setFullRecordingData(data);
      setIsPlayerOpen(true);
    } catch (error) {
      console.error('Error loading full recording:', error);
    }
  };
  
  // Filter recordings
  const filteredRecordings = recordings.filter(recording => {
    const matchesSearch = searchTerm === '' || 
      recording.page.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recording.visitorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recording.visitor?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recording.visitor?.country?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesIntent = filterIntent === 'all' || recording.userIntent === filterIntent;
    const matchesDevice = filterDevice === 'all' || recording.visitor?.deviceType === filterDevice;
    
    return matchesSearch && matchesIntent && matchesDevice;
  });
  
  // Sort recordings
  const sortedRecordings = [...filteredRecordings].sort((a, b) => {
    switch (sortBy) {
      case 'startTime':
        return b.startTime - a.startTime;
      case 'duration':
        return b.metadata.duration - a.metadata.duration;
      case 'engagement':
        return b.engagementScore - a.engagementScore;
      case 'interactions':
        return b.metadata.interactions - a.metadata.interactions;
      default:
        return 0;
    }
  });
  
  // Format time helper
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Get device icon
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return Smartphone;
      case 'tablet': return Tablet;
      default: return Laptop;
    }
  };
  
  // Get intent color
  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'convert': return 'bg-green-600/20 text-green-400 border-green-500/30';
      case 'engage': return 'bg-blue-600/20 text-blue-400 border-blue-500/30';
      case 'explore': return 'bg-purple-600/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-600/20 text-gray-400 border-gray-500/30';
    }
  };
  
  if (isPlayerOpen && fullRecordingData) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-7xl">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Session Replay</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setIsPlayerOpen(false);
                    setFullRecordingData(null);
                  }}
                  className="text-white hover:bg-gray-800"
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Session replay player would be displayed here</p>
                <p className="text-sm mt-2">Recording ID: {JSON.stringify(fullRecordingData).substring(0, 50)}...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <Card className={`w-full bg-gray-900/50 border-blue-500/20 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/20">
              <Monitor className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-white">Session Recordings</CardTitle>
              <p className="text-sm text-gray-400">
                {recordings.length} recorded sessions • {filteredRecordings.length} shown
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadRecordings}
              disabled={isLoading}
              className="text-xs"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 bg-gray-800/50 border-gray-700"
            />
          </div>
          
          <Select value={filterIntent} onValueChange={setFilterIntent}>
            <SelectTrigger className="w-32 bg-gray-800/50 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Intents</SelectItem>
              <SelectItem value="browse">Browse</SelectItem>
              <SelectItem value="engage">Engage</SelectItem>
              <SelectItem value="convert">Convert</SelectItem>
              <SelectItem value="explore">Explore</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterDevice} onValueChange={setFilterDevice}>
            <SelectTrigger className="w-32 bg-gray-800/50 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Devices</SelectItem>
              <SelectItem value="desktop">Desktop</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
              <SelectItem value="tablet">Tablet</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36 bg-gray-800/50 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="startTime">Newest First</SelectItem>
              <SelectItem value="duration">Longest First</SelectItem>
              <SelectItem value="engagement">Most Engaged</SelectItem>
              <SelectItem value="interactions">Most Active</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-gray-800/30 border-gray-700/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-blue-400" />
                <div>
                  <div className="text-lg font-bold text-blue-400">
                    {filteredRecordings.length}
                  </div>
                  <div className="text-xs text-gray-400">Total Sessions</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/30 border-gray-700/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-400" />
                <div>
                  <div className="text-lg font-bold text-green-400">
                    {formatTime(
                      filteredRecordings.reduce((sum, r) => sum + r.metadata.duration, 0) / filteredRecordings.length || 0
                    )}
                  </div>
                  <div className="text-xs text-gray-400">Avg Duration</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/30 border-gray-700/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-400" />
                <div>
                  <div className="text-lg font-bold text-orange-400">
                    {Math.round(
                      filteredRecordings.reduce((sum, r) => sum + r.engagementScore, 0) / filteredRecordings.length || 0
                    )}
                  </div>
                  <div className="text-xs text-gray-400">Avg Engagement</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/30 border-gray-700/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <div>
                  <div className="text-lg font-bold text-red-400">
                    {filteredRecordings.filter(r => r.frustrationSignals.length > 0).length}
                  </div>
                  <div className="text-xs text-gray-400">With Friction</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Recordings List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading session recordings...
            </div>
          ) : sortedRecordings.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No session recordings found
            </div>
          ) : (
            <AnimatePresence>
              {sortedRecordings.map((recording, index) => {
                const DeviceIcon = getDeviceIcon(recording.visitor?.deviceType || 'desktop');
                
                return (
                  <motion.div
                    key={recording.sessionId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-gray-800/30 border-gray-700/30 hover:bg-gray-800/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            {/* Device & Basic Info */}
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gray-700/50 rounded-lg">
                                <DeviceIcon className="h-4 w-4 text-gray-400" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-white truncate max-w-64">
                                  {recording.page}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <span>{recording.visitorId.slice(-8)}</span>
                                  <span>•</span>
                                  <span>{formatTime(recording.metadata.duration)}</span>
                                  <span>•</span>
                                  <span>{new Date(recording.startTime).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Location */}
                            {recording.visitor && (
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <MapPin className="h-3 w-3" />
                                {recording.visitor.city}, {recording.visitor.country}
                              </div>
                            )}
                            
                            {/* Stats */}
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <div className="text-sm font-bold text-blue-400">
                                  {recording.metadata.interactions}
                                </div>
                                <div className="text-xs text-gray-500">Interactions</div>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-sm font-bold text-green-400">
                                  {recording.engagementScore}
                                </div>
                                <div className="text-xs text-gray-500">Engagement</div>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-sm font-bold text-purple-400">
                                  {recording.conversionProbability}%
                                </div>
                                <div className="text-xs text-gray-500">Conversion</div>
                              </div>
                            </div>
                            
                            {/* Intent & Signals */}
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getIntentColor(recording.userIntent)}>
                                {recording.userIntent}
                              </Badge>
                              
                              {recording.frustrationSignals.length > 0 && (
                                <Badge variant="outline" className="bg-red-600/20 text-red-400 border-red-500/30">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {recording.frustrationSignals.length}
                                </Badge>
                              )}
                              
                              {recording.metadata.errors > 0 && (
                                <Badge variant="outline" className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30">
                                  {recording.metadata.errors} errors
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => loadFullRecording(recording.sessionId)}
                              className="text-blue-400 hover:bg-blue-600/20"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Replay
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </CardContent>
    </Card>
  );
}