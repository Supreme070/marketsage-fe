"use client";

/**
 * AI Action Approval Interface
 * ============================
 * 
 * Interface for human reviewers to approve, reject, or modify AI-recommended actions.
 * Integrates with the governance layer to provide comprehensive oversight of autonomous decisions.
 * 
 * Key Features:
 * - Pending decision queue with priority sorting
 * - Detailed action plan review with risk assessment
 * - Bulk approval capabilities
 * - Real-time updates and notifications
 * - Decision history and audit trail
 * 
 * Based on user's blueprint: Create AI Action Approval Interface
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  Bot,
  TrendingUp,
  DollarSign,
  Mail,
  MessageSquare,
  Phone,
  Target,
  Activity,
  Eye,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PendingDecision {
  id: string;
  actionPlanId: string;
  contactId: string;
  contact: {
    firstName: string;
    lastName: string;
    email: string;
  };
  decisionType: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidenceLevel: string;
  reasoning: string;
  aiRecommendation: 'approve' | 'reject' | 'review';
  metadata: {
    actionSummary: string;
    expectedImpact: string;
    riskFactors: string[];
    mitigations: string[];
    estimatedValue?: number;
  };
  status: 'pending' | 'escalated';
  createdAt: string;
  expiresAt: string;
  timeRemaining: number; // minutes
  isExpired: boolean;
}

interface DecisionHistory {
  id: string;
  actionPlanId: string;
  contactId: string;
  contact: {
    firstName: string;
    lastName: string;
    email: string;
  };
  decisionType: string;
  riskLevel: string;
  aiRecommendation: string;
  humanDecision: 'approve' | 'reject' | 'modify';
  decisionMaker: string;
  justification?: string;
  status: 'approved' | 'rejected';
  createdAt: string;
  decidedAt: string;
  decisionTime: number; // minutes
}

const RISK_COLORS = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200'
};

const ACTION_ICONS = {
  SEND_EMAIL: Mail,
  SEND_SMS: MessageSquare,
  SEND_WHATSAPP: Phone,
  CREATE_TASK: Target,
  UPDATE_CONTACT: User,
  default: Activity
};

export default function AIActionApprovalInterface() {
  const [pendingDecisions, setPendingDecisions] = useState<PendingDecision[]>([]);
  const [decisionHistory, setDecisionHistory] = useState<DecisionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedDecisions, setSelectedDecisions] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [justification, setJustification] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [filterRisk, setFilterRisk] = useState<string>('all');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [pendingResponse, historyResponse] = await Promise.all([
        fetch('/api/ai/governance?action=pending-decisions'),
        fetch('/api/ai/governance?action=decision-history&limit=50')
      ]);

      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingDecisions(pendingData.data?.decisions || []);
      }

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setDecisionHistory(historyData.data?.decisions || []);
      }

    } catch (error) {
      console.error('Failed to load approval data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processDecision = async (
    decisionId: string, 
    humanDecision: 'approve' | 'reject' | 'modify',
    justificationText?: string
  ) => {
    try {
      setProcessing(decisionId);

      const response = await fetch('/api/ai/governance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decisionId,
          humanDecision,
          justification: justificationText || justification
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process decision');
      }

      // Remove processed decision from pending list
      setPendingDecisions(prev => prev.filter(d => d.id !== decisionId));
      
      // Reload data to get updated history
      await loadData();
      
      setJustification('');
      setShowDetails(null);

    } catch (error) {
      console.error('Failed to process decision:', error);
      alert('Failed to process decision. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const processBulkDecisions = async (humanDecision: 'approve' | 'reject') => {
    if (selectedDecisions.length === 0) return;

    try {
      setProcessing('bulk');

      const promises = selectedDecisions.map(decisionId =>
        fetch('/api/ai/governance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decisionId,
            humanDecision,
            justification: `Bulk ${humanDecision} action`
          })
        })
      );

      await Promise.all(promises);
      
      setSelectedDecisions([]);
      await loadData();

    } catch (error) {
      console.error('Failed to process bulk decisions:', error);
      alert('Failed to process bulk decisions. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const toggleSelection = (decisionId: string) => {
    setSelectedDecisions(prev => 
      prev.includes(decisionId) 
        ? prev.filter(id => id !== decisionId)
        : [...prev, decisionId]
    );
  };

  const selectAll = () => {
    const filteredDecisions = filterRisk === 'all' 
      ? pendingDecisions 
      : pendingDecisions.filter(d => d.riskLevel === filterRisk);
    
    setSelectedDecisions(filteredDecisions.map(d => d.id));
  };

  const clearSelection = () => {
    setSelectedDecisions([]);
  };

  const formatTimeRemaining = (minutes: number) => {
    if (minutes <= 0) return 'Expired';
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    return `${Math.floor(minutes / 1440)}d`;
  };

  const filteredPendingDecisions = filterRisk === 'all' 
    ? pendingDecisions 
    : pendingDecisions.filter(d => d.riskLevel === filterRisk);

  const ActionIcon = ({ actionSummary }: { actionSummary: string }) => {
    const actionType = actionSummary.split(':')[1]?.split(',')[0]?.trim() || 'default';
    const IconComponent = ACTION_ICONS[actionType as keyof typeof ACTION_ICONS] || ACTION_ICONS.default;
    return <IconComponent className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-muted-foreground">Loading approval queue...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Action Approval</h1>
          <p className="text-muted-foreground">
            Review and approve AI-recommended customer actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-orange-600">
            <Clock className="w-3 h-3 mr-1" />
            {pendingDecisions.length} pending
          </Badge>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{pendingDecisions.length}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">
                  {pendingDecisions.filter(d => d.riskLevel === 'high' || d.riskLevel === 'critical').length}
                </div>
                <div className="text-sm text-muted-foreground">High Risk</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">
                  {pendingDecisions.filter(d => d.isExpired).length}
                </div>
                <div className="text-sm text-muted-foreground">Expired</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {decisionHistory.filter(d => d.status === 'approved').length}
                </div>
                <div className="text-sm text-muted-foreground">Approved Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Decisions</TabsTrigger>
          <TabsTrigger value="history">Decision History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {/* Filters and Bulk Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <select 
                value={filterRisk} 
                onChange={(e) => setFilterRisk(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="all">All Risk Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {selectedDecisions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedDecisions.length} selected
                </span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => processBulkDecisions('approve')}
                  disabled={processing === 'bulk'}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve All
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => processBulkDecisions('reject')}
                  disabled={processing === 'bulk'}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject All
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            )}
          </div>

          {filteredPendingDecisions.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox 
                checked={selectedDecisions.length === filteredPendingDecisions.length}
                onCheckedChange={() => 
                  selectedDecisions.length === filteredPendingDecisions.length 
                    ? clearSelection() 
                    : selectAll()
                }
              />
              <span>Select all visible</span>
            </div>
          )}

          {/* Pending Decisions List */}
          <div className="space-y-4">
            {filteredPendingDecisions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                  <p className="text-muted-foreground">No pending decisions require your approval.</p>
                </CardContent>
              </Card>
            ) : (
              filteredPendingDecisions.map((decision) => (
                <Card key={decision.id} className={`border-l-4 ${
                  decision.isExpired ? 'border-l-red-500' : 
                  decision.riskLevel === 'critical' ? 'border-l-red-500' :
                  decision.riskLevel === 'high' ? 'border-l-orange-500' :
                  decision.riskLevel === 'medium' ? 'border-l-yellow-500' :
                  'border-l-green-500'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Checkbox 
                          checked={selectedDecisions.includes(decision.id)}
                          onCheckedChange={() => toggleSelection(decision.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <ActionIcon actionSummary={decision.metadata.actionSummary} />
                            <CardTitle className="text-base">{decision.metadata.actionSummary}</CardTitle>
                            <Badge className={RISK_COLORS[decision.riskLevel]}>
                              {decision.riskLevel}
                            </Badge>
                            {decision.isExpired && (
                              <Badge variant="destructive">Expired</Badge>
                            )}
                          </div>
                          <CardDescription>
                            Customer: {decision.contact.firstName} {decision.contact.lastName} ({decision.contact.email})
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeRemaining(decision.timeRemaining)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Bot className="h-3 w-3" />
                          <span className={decision.aiRecommendation === 'approve' ? 'text-green-600' : 
                                         decision.aiRecommendation === 'reject' ? 'text-red-600' : 'text-yellow-600'}>
                            AI: {decision.aiRecommendation}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm font-medium mb-1">Expected Impact</div>
                        <div className="text-sm text-muted-foreground">{decision.metadata.expectedImpact}</div>
                      </div>
                      {decision.metadata.estimatedValue && (
                        <div>
                          <div className="text-sm font-medium mb-1">Estimated Value</div>
                          <div className="text-sm text-green-600 font-medium">
                            ${decision.metadata.estimatedValue.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>

                    {decision.metadata.riskFactors.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm font-medium mb-2">Risk Factors</div>
                        <div className="flex flex-wrap gap-1">
                          {decision.metadata.riskFactors.map((factor, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm"
                        onClick={() => processDecision(decision.id, 'approve')}
                        disabled={processing === decision.id}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        variant="outline"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => processDecision(decision.id, 'reject')}
                        disabled={processing === decision.id}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        variant="outline"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDetails(showDetails === decision.id ? null : decision.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </div>

                    {showDetails === decision.id && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div>
                          <div className="text-sm font-medium mb-1">AI Reasoning</div>
                          <div className="text-sm text-muted-foreground">{decision.reasoning}</div>
                        </div>
                        
                        {decision.metadata.mitigations.length > 0 && (
                          <div>
                            <div className="text-sm font-medium mb-1">Suggested Mitigations</div>
                            <ul className="text-sm text-muted-foreground list-disc list-inside">
                              {decision.metadata.mitigations.map((mitigation, index) => (
                                <li key={index}>{mitigation}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div>
                          <div className="text-sm font-medium mb-2">Add Justification (Optional)</div>
                          <Textarea 
                            placeholder="Enter reason for your decision..."
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                            rows={3}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={() => processDecision(decision.id, 'approve', justification)}
                            disabled={processing === decision.id}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Approve with Note
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => processDecision(decision.id, 'reject', justification)}
                            disabled={processing === decision.id}
                          >
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            Reject with Note
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Decisions</CardTitle>
              <CardDescription>
                History of approved and rejected AI actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {decisionHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No decision history available</p>
                  </div>
                ) : (
                  decisionHistory.map((decision) => (
                    <div key={decision.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {decision.status === 'approved' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <div className="font-medium text-sm">
                            {decision.contact.firstName} {decision.contact.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {decision.humanDecision} • {formatDistanceToNow(new Date(decision.decidedAt))} ago
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={RISK_COLORS[decision.riskLevel as keyof typeof RISK_COLORS]}>
                          {decision.riskLevel}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {decision.decisionTime}m decision time
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}