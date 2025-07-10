"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  User, 
  Clock, 
  MousePointer, 
  FileText, 
  Eye, 
  CheckCircle,
  Activity,
  ArrowRight,
  Calendar,
  Globe,
  Smartphone,
  Monitor,
  MapPin,
  UserCheck,
  Target,
  TrendingUp,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';

interface CustomerJourneyTimelineProps {
  className?: string;
}

interface JourneyPhase {
  phase: 'anonymous' | 'authenticated';
  startDate: Date;
  endDate: Date;
  touchpoints: Array<{
    type: string;
    timestamp: Date;
    url?: string;
    title?: string;
    metadata?: any;
  }>;
}

interface AuthenticatedVisitor {
  id: string;
  fingerprint: string;
  userId: string;
  email: string;
  contactId: string;
  organizationId: string;
  isAuthenticated: boolean;
  authenticationDate: Date;
  authenticationMethod: string;
  sessionId: string;
  firstVisit: Date;
  totalVisits: number;
  engagementScore: number;
  journeyStages: string[];
  currentStage: string;
  conversionEvents: string[];
  profile: {
    firstName?: string;
    lastName?: string;
    company?: string;
    jobTitle?: string;
    industry?: string;
    customFields?: Record<string, any>;
  };
}

const TOUCHPOINT_ICONS = {
  PAGEVIEW: Globe,
  CLICK: MousePointer,
  FORM_VIEW: FileText,
  FORM_START: FileText,
  FORM_SUBMIT: CheckCircle,
  CONVERSION: Target,
  DEFAULT: Activity
};

const TOUCHPOINT_COLORS = {
  PAGEVIEW: 'bg-blue-100 text-blue-800',
  CLICK: 'bg-green-100 text-green-800',
  FORM_VIEW: 'bg-yellow-100 text-yellow-800',
  FORM_START: 'bg-orange-100 text-orange-800',
  FORM_SUBMIT: 'bg-purple-100 text-purple-800',
  CONVERSION: 'bg-red-100 text-red-800',
  DEFAULT: 'bg-gray-100 text-gray-800'
};

export function CustomerJourneyTimeline({ className }: CustomerJourneyTimelineProps) {
  const [timeline, setTimeline] = useState<JourneyPhase[]>([]);
  const [authenticatedVisitor, setAuthenticatedVisitor] = useState<AuthenticatedVisitor | null>(null);
  const [loading, setLoading] = useState(false);
  const [contactId, setContactId] = useState('');
  const [visitorFingerprint, setVisitorFingerprint] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<'all' | 'anonymous' | 'authenticated'>('all');

  const fetchJourneyTimeline = async (contactId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leadpulse/auth-integration?action=get-journey-timeline&contactId=${contactId}`);
      if (response.ok) {
        const data = await response.json();
        setTimeline(data.timeline.map((phase: any) => ({
          ...phase,
          startDate: new Date(phase.startDate),
          endDate: new Date(phase.endDate),
          touchpoints: phase.touchpoints.map((t: any) => ({
            ...t,
            timestamp: new Date(t.timestamp)
          }))
        })));
      }
    } catch (error) {
      console.error('Error fetching journey timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthenticatedVisitor = async (fingerprint: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leadpulse/auth-integration?action=get-authenticated-visitor&visitorFingerprint=${fingerprint}`);
      if (response.ok) {
        const data = await response.json();
        if (data.visitor) {
          setAuthenticatedVisitor({
            ...data.visitor,
            authenticationDate: new Date(data.visitor.authenticationDate),
            firstVisit: new Date(data.visitor.firstVisit)
          });
        }
      }
    } catch (error) {
      console.error('Error fetching authenticated visitor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactIdSearch = () => {
    if (contactId) {
      fetchJourneyTimeline(contactId);
    }
  };

  const handleVisitorFingerprintSearch = () => {
    if (visitorFingerprint) {
      fetchAuthenticatedVisitor(visitorFingerprint);
    }
  };

  const filteredTimeline = timeline.filter(phase => {
    if (selectedPhase === 'all') return true;
    return phase.phase === selectedPhase;
  });

  const getTouchpointIcon = (type: string) => {
    const IconComponent = TOUCHPOINT_ICONS[type as keyof typeof TOUCHPOINT_ICONS] || TOUCHPOINT_ICONS.DEFAULT;
    return <IconComponent className="h-4 w-4" />;
  };

  const getTouchpointColor = (type: string) => {
    return TOUCHPOINT_COLORS[type as keyof typeof TOUCHPOINT_COLORS] || TOUCHPOINT_COLORS.DEFAULT;
  };

  const getJourneyDuration = (phase: JourneyPhase) => {
    const duration = phase.endDate.getTime() - phase.startDate.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Journey Timeline</h2>
          <p className="text-muted-foreground">
            End-to-end customer journey tracking with authentication integration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50">
            <UserCheck className="h-4 w-4 mr-1" />
            Auth Integration
          </Badge>
        </div>
      </div>

      {/* Search Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search by Contact ID</CardTitle>
            <CardDescription>View complete customer journey for a specific contact</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter contact ID"
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
              />
              <Button onClick={handleContactIdSearch} disabled={loading}>
                <User className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search by Visitor Fingerprint</CardTitle>
            <CardDescription>View authenticated visitor details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter visitor fingerprint"
                value={visitorFingerprint}
                onChange={(e) => setVisitorFingerprint(e.target.value)}
              />
              <Button onClick={handleVisitorFingerprintSearch} disabled={loading}>
                <Shield className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Authenticated Visitor Details */}
      {authenticatedVisitor && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Authenticated Visitor Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Identity</Label>
                <div className="space-y-1">
                  <p className="text-sm"><strong>Email:</strong> {authenticatedVisitor.email}</p>
                  <p className="text-sm"><strong>Name:</strong> {authenticatedVisitor.profile.firstName || 'N/A'} {authenticatedVisitor.profile.lastName || ''}</p>
                  <p className="text-sm"><strong>Company:</strong> {authenticatedVisitor.profile.company || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Authentication</Label>
                <div className="space-y-1">
                  <p className="text-sm"><strong>Method:</strong> {authenticatedVisitor.authenticationMethod}</p>
                  <p className="text-sm"><strong>Date:</strong> {format(authenticatedVisitor.authenticationDate, 'PPp')}</p>
                  <p className="text-sm"><strong>Session:</strong> {authenticatedVisitor.sessionId}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Engagement</Label>
                <div className="space-y-1">
                  <p className="text-sm"><strong>Score:</strong> {authenticatedVisitor.engagementScore}/100</p>
                  <p className="text-sm"><strong>Visits:</strong> {authenticatedVisitor.totalVisits}</p>
                  <p className="text-sm"><strong>Stage:</strong> {authenticatedVisitor.currentStage}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Journey Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Journey Timeline</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="phase-filter" className="text-sm">Filter:</Label>
              <select
                id="phase-filter"
                value={selectedPhase}
                onChange={(e) => setSelectedPhase(e.target.value as any)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">All Phases</option>
                <option value="anonymous">Anonymous Only</option>
                <option value="authenticated">Authenticated Only</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredTimeline.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4" />
              <p>No journey data available. Search for a contact or visitor to view their timeline.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredTimeline.map((phase, phaseIndex) => (
                <div key={phaseIndex} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={phase.phase === 'authenticated' ? 'default' : 'secondary'}>
                        {phase.phase === 'authenticated' ? <UserCheck className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                        {phase.phase} Phase
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(phase.startDate, 'PPp')} - {format(phase.endDate, 'PPp')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span><Clock className="h-3 w-3 inline mr-1" />Duration: {getJourneyDuration(phase)}</span>
                      <span><Activity className="h-3 w-3 inline mr-1" />Touchpoints: {phase.touchpoints.length}</span>
                    </div>
                  </div>

                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {phase.touchpoints.map((touchpoint, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getTouchpointColor(touchpoint.type)}`}>
                              {getTouchpointIcon(touchpoint.type)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{touchpoint.title || touchpoint.type}</span>
                              <Badge variant="outline" className="text-xs">
                                {touchpoint.type}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {touchpoint.url && (
                                <span className="mr-2">
                                  <Globe className="h-3 w-3 inline mr-1" />
                                  {touchpoint.url}
                                </span>
                              )}
                              <span>
                                <Clock className="h-3 w-3 inline mr-1" />
                                {format(touchpoint.timestamp, 'PPp')}
                              </span>
                            </div>
                            {touchpoint.metadata && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {touchpoint.metadata.action && (
                                  <span className="mr-2">Action: {touchpoint.metadata.action}</span>
                                )}
                                {touchpoint.metadata.authenticated && (
                                  <Badge variant="outline" className="text-xs">
                                    <UserCheck className="h-2 w-2 mr-1" />
                                    Authenticated
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}