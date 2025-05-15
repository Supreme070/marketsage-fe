"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Panel,
  MarkerType,
  Handle,
  Position,
  NodeProps,
} from 'reactflow';
import { motion } from 'framer-motion';
import { Zap, Mail, MessageSquare, Users, BellRing, Check, Plus, ChevronRight, X, Circle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import 'reactflow/dist/style.css';

// Define custom node components inline instead of importing them
// TriggerNode component
const TriggerNode = ({ data, isConnectable }: NodeProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <motion.div
      className={`rounded-lg border shadow-sm px-3 py-2 min-w-[120px] ${
        isDark
          ? 'bg-green-950/60 border-green-800/50 text-green-400'
          : 'bg-green-50 border-green-200 text-green-700'
      }`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', y: -2 }}
    >
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-md ${
          isDark ? 'bg-green-900/60' : 'bg-green-100'
        }`}>
          {data.icon}
        </div>
        <div className="font-medium">{data.label}</div>
      </div>
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={`w-3 h-3 border-2 ${
          isDark ? 'bg-green-400 border-green-600' : 'bg-green-500 border-green-700'
        }`}
        isConnectable={isConnectable}
      />
      
      {/* Pulsing indicator */}
      <div className="absolute top-2 right-2 flex items-center justify-center">
        <span className={`w-2 h-2 rounded-full ${
          isDark ? 'bg-green-400' : 'bg-green-500'
        } animate-ping absolute`}></span>
        <span className={`w-2 h-2 rounded-full ${
          isDark ? 'bg-green-400' : 'bg-green-500'
        } relative`}></span>
      </div>
    </motion.div>
  );
};

// ActionNode component
const ActionNode = ({ data, isConnectable }: NodeProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <motion.div
      className={`rounded-lg border shadow-sm px-3 py-2 min-w-[120px] ${
        isDark
          ? 'bg-primary-950/60 border-primary-800/50 text-primary-400'
          : 'bg-primary-50 border-primary-200 text-primary-700'
      }`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', y: -2 }}
    >
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-md ${
          isDark ? 'bg-primary-900/60' : 'bg-primary-100'
        }`}>
          {data.icon}
        </div>
        <div className="font-medium">{data.label}</div>
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className={`w-3 h-3 border-2 ${
          isDark ? 'bg-primary-400 border-primary-600' : 'bg-primary-500 border-primary-700'
        }`}
        isConnectable={isConnectable}
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={`w-3 h-3 border-2 ${
          isDark ? 'bg-primary-400 border-primary-600' : 'bg-primary-500 border-primary-700'
        }`}
        isConnectable={isConnectable}
      />
      
      {/* Progress indicator */}
      <div className="absolute -bottom-1 left-0 right-0 h-1 rounded-b-lg overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-primary-400 to-primary-600"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            repeatType: "reverse",
            ease: "easeInOut"
          }}
        />
      </div>
    </motion.div>
  );
};

// ConditionNode component
const ConditionNode = ({ data, isConnectable }: NodeProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <motion.div
      className={`rounded-lg border shadow-sm px-3 py-2 min-w-[120px] ${
        isDark
          ? 'bg-blue-950/60 border-blue-800/50 text-blue-400'
          : 'bg-blue-50 border-blue-200 text-blue-700'
      }`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', y: -2 }}
    >
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-md ${
          isDark ? 'bg-blue-900/60' : 'bg-blue-100'
        }`}>
          {data.icon}
        </div>
        <div className="font-medium">{data.label}</div>
      </div>
      
      {/* Path options */}
      <div className="mt-2 flex justify-between text-xs">
        <div className="flex items-center">
          <CheckCircle size={12} className="mr-1 text-green-500" />
          <span>Yes</span>
        </div>
        <div className="flex items-center">
          <XCircle size={12} className="mr-1 text-amber-500" />
          <span>No</span>
        </div>
      </div>
      
      {/* Input handle - top */}
      <Handle
        type="target"
        position={Position.Top}
        className={`w-3 h-3 border-2 ${
          isDark ? 'bg-blue-400 border-blue-600' : 'bg-blue-500 border-blue-700'
        }`}
        isConnectable={isConnectable}
      />
      
      {/* Output handle - bottom left (Yes) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        className={`w-3 h-3 border-2 left-[25%] ${
          isDark ? 'bg-green-400 border-green-600' : 'bg-green-500 border-green-700'
        }`}
        isConnectable={isConnectable}
      />
      
      {/* Output handle - bottom right (No) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        className={`w-3 h-3 border-2 left-[75%] ${
          isDark ? 'bg-amber-400 border-amber-600' : 'bg-amber-500 border-amber-700'
        }`}
        isConnectable={isConnectable}
      />
      
      {/* Thinking animation */}
      <div className="absolute -top-1 left-0 right-0 h-1 rounded-t-lg overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 bg-[length:200%_100%]"
          animate={{
            backgroundPosition: ["0% center", "100% center", "0% center"],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear"
          }}
        />
      </div>
    </motion.div>
  );
};

// DelayNode component
const DelayNode = ({ data, isConnectable }: NodeProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [progress, setProgress] = useState(0);
  
  // Animated progress simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          return 0;
        }
        return prev + 20;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <motion.div
      className={`rounded-lg border shadow-sm px-3 py-2 min-w-[120px] ${
        isDark
          ? 'bg-purple-950/60 border-purple-800/50 text-purple-400'
          : 'bg-purple-50 border-purple-200 text-purple-700'
      }`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', y: -2 }}
    >
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-md ${
          isDark ? 'bg-purple-900/60' : 'bg-purple-100'
        }`}>
          {data.icon}
        </div>
        <div className="font-medium">{data.label}</div>
      </div>
      
      {/* Timer visualization */}
      <div className="mt-2 w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-purple-500"
          style={{ width: `${progress}%` }}
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
      
      {/* Circular timer indicators */}
      <div className="flex justify-around mt-2">
        {[0, 1, 2, 3, 4].map((index) => (
          <Circle 
            key={index} 
            size={8} 
            className={
              progress >= (index + 1) * 20 
                ? "fill-purple-500 text-purple-500" 
                : "text-gray-300 dark:text-gray-600"
            } 
          />
        ))}
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className={`w-3 h-3 border-2 ${
          isDark ? 'bg-purple-400 border-purple-600' : 'bg-purple-500 border-purple-700'
        }`}
        isConnectable={isConnectable}
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={`w-3 h-3 border-2 ${
          isDark ? 'bg-purple-400 border-purple-600' : 'bg-purple-500 border-purple-700'
        }`}
        isConnectable={isConnectable}
      />
    </motion.div>
  );
};

// EndNode component
const EndNode = ({ data, isConnectable }: NodeProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <motion.div
      className={`rounded-lg border shadow-sm px-3 py-2 min-w-[100px] ${
        isDark
          ? 'bg-slate-900/80 border-slate-800/70 text-slate-300'
          : 'bg-slate-100 border-slate-200 text-slate-700'
      }`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', y: -2 }}
    >
      <div className="flex items-center justify-center gap-2">
        <div className={`p-1.5 rounded-full ${
          isDark ? 'bg-slate-800/90' : 'bg-slate-200'
        }`}>
          {data.icon}
        </div>
        <div className="font-medium">{data.label}</div>
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className={`w-3 h-3 border-2 ${
          isDark ? 'bg-slate-400 border-slate-600' : 'bg-slate-500 border-slate-600'
        }`}
        isConnectable={isConnectable}
      />
      
      {/* Success animation */}
      <motion.div 
        className={`absolute inset-0 rounded-lg opacity-0 ${
          isDark ? 'bg-green-500/20' : 'bg-green-500/10'
        }`}
        animate={{ 
          opacity: [0, 0.5, 0],
          scale: [0.85, 1, 0.85]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
          times: [0, 0.5, 1]
        }}
      />
    </motion.div>
  );
};

// Define node types
const nodeTypes = {
  triggerNode: TriggerNode,
  actionNode: ActionNode,
  conditionNode: ConditionNode,
  delayNode: DelayNode,
  endNode: EndNode,
};

// Define the initial nodes
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'triggerNode',
    data: { label: 'Start Campaign', icon: <Zap size={18} /> },
    position: { x: 250, y: 25 },
  },
  {
    id: '2',
    type: 'conditionNode',
    data: { label: 'Is Customer Active?', icon: <Users size={18} /> },
    position: { x: 250, y: 125 },
  },
  {
    id: '3',
    type: 'actionNode',
    data: { label: 'Send Email', icon: <Mail size={18} /> },
    position: { x: 100, y: 225 },
  },
  {
    id: '4',
    type: 'actionNode',
    data: { label: 'Send SMS', icon: <MessageSquare size={18} /> },
    position: { x: 400, y: 225 },
  },
  {
    id: '5',
    type: 'delayNode',
    data: { label: 'Wait 2 Days', icon: <BellRing size={18} /> },
    position: { x: 250, y: 325 },
  },
  {
    id: '6',
    type: 'endNode',
    data: { label: 'End', icon: <Check size={18} /> },
    position: { x: 250, y: 425 },
  },
];

// Define the initial edges
const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    animated: true,
    style: { stroke: '#14b8a6', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#14b8a6',
    },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    animated: true,
    label: 'Yes',
    labelBgStyle: { fill: 'transparent' },
    labelStyle: { fill: '#14b8a6', fontWeight: 700 },
    style: { stroke: '#14b8a6', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#14b8a6',
    },
  },
  {
    id: 'e2-4',
    source: '2',
    target: '4',
    animated: true,
    label: 'No',
    labelBgStyle: { fill: 'transparent' },
    labelStyle: { fill: '#f59e0b', fontWeight: 700 },
    style: { stroke: '#f59e0b', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#f59e0b',
    },
  },
  {
    id: 'e3-5',
    source: '3',
    target: '5',
    animated: true,
    style: { stroke: '#14b8a6', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#14b8a6',
    },
  },
  {
    id: 'e4-5',
    source: '4',
    target: '5',
    animated: true,
    style: { stroke: '#f59e0b', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#f59e0b',
    },
  },
  {
    id: 'e5-6',
    source: '5',
    target: '6',
    animated: true,
    style: { stroke: '#8b5cf6', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#8b5cf6',
    },
  },
];

// Node types for the sidebar
const nodeOptions = [
  { type: 'triggerNode', label: 'Trigger', icon: <Zap size={16} /> },
  { type: 'actionNode', label: 'Action', icon: <Mail size={16} /> },
  { type: 'conditionNode', label: 'Condition', icon: <Users size={16} /> },
  { type: 'delayNode', label: 'Delay', icon: <BellRing size={16} /> },
  { type: 'endNode', label: 'End', icon: <Check size={16} /> },
];

// Internal Flow component
function Flow() {
  const { theme } = useTheme();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const connectingNodeId = useRef<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isRunning, setIsRunning] = useState(false);
  const [activePath, setActivePath] = useState<string[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const { screenToFlowPosition, project } = useReactFlow();

  // Handle node dragging
  const onConnect = (params: Connection) => {
    // Create animated edge with matching color to the node
    const sourceNode = nodes.find(node => node.id === params.source);
    let edgeColor = '#14b8a6'; // Default to teal
    
    if (sourceNode?.type === 'conditionNode') {
      // Different color for condition branches
      edgeColor = params.sourceHandle === 'yes' ? '#14b8a6' : '#f59e0b';
    }
    
    const newEdge = {
      ...params,
      animated: true,
      style: { stroke: edgeColor, strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeColor,
      },
    };
    
    setEdges(eds => addEdge(newEdge, eds));
  };

  // Handle drag & drop from sidebar
  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (!reactFlowWrapper.current) return;

    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const type = event.dataTransfer.getData('application/reactflow');
    const label = event.dataTransfer.getData('application/reactflow/label');
    const iconType = event.dataTransfer.getData('application/reactflow/icon');
    
    // Check if the dropped element is valid
    if (typeof type === 'undefined' || !type) {
      return;
    }

    // Get position relative to the flow container
    const position = screenToFlowPosition({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });

    // Determine icon component based on dropped type
    let icon;
    switch (iconType) {
      case 'Zap': icon = <Zap size={18} />; break;
      case 'Mail': icon = <Mail size={18} />; break;
      case 'Users': icon = <Users size={18} />; break;
      case 'BellRing': icon = <BellRing size={18} />; break;
      case 'Check': icon = <Check size={18} />; break;
      default: icon = <Zap size={18} />;
    }

    // Create new node
    const newNode = {
      id: `${nodes.length + 1}`,
      type,
      position,
      data: { label: label || 'New Node', icon },
    };

    setNodes(nds => nds.concat(newNode));
  };

  // Handler for drag start from sidebar
  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    nodeType: string,
    label: string,
    icon: string
  ) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow/label', label);
    event.dataTransfer.setData('application/reactflow/icon', icon);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Run the workflow animation
  const runWorkflow = () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setIsDemoMode(true);
    setActivePath([]);
    
    // Trace a path through the workflow
    const traversePath = async (currentNodeId: string, path: string[] = []) => {
      // Add current node to path
      const newPath = [...path, currentNodeId];
      setActivePath(newPath);
      
      // Find outgoing edges
      const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
      
      // If no more edges, we're done
      if (outgoingEdges.length === 0) {
        return;
      }
      
      // Wait a bit for animation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // If it's a condition node, randomly choose yes or no path
      if (nodes.find(n => n.id === currentNodeId)?.type === 'conditionNode') {
        const yesEdge = outgoingEdges.find(e => e.sourceHandle === 'yes');
        const noEdge = outgoingEdges.find(e => e.sourceHandle === 'no');
        
        // Randomly choose path
        const chosenEdge = Math.random() > 0.5 ? yesEdge || noEdge : noEdge || yesEdge;
        
        if (chosenEdge && chosenEdge.target) {
          await traversePath(chosenEdge.target, newPath);
        }
      } else {
        // For non-condition nodes, follow first outgoing edge
        if (outgoingEdges[0] && outgoingEdges[0].target) {
          await traversePath(outgoingEdges[0].target, newPath);
        }
      }
    };
    
    // Start traversal from node 1
    traversePath('1').then(() => {
      setTimeout(() => {
        setIsRunning(false);
      }, 1000);
    });
  };

  // Reset the workflow
  const resetWorkflow = () => {
    setActivePath([]);
    setIsRunning(false);
    setIsDemoMode(false);
  };

  return (
    <div 
      className={`w-full h-[500px] relative rounded-lg overflow-hidden ${
        theme === 'dark' ? 'border border-slate-800' : 'border border-slate-200'
      }`}
      ref={reactFlowWrapper}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.5}
        maxZoom={1.5}
        nodesDraggable={!isRunning}
        nodesConnectable={!isRunning}
        elementsSelectable={!isRunning}
      >
        <Controls />
        
        <Background 
          color={theme === 'dark' ? '#334155' : '#e2e8f0'} 
          gap={16}
          size={1}
        />
        
        <Panel position="top-right" className="flex gap-2">
          {isDemoMode ? (
            <Button
              size="sm"
              variant="destructive"
              className="flex items-center gap-1 uppercase text-xs font-bold tracking-wider opacity-90 hover:opacity-100"
              onClick={resetWorkflow}
              disabled={isRunning}
            >
              <X size={14} />
              Stop
            </Button>
          ) : (
            <Button
              size="sm"
              variant="default"
              className="flex items-center gap-1 bg-gradient-to-r from-primary-600 to-primary uppercase text-xs font-bold tracking-wider"
              onClick={runWorkflow}
            >
              <Zap size={14} />
              Run Flow
            </Button>
          )}
        </Panel>

        {/* Node palette - draggable nodes for users to add */}
        <Panel position="top-left" className="flex flex-col gap-2 max-w-[200px]">
          <div className={`rounded-md p-2 ${
            theme === 'dark' 
              ? 'bg-slate-800/80 backdrop-blur-sm border border-slate-700' 
              : 'bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm'
          }`}>
            <h3 className={`text-xs font-medium mb-2 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Drag to add
            </h3>
            <div className="flex flex-wrap gap-1">
              {nodeOptions.map((option) => (
                <div
                  key={option.type}
                  className={`cursor-grab rounded px-2 py-1 text-xs flex items-center gap-1 ${
                    theme === 'dark'
                      ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  onDragStart={(event) => onDragStart(event, option.type, option.label, option.icon.type.name)}
                  draggable
                >
                  {option.icon}
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </ReactFlow>
      
      {/* Demo mode overlay with animated data flow */}
      {isDemoMode && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {/* Data pulse animation on active connections */}
          {edges.map(edge => {
            const isActive = 
              activePath.includes(edge.source) && 
              activePath.includes(edge.target) &&
              activePath.indexOf(edge.target) === activePath.indexOf(edge.source) + 1;
              
            if (!isActive) return null;
            
            return (
              <div key={`pulse-${edge.id}`} className="absolute">
                {/* This would be replaced with actual animated elements positioned along the path */}
                {/* Implementation depends on having exact path coordinates */}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Instructions overlay for first-time users */}
      <div className={`absolute bottom-4 left-4 rounded-md p-3 z-20 transition-opacity ${
        isDemoMode ? 'opacity-0' : 'opacity-100'
      } ${
        theme === 'dark' 
          ? 'bg-slate-800/90 backdrop-blur-sm border border-slate-700' 
          : 'bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm'
      }`}>
        <h4 className={`text-xs font-medium flex items-center gap-1 ${
          theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
        }`}>
          <ChevronRight size={12} />
          Pro Tip
        </h4>
        <p className={`text-xs mt-1 ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
        }`}>
          Drag nodes to rearrange them or add new ones from the panel
        </p>
      </div>
    </div>
  );
}

// Main exported component
export function WorkflowDemo() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <ReactFlowProvider>
        <Flow />
      </ReactFlowProvider>
      
      {/* Instructions below the flow */}
      <div className="mt-4 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This is a simplified version of our drag-and-drop workflow builder.
          Create your own automated marketing sequences with our full version.
        </p>
      </div>
    </div>
  );
} 