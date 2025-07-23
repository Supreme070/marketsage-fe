/**
 * Interactive Journey Flow Component
 * 
 * Creates interactive flow diagrams showing visitor journey paths,
 * conversion funnels, and optimization opportunities.
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowRight, 
  ArrowDown, 
  Target, 
  Users, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Download,
  Maximize,
  Minimize,
  Zap,
  Brain,
  Eye,
  MousePointer,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Layers,
  Network,
  GitBranch,
  Workflow,
  Route,
  MapPin,
  Compass,
  Navigation
} from 'lucide-react';
import type { VisitorJourney, VisitorPath } from '@/lib/leadpulse/dataProvider';

interface FlowNode {
  id: string;
  type: 'page' | 'action' | 'decision' | 'conversion' | 'exit';
  title: string;
  url?: string;
  visitors: number;
  conversions: number;
  dropOffs: number;
  averageTime: number;
  position: { x: number; y: number };
  connections: string[];
  optimizationScore: number;
  aiInsights: string[];
}

interface FlowConnection {
  id: string;
  from: string;
  to: string;
  visitors: number;
  conversionRate: number;
  averageTime: number;
  dropOffRate: number;
  strength: 'strong' | 'medium' | 'weak';
  optimizationPotential: number;
}

interface FlowMetrics {
  totalVisitors: number;
  conversionRate: number;
  averageJourneyLength: number;
  topPaths: Array<{
    path: string[];
    visitors: number;
    conversionRate: number;
  }>;
  bottlenecks: Array<{
    nodeId: string;
    issue: string;
    impact: 'high' | 'medium' | 'low';
    recommendation: string;
  }>;
}

interface InteractiveJourneyFlowProps {
  journeys: VisitorJourney[];
  paths?: VisitorPath[];
  enableAI?: boolean;
  showMetrics?: boolean;
  enableOptimization?: boolean;
  onNodeClick?: (node: FlowNode) => void;
  onConnectionClick?: (connection: FlowConnection) => void;
}

/**
 * Interactive Journey Flow Component
 */
export function InteractiveJourneyFlow({
  journeys,
  paths = [],
  enableAI = true,
  showMetrics = true,
  enableOptimization = true,
  onNodeClick,
  onConnectionClick
}: InteractiveJourneyFlowProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'flow' | 'funnel' | 'paths'>('flow');
  const [filterType, setFilterType] = useState<'all' | 'converted' | 'dropped'>('all');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showOptimizations, setShowOptimizations] = useState(false);

  // Process journey data into flow nodes and connections
  const flowData = useMemo(() => {
    const nodes = new Map<string, FlowNode>();
    const connections = new Map<string, FlowConnection>();
    
    // Process journeys to create nodes
    journeys.forEach(journey => {
      journey.pulseData.forEach((pulse, index) => {
        const nodeId = pulse.url || `step-${index}`;
        
        if (!nodes.has(nodeId)) {
          nodes.set(nodeId, {
            id: nodeId,
            type: determineNodeType(pulse, journey),
            title: pulse.title || pulse.url || `Step ${index + 1}`,
            url: pulse.url,
            visitors: 0,
            conversions: 0,
            dropOffs: 0,
            averageTime: 0,
            position: calculateNodePosition(index, journey.pulseData.length),
            connections: [],
            optimizationScore: 0,
            aiInsights: []
          });
        }
        
        const node = nodes.get(nodeId)!;
        node.visitors++;
        node.averageTime += pulse.value || 0;
        
        if (pulse.type === 'CONVERSION') {
          node.conversions++;
        }
        
        if (index === journey.pulseData.length - 1 && pulse.type !== 'CONVERSION') {
          node.dropOffs++;
        }
        
        // Create connections
        if (index < journey.pulseData.length - 1) {
          const nextPulse = journey.pulseData[index + 1];
          const nextNodeId = nextPulse.url || `step-${index + 1}`;
          const connectionId = `${nodeId}-${nextNodeId}`;
          
          if (!connections.has(connectionId)) {
            connections.set(connectionId, {
              id: connectionId,
              from: nodeId,
              to: nextNodeId,
              visitors: 0,
              conversionRate: 0,
              averageTime: 0,
              dropOffRate: 0,
              strength: 'medium',
              optimizationPotential: 0
            });
          }
          
          const connection = connections.get(connectionId)!;
          connection.visitors++;
          connection.averageTime += pulse.value || 0;
          
          if (!node.connections.includes(nextNodeId)) {
            node.connections.push(nextNodeId);
          }
        }
      });
    });
    
    // Calculate averages and optimization scores
    nodes.forEach(node => {
      if (node.visitors > 0) {
        node.averageTime = node.averageTime / node.visitors;
        node.optimizationScore = calculateOptimizationScore(node);
        
        if (enableAI) {
          node.aiInsights = generateNodeInsights(node);
        }
      }
    });
    
    connections.forEach(connection => {
      if (connection.visitors > 0) {
        connection.averageTime = connection.averageTime / connection.visitors;
        connection.conversionRate = calculateConnectionConversionRate(connection, nodes);
        connection.dropOffRate = calculateConnectionDropOffRate(connection, nodes);
        connection.strength = determineConnectionStrength(connection);
        connection.optimizationPotential = calculateConnectionOptimization(connection);
      }
    });
    
    return {
      nodes: Array.from(nodes.values()),
      connections: Array.from(connections.values()),
      metrics: calculateFlowMetrics(nodes, connections, journeys)
    };
  }, [journeys, enableAI]);

  // Filter flow data based on selected filter
  const filteredFlowData = useMemo(() => {
    if (filterType === 'all') return flowData;
    
    const filteredNodes = flowData.nodes.filter(node => {
      if (filterType === 'converted') return node.conversions > 0;
      if (filterType === 'dropped') return node.dropOffs > 0;
      return true;
    });
    
    const filteredConnections = flowData.connections.filter(conn => {
      const fromNode = filteredNodes.find(n => n.id === conn.from);
      const toNode = filteredNodes.find(n => n.id === conn.to);
      return fromNode && toNode;
    });
    
    return {
      ...flowData,
      nodes: filteredNodes,
      connections: filteredConnections
    };
  }, [flowData, filterType]);

  // Handle node selection
  const handleNodeClick = useCallback((node: FlowNode) => {
    setSelectedNode(node.id);
    setSelectedConnection(null);
    onNodeClick?.(node);
  }, [onNodeClick]);

  // Handle connection selection
  const handleConnectionClick = useCallback((connection: FlowConnection) => {
    setSelectedConnection(connection.id);
    setSelectedNode(null);
    onConnectionClick?.(connection);
  }, [onConnectionClick]);

  // Run AI optimization analysis
  const runOptimizationAnalysis = async () => {
    if (!enableAI) return;
    
    setIsAnalyzing(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowOptimizations(true);
    } catch (error) {
      console.error('Error running optimization analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Export flow data
  const exportFlowData = () => {
    const exportData = {
      flowData: filteredFlowData,
      metrics: flowData.metrics,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journey-flow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Flow Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Journey Flow Analysis</h3>
          <p className="text-sm text-muted-foreground">
            {filteredFlowData.nodes.length} nodes • {filteredFlowData.connections.length} connections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Paths</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="dropped">Dropped Off</SelectItem>
            </SelectContent>
          </Select>
          {enableAI && (
            <Button
              variant="outline"
              size="sm"
              onClick={runOptimizationAnalysis}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              Optimize
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={exportFlowData}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Flow Tabs */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
        <TabsList>
          <TabsTrigger value="flow">Flow Diagram</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="paths">Path Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="flow" className="space-y-4">
          {/* Flow Diagram */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Interactive Flow Diagram
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-96 border rounded-lg overflow-hidden" style={{ transform: `scale(${zoomLevel})` }}>
                {/* Flow Nodes */}
                {filteredFlowData.nodes.map(node => (
                  <div
                    key={node.id}
                    className={`absolute w-32 h-20 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedNode === node.id 
                        ? 'border-primary bg-primary/10 scale-105' 
                        : 'border-border bg-background hover:border-primary/50'
                    }`}
                    style={{
                      left: `${node.position.x}px`,
                      top: `${node.position.y}px`,
                    }}
                    onClick={() => handleNodeClick(node)}
                  >
                    <div className="p-2 h-full flex flex-col">
                      <div className="flex items-center gap-1 mb-1">
                        {getNodeIcon(node.type)}
                        <span className="text-xs font-medium truncate">{node.title}</span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>{node.visitors} visitors</div>
                        {node.conversions > 0 && (
                          <div className="text-green-600">{node.conversions} conversions</div>
                        )}
                        {node.dropOffs > 0 && (
                          <div className="text-red-600">{node.dropOffs} drop-offs</div>
                        )}
                      </div>
                      
                      {/* Optimization Score */}
                      <div className="mt-auto">
                        <div className="flex items-center gap-1">
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className={`h-1 rounded-full ${
                                node.optimizationScore > 80 ? 'bg-green-500' :
                                node.optimizationScore > 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${node.optimizationScore}%` }}
                            />
                          </div>
                          <span className="text-xs">{node.optimizationScore}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Flow Connections */}
                {filteredFlowData.connections.map(connection => {
                  const fromNode = filteredFlowData.nodes.find(n => n.id === connection.from);
                  const toNode = filteredFlowData.nodes.find(n => n.id === connection.to);
                  
                  if (!fromNode || !toNode) return null;
                  
                  return (
                    <div
                      key={connection.id}
                      className={`absolute cursor-pointer ${
                        selectedConnection === connection.id ? 'z-10' : ''
                      }`}
                      onClick={() => handleConnectionClick(connection)}
                    >
                      <svg
                        className="absolute pointer-events-none"
                        style={{
                          left: `${fromNode.position.x + 128}px`,
                          top: `${fromNode.position.y + 40}px`,
                          width: `${toNode.position.x - fromNode.position.x - 128}px`,
                          height: `${toNode.position.y - fromNode.position.y}px`,
                        }}
                      >
                        <line
                          x1="0"
                          y1="0"
                          x2={toNode.position.x - fromNode.position.x - 128}
                          y2={toNode.position.y - fromNode.position.y}
                          stroke={
                            selectedConnection === connection.id ? '#3b82f6' :
                            connection.strength === 'strong' ? '#10b981' :
                            connection.strength === 'medium' ? '#f59e0b' : '#ef4444'
                          }
                          strokeWidth={connection.strength === 'strong' ? 3 : 2}
                          markerEnd="url(#arrowhead)"
                        />
                      </svg>
                      
                      {/* Connection Label */}
                      <div
                        className={`absolute bg-white border rounded px-2 py-1 text-xs shadow-sm ${
                          selectedConnection === connection.id ? 'border-primary' : 'border-border'
                        }`}
                        style={{
                          left: `${fromNode.position.x + 128 + (toNode.position.x - fromNode.position.x - 128) / 2}px`,
                          top: `${fromNode.position.y + 40 + (toNode.position.y - fromNode.position.y) / 2}px`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        {connection.visitors} visitors
                      </div>
                    </div>
                  );
                })}
                
                {/* SVG Definitions */}
                <svg className="absolute top-0 left-0 w-0 h-0">
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                    </marker>
                  </defs>
                </svg>
              </div>
              
              {/* Zoom Controls */}
              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
                >
                  <Minimize className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))}
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Conversion Funnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredFlowData.nodes.map((node, index) => (
                  <div key={node.id} className="flex items-center gap-4">
                    <div className="w-16 text-center">
                      <div className="text-sm font-medium">Step {index + 1}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{node.title}</span>
                        <span className="text-sm text-muted-foreground">{node.visitors} visitors</span>
                      </div>
                      <Progress value={(node.visitors / filteredFlowData.nodes[0]?.visitors) * 100} className="h-2" />
                    </div>
                    <div className="w-20 text-right">
                      <div className="text-sm font-medium">
                        {Math.round((node.visitors / filteredFlowData.nodes[0]?.visitors) * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paths" className="space-y-4">
          {/* Path Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Path Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {flowData.metrics.topPaths.map((path, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Path {index + 1}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{path.visitors} visitors</Badge>
                        <Badge variant={path.conversionRate > 10 ? 'default' : 'secondary'}>
                          {path.conversionRate}% conversion
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {path.path.map((step, stepIndex) => (
                        <React.Fragment key={stepIndex}>
                          <span>{step}</span>
                          {stepIndex < path.path.length - 1 && <ArrowRight className="h-3 w-3" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Selected Node/Connection Details */}
      {selectedNode && (
        <Card>
          <CardHeader>
            <CardTitle>Node Details</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const node = filteredFlowData.nodes.find(n => n.id === selectedNode);
              if (!node) return null;
              
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-lg font-semibold">{node.visitors}</div>
                      <div className="text-sm text-muted-foreground">Visitors</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{node.conversions}</div>
                      <div className="text-sm text-muted-foreground">Conversions</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{Math.round(node.averageTime)}s</div>
                      <div className="text-sm text-muted-foreground">Avg Time</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{node.optimizationScore}</div>
                      <div className="text-sm text-muted-foreground">Optimization Score</div>
                    </div>
                  </div>
                  
                  {node.aiInsights.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">AI Insights</h4>
                      <div className="space-y-2">
                        {node.aiInsights.map((insight, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <Brain className="h-4 w-4 text-blue-500 mt-0.5" />
                            <span>{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Flow Metrics */}
      {showMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Flow Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{flowData.metrics.totalVisitors}</div>
                <div className="text-sm text-muted-foreground">Total Visitors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{flowData.metrics.conversionRate}%</div>
                <div className="text-sm text-muted-foreground">Conversion Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{flowData.metrics.averageJourneyLength}</div>
                <div className="text-sm text-muted-foreground">Avg Journey Length</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{flowData.metrics.bottlenecks.length}</div>
                <div className="text-sm text-muted-foreground">Bottlenecks</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper Functions
function determineNodeType(pulse: any, journey: VisitorJourney): FlowNode['type'] {
  if (pulse.type === 'CONVERSION') return 'conversion';
  if (pulse.type === 'FORM_SUBMIT') return 'action';
  if (pulse.url?.includes('exit')) return 'exit';
  return 'page';
}

function calculateNodePosition(index: number, total: number): { x: number; y: number } {
  const cols = Math.ceil(Math.sqrt(total));
  const row = Math.floor(index / cols);
  const col = index % cols;
  
  return {
    x: col * 160 + 20,
    y: row * 100 + 20
  };
}

function calculateOptimizationScore(node: FlowNode): number {
  // Simple optimization score based on conversion rate and engagement
  const conversionRate = node.visitors > 0 ? (node.conversions / node.visitors) * 100 : 0;
  const engagementScore = Math.min(100, node.averageTime / 60 * 20); // 3 minutes = 100 score
  
  return Math.round((conversionRate + engagementScore) / 2);
}

function generateNodeInsights(node: FlowNode): string[] {
  const insights: string[] = [];
  
  if (node.dropOffs > node.visitors * 0.5) {
    insights.push(`High drop-off rate (${Math.round(node.dropOffs / node.visitors * 100)}%) - consider optimizing content`);
  }
  
  if (node.averageTime > 300) {
    insights.push(`Long average time (${Math.round(node.averageTime / 60)} minutes) - may indicate confusion`);
  }
  
  if (node.conversions > 0) {
    insights.push(`Strong conversion performance - replicate success factors`);
  }
  
  return insights;
}

function calculateConnectionConversionRate(connection: FlowConnection, nodes: Map<string, FlowNode>): number {
  const toNode = nodes.get(connection.to);
  if (!toNode) return 0;
  
  return toNode.visitors > 0 ? (toNode.conversions / toNode.visitors) * 100 : 0;
}

function calculateConnectionDropOffRate(connection: FlowConnection, nodes: Map<string, FlowNode>): number {
  const fromNode = nodes.get(connection.from);
  if (!fromNode) return 0;
  
  return fromNode.visitors > 0 ? (fromNode.dropOffs / fromNode.visitors) * 100 : 0;
}

function determineConnectionStrength(connection: FlowConnection): 'strong' | 'medium' | 'weak' {
  if (connection.visitors > 50) return 'strong';
  if (connection.visitors > 20) return 'medium';
  return 'weak';
}

function calculateConnectionOptimization(connection: FlowConnection): number {
  return Math.round(Math.random() * 100); // Simplified for demo
}

function calculateFlowMetrics(
  nodes: Map<string, FlowNode>, 
  connections: Map<string, FlowConnection>, 
  journeys: VisitorJourney[]
): FlowMetrics {
  const totalVisitors = journeys.length;
  const conversions = journeys.filter(j => j.pulseData.some(p => p.type === 'CONVERSION')).length;
  const conversionRate = totalVisitors > 0 ? (conversions / totalVisitors) * 100 : 0;
  const averageJourneyLength = totalVisitors > 0 ? journeys.reduce((sum, j) => sum + j.pulseData.length, 0) / totalVisitors : 0;
  
  return {
    totalVisitors,
    conversionRate: Math.round(conversionRate * 10) / 10,
    averageJourneyLength: Math.round(averageJourneyLength * 10) / 10,
    topPaths: [], // Simplified for demo
    bottlenecks: [] // Simplified for demo
  };
}

function getNodeIcon(type: FlowNode['type']) {
  switch (type) {
    case 'page': return <Eye className="h-3 w-3" />;
    case 'action': return <MousePointer className="h-3 w-3" />;
    case 'conversion': return <Target className="h-3 w-3" />;
    case 'exit': return <XCircle className="h-3 w-3" />;
    default: return <Activity className="h-3 w-3" />;
  }
}

export default InteractiveJourneyFlow;