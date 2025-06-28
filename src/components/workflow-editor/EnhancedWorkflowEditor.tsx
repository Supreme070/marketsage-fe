"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import ReactFlow, {
  type Node,
  type Edge,
  Controls,
  Background,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  ConnectionMode,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
  MiniMap,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  Save, 
  Plus, 
  Undo, 
  Redo, 
  Check, 
  Eye, 
  EyeOff, 
  Map, 
  Loader2, 
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Settings,
  Play,
  Pause,
  Activity,
  Brain,
  Layers,
  Grid3X3,
  Move3D,
} from "lucide-react";
import { toast } from "sonner";

// Enhanced components
import { EnhancedActionNode } from "./nodes/EnhancedActionNode";
import { EnhancedCustomEdge } from "./edges/EnhancedCustomEdge";
import NodeSelector from "./NodeSelector";
import PropertiesPanel from "./PropertiesPanel";
import WorkflowAssistantPanel from "./WorkflowAssistantPanel";

// Enhanced node types configuration
const nodeTypes: NodeTypes = {
  actionNode: EnhancedActionNode,
  // Add other enhanced node types here
};

// Enhanced edge types configuration
const edgeTypes: EdgeTypes = {
  enhanced: EnhancedCustomEdge,
};

interface EnhancedWorkflowEditorProps {
  workflowId?: string;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  isReadOnly?: boolean;
  showAIAssistant?: boolean;
}

export default function EnhancedWorkflowEditor({
  workflowId,
  initialNodes = [],
  initialEdges = [],
  onSave,
  isReadOnly = false,
  showAIAssistant = true,
}: EnhancedWorkflowEditorProps) {
  // Enhanced state management
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isNodeSelectorOpen, setIsNodeSelectorOpen] = useState(false);
  const [connectionInProgress, setConnectionInProgress] = useState<Connection | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<'idle' | 'saving' | 'running' | 'error'>('idle');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Performance monitoring
  const [performanceMetrics, setPerformanceMetrics] = useState({
    nodeCount: 0,
    edgeCount: 0,
    complexity: 0,
    renderTime: 0,
  });

  // Auto-save functionality
  useEffect(() => {
    if (isAutoSaving && onSave && !isReadOnly) {
      const timer = setTimeout(() => {
        onSave(nodes, edges);
        toast.success("Workflow auto-saved", { duration: 2000 });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [nodes, edges, isAutoSaving, onSave, isReadOnly]);

  // Enhanced validation
  const validateWorkflow = useCallback(() => {
    const errors: string[] = [];
    
    // Check for orphaned nodes
    const connectedNodeIds = new Set<string>();
    edges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });
    
    const orphanedNodes = nodes.filter(node => 
      node.type !== 'triggerNode' && !connectedNodeIds.has(node.id)
    );
    
    if (orphanedNodes.length > 0) {
      errors.push(`${orphanedNodes.length} disconnected node(s) found`);
    }

    // Check for missing configurations
    const unconfiguredNodes = nodes.filter(node => 
      !node.data.properties?.configured
    );
    
    if (unconfiguredNodes.length > 0) {
      errors.push(`${unconfiguredNodes.length} node(s) need configuration`);
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [nodes, edges]);

  // Enhanced connection handling
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        type: 'enhanced',
        animated: true,
      };
      setEdges((eds) => addEdge(newEdge, eds));
      setIsAutoSaving(true);
    },
    [setEdges]
  );

  // Enhanced node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.stopPropagation();
    setSelectedNode(node);
  }, []);

  // Performance monitoring
  useEffect(() => {
    const startTime = performance.now();
    
    setPerformanceMetrics({
      nodeCount: nodes.length,
      edgeCount: edges.length,
      complexity: nodes.length + edges.length * 0.5,
      renderTime: performance.now() - startTime,
    });
  }, [nodes, edges]);

  return (
    <div className="h-full w-full relative overflow-hidden bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Enhanced toolbar */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-4 left-4 right-4 z-50"
      >
        <Card className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border-0 shadow-xl">
          <div className="flex items-center justify-between p-4">
            {/* Left section - Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsNodeSelectorOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700"
                disabled={isReadOnly}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Node
              </Button>
              
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
              
              <Button variant="ghost" size="sm" disabled={isReadOnly}>
                <Undo className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="sm" disabled={isReadOnly}>
                <Redo className="h-4 w-4" />
              </Button>
              
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSave?.(nodes, edges)}
                disabled={isReadOnly || workflowStatus === 'saving'}
              >
                {workflowStatus === 'saving' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save
              </Button>
            </div>

            {/* Center section - Status */}
            <div className="flex items-center space-x-4">
              {/* Performance metrics */}
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">
                  <Layers className="h-3 w-3 mr-1" />
                  {performanceMetrics.nodeCount} nodes
                </Badge>
                <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
                  <Activity className="h-3 w-3 mr-1" />
                  {performanceMetrics.edgeCount} connections
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`${
                    performanceMetrics.complexity > 20 
                      ? 'bg-red-50 dark:bg-red-950 text-red-600' 
                      : 'bg-yellow-50 dark:bg-yellow-950 text-yellow-600'
                  }`}
                >
                  <Brain className="h-3 w-3 mr-1" />
                  Complexity: {Math.round(performanceMetrics.complexity)}
                </Badge>
              </div>

              {/* Validation status */}
              <AnimatePresence>
                {validationErrors.length > 0 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    <Badge variant="destructive" className="animate-pulse">
                      {validationErrors.length} issue(s)
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right section - View controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMinimap(!showMinimap)}
              >
                <Map className={`h-4 w-4 ${showMinimap ? 'text-blue-500' : ''}`} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              
              {showAIAssistant && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
                  className={isAIAssistantOpen ? 'bg-purple-100 dark:bg-purple-900' : ''}
                >
                  <Sparkles className={`h-4 w-4 ${isAIAssistantOpen ? 'text-purple-600' : ''}`} />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Enhanced ReactFlow container */}
      <ReactFlowProvider>
        <div className="h-full w-full pt-20">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            className="bg-transparent"
            defaultEdgeOptions={{
              type: 'enhanced',
              style: { strokeWidth: 2 },
              animated: true,
            }}
          >
            {/* Enhanced background with multiple patterns */}
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={20} 
              size={1}
              className="opacity-30"
            />
            <Background 
              variant={BackgroundVariant.Lines} 
              gap={100} 
              size={0.5}
              className="opacity-10"
            />

            {/* Enhanced controls */}
            <Controls 
              className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-0 shadow-xl rounded-lg"
              showZoom={true}
              showFitView={true}
              showInteractive={true}
            />

            {/* Enhanced minimap */}
            {showMinimap && (
              <MiniMap
                className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-0 shadow-xl rounded-lg"
                nodeColor="#3b82f6"
                maskColor="rgba(0, 0, 0, 0.1)"
                position="bottom-left"
              />
            )}

            {/* Custom panels */}
            <Panel position="top-right" className="space-y-2">
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-0 shadow-xl p-3">
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    <div>Render: {Math.round(performanceMetrics.renderTime)}ms</div>
                    <div>Status: {workflowStatus}</div>
                  </div>
                </Card>
              </motion.div>
            </Panel>

            {/* Workflow status overlay */}
            <Panel position="bottom-center">
              <AnimatePresence>
                {workflowStatus === 'running' && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                  >
                    <Card className="bg-green-500 text-white border-0 shadow-xl">
                      <div className="flex items-center p-3">
                        <Play className="h-4 w-4 mr-2 animate-pulse" />
                        Workflow Running...
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </Panel>
          </ReactFlow>
        </div>
      </ReactFlowProvider>

      {/* Enhanced Node Selector Modal */}
      <AnimatePresence>
        {isNodeSelectorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setIsNodeSelectorOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl mx-4"
            >
              <NodeSelector
                onSelectNode={(nodeData) => {
                  // Enhanced node creation logic
                  const newNode: Node = {
                    id: `node-${Date.now()}`,
                    type: 'actionNode',
                    position: { x: 100, y: 100 },
                    data: nodeData,
                  };
                  setNodes((nds) => [...nds, newNode]);
                  setIsNodeSelectorOpen(false);
                  setIsAutoSaving(true);
                }}
                onClose={() => setIsNodeSelectorOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Properties Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="fixed right-0 top-0 bottom-0 w-96 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-l border-gray-200 dark:border-gray-700 shadow-2xl z-40"
          >
            <PropertiesPanel
              node={selectedNode}
              onNodeUpdate={(updatedNode) => {
                setNodes((nds) =>
                  nds.map((n) => (n.id === updatedNode.id ? updatedNode : n))
                );
                setSelectedNode(updatedNode);
                setIsAutoSaving(true);
              }}
              onClose={() => setSelectedNode(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced AI Assistant Panel */}
      <AnimatePresence>
        {isAIAssistantOpen && showAIAssistant && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            className="fixed left-0 top-0 bottom-0 w-96 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-r border-gray-200 dark:border-gray-700 shadow-2xl z-40"
          >
            <WorkflowAssistantPanel
              nodes={nodes}
              edges={edges}
              onApplyRecommendation={(recommendation) => {
                // Apply AI recommendations
                toast.success("AI recommendation applied");
                setIsAutoSaving(true);
              }}
              onClose={() => setIsAIAssistantOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced floating validation panel */}
      <AnimatePresence>
        {validationErrors.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 z-40"
          >
            <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 shadow-xl">
              <div className="p-4">
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                  Workflow Issues
                </h4>
                <ul className="space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm text-red-700 dark:text-red-300">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}