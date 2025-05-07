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
  useStoreApi,
  MiniMap,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Save, Plus, Undo, Redo, Check, Eye, EyeOff, Map } from "lucide-react";
import { toast } from "sonner";
import NodeSelector from "./NodeSelector";
import { TriggerNode } from "./nodes/TriggerNode";
import { ActionNode } from "./nodes/ActionNode";
import { ConditionNode } from "./nodes/ConditionNode";
import { CustomEdge } from "./edges/CustomEdge";
import PropertiesPanel from "./PropertiesPanel";

// Node types configuration
const nodeTypes: NodeTypes = {
  triggerNode: TriggerNode,
  actionNode: ActionNode,
  conditionNode: ConditionNode,
};

// Edge types configuration
const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

// Initial nodes for a new workflow
const initialNodes: Node[] = [
  {
    id: "trigger-1",
    type: "triggerNode",
    position: { x: 250, y: 100 },
    data: {
      label: "Contact added to list",
      description: "When a contact is added to a specified list",
      icon: "List",
      properties: {
        listId: "",
        listName: "Select a list...",
      },
    },
  },
];

// No initial edges
const initialEdges: Edge[] = [];

// Workflow validation function
const validateWorkflow = (nodes: Node[], edges: Edge[]) => {
  // Check if we have at least one trigger node
  const hasTrigger = nodes.some(node => node.type === 'triggerNode');
  if (!hasTrigger) {
    return { valid: false, message: "Workflow must have at least one trigger" };
  }

  // Check if we have at least one action node
  const hasAction = nodes.some(node => node.type === 'actionNode');
  if (!hasAction) {
    return { valid: false, message: "Workflow must have at least one action" };
  }

  // Check if all nodes are connected (except trigger nodes which can have no incoming)
  const connectedNodeIds = new Set<string>();

  // Add all source nodes to the set
  edges.forEach(edge => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  // Check if any non-trigger nodes are not in the set (disconnected)
  const disconnectedNodes = nodes.filter(node =>
    node.type !== 'triggerNode' && !connectedNodeIds.has(node.id)
  );

  if (disconnectedNodes.length > 0) {
    return {
      valid: false,
      message: `${disconnectedNodes.length} node(s) are disconnected`
    };
  }

  return { valid: true, message: "Workflow is valid" };
};

export default function WorkflowEditor() {
  // Manage states for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showNodeSelector, setShowNodeSelector] = useState(false);
  const [nodeSelectorPosition, setNodeSelectorPosition] = useState({ x: 0, y: 0 });
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const connectingNodeId = useRef<string | null>(null);
  const { project, getNodes } = useReactFlow();

  // Add minimap toggle state
  const [showMiniMap, setShowMiniMap] = useState(true);

  // History states for undo/redo
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [previewMode, setPreviewMode] = useState(false);

  // Load workflow from local storage
  useEffect(() => {
    const savedWorkflow = localStorage.getItem('marketsage-workflow');
    if (savedWorkflow) {
      try {
        const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedWorkflow);
        if (savedNodes && savedEdges) {
          setNodes(savedNodes);
          setEdges(savedEdges);
          // Initialize history with the loaded state
          setHistory([{ nodes: savedNodes, edges: savedEdges }]);
          setHistoryIndex(0);
        }
      } catch (error) {
        console.error('Error loading workflow from localStorage:', error);
      }
    }
  }, [setNodes, setEdges]);

  // Add state to history when it changes
  const addToHistory = useCallback((nodes: Node[], edges: Edge[]) => {
    // Create a deep copy to avoid reference issues
    const newHistoryEntry = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges))
    };

    // If we're not at the end of history, truncate it
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newHistoryEntry);

    // Limit history size to 20 entries
    if (newHistory.length > 20) {
      newHistory.shift();
    }

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const { nodes: historyNodes, edges: historyEdges } = history[newIndex];
      setNodes(historyNodes);
      setEdges(historyEdges);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const { nodes: historyNodes, edges: historyEdges } = history[newIndex];
      setNodes(historyNodes);
      setEdges(historyEdges);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Connect nodes on edge creation (modified to add to history)
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdges = addEdge({ ...params, type: 'custom' }, edges);
      setEdges(newEdges);
      addToHistory(nodes, newEdges);
    },
    [setEdges, edges, nodes, addToHistory]
  );

  // Handle node selection
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
    },
    []
  );

  // Handle background click to deselect nodes
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setShowNodeSelector(false);
  }, []);

  // Handle node drag to update positions (modified to add to history)
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const updatedNodes = getNodes().map((n) => {
        if (n.id === node.id) {
          return {
            ...n,
            position: node.position,
          };
        }
        return n;
      });
      setNodes(updatedNodes);
      addToHistory(updatedNodes, edges);
    },
    [getNodes, setNodes, edges, addToHistory]
  );

  // Connect nodes when dragging from a handle
  const onConnectStart = useCallback(
    (_: React.MouseEvent, { nodeId }: { nodeId: string | null }) => {
      connectingNodeId.current = nodeId;
    },
    []
  );

  // Show node selector when connection ends on empty space
  const onConnectEnd = useCallback(
    (event: MouseEvent) => {
      if (!connectingNodeId.current || !reactFlowWrapper.current) return;

      const targetIsPane = (event.target as Element).classList.contains(
        "react-flow__pane"
      );

      if (targetIsPane) {
        // Calculate position of the new node
        const { top, left } = reactFlowWrapper.current.getBoundingClientRect();
        const position = project({
          x: event.clientX - left - 75,
          y: event.clientY - top - 25,
        });

        setNodeSelectorPosition(position);
        setShowNodeSelector(true);
      }

      connectingNodeId.current = null;
    },
    [project]
  );

  // Add a new node from selector (modified to add to history)
  const addNewNode = useCallback(
    (type: string, label: string, description: string, icon: string) => {
      const newNode: Node = {
        id: `${type}-${nodes.length + 1}`,
        type: type === "trigger" ? "triggerNode" : type === "condition" ? "conditionNode" : "actionNode",
        position: nodeSelectorPosition,
        data: {
          label,
          description,
          icon,
          properties: {},
        },
      };

      const newEdge = {
        id: `e-${edges.length + 1}`,
        source: connectingNodeId.current!,
        target: newNode.id,
        type: "custom",
      };

      const newNodes = [...nodes, newNode];
      const newEdges = [...edges, newEdge as Edge];

      setNodes(newNodes);
      setEdges(newEdges);
      addToHistory(newNodes, newEdges);
      setShowNodeSelector(false);
    },
    [edges.length, nodes, nodeSelectorPosition, setEdges, setNodes, edges, addToHistory]
  );

  // Update node properties (modified to add to history)
  const updateNodeProperties = useCallback(
    (nodeId: string, properties: any) => {
      const updatedNodes = nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              properties,
            },
          };
        }
        return node;
      });

      setNodes(updatedNodes);
      addToHistory(updatedNodes, edges);
    },
    [setNodes, nodes, edges, addToHistory]
  );

  // Delete selected node (modified to add to history)
  const deleteSelectedNode = useCallback(() => {
    if (selectedNode) {
      const newNodes = nodes.filter((node) => node.id !== selectedNode.id);
      const newEdges = edges.filter(
        (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id
      );

      setNodes(newNodes);
      setEdges(newEdges);
      addToHistory(newNodes, newEdges);
      setSelectedNode(null);
    }
  }, [selectedNode, setEdges, setNodes, nodes, edges, addToHistory]);

  // Save workflow (modified to save to localStorage and validate)
  const saveWorkflow = useCallback(() => {
    const validation = validateWorkflow(nodes, edges);

    if (validation.valid) {
      const workflow = {
        nodes,
        edges,
      };

      // Save to localStorage
      localStorage.setItem('marketsage-workflow', JSON.stringify(workflow));

      // Here you would also save to the backend
      console.log("Saving workflow:", workflow);

      toast.success("Workflow saved successfully");
    } else {
      toast.error(`Cannot save: ${validation.message}`);
    }
  }, [nodes, edges]);

  // Toggle preview mode
  const togglePreviewMode = useCallback(() => {
    setPreviewMode(!previewMode);
  }, [previewMode]);

  // Toggle minimap
  const toggleMiniMap = useCallback(() => {
    setShowMiniMap(!showMiniMap);
  }, [showMiniMap]);

  return (
    <div className="h-full w-full">
      <div
        className="h-[600px] w-full border border-border rounded-md bg-background"
        ref={reactFlowWrapper}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={!previewMode ? onNodeClick : undefined}
          onPaneClick={onPaneClick}
          onNodeDragStop={!previewMode ? onNodeDragStop : undefined}
          onConnectStart={!previewMode ? onConnectStart : undefined}
          onConnectEnd={!previewMode ? onConnectEnd as any : undefined}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          nodesDraggable={!previewMode}
          nodesConnectable={!previewMode}
          elementsSelectable={!previewMode}
          fitView
          snapToGrid
          attributionPosition="bottom-right"
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Controls />

          {showMiniMap && (
            <MiniMap
              nodeStrokeWidth={3}
              zoomable
              pannable
              nodeBorderRadius={2}
              nodeColor={(node) => {
                switch (node.type) {
                  case 'triggerNode':
                    return '#7c3aed'; // Primary color for triggers
                  case 'actionNode':
                    return '#3b82f6'; // Blue for actions
                  case 'conditionNode':
                    return '#f97316'; // Orange for conditions
                  default:
                    return '#94a3b8';
                }
              }}
            />
          )}

          {showNodeSelector && !previewMode && (
            <Panel position="top-center">
              <NodeSelector onSelect={addNewNode} />
            </Panel>
          )}

          <Panel position="top-right">
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleMiniMap}
                title={showMiniMap ? "Hide Mini Map" : "Show Mini Map"}
              >
                <Map className={`h-4 w-4 ${!showMiniMap ? 'text-muted-foreground' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={togglePreviewMode}
                title={previewMode ? "Exit Preview Mode" : "Enter Preview Mode"}
              >
                {previewMode ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
                {previewMode ? "Edit" : "Preview"}
              </Button>
              {!previewMode && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    title="Undo"
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    title="Redo"
                  >
                    <Redo className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deleteSelectedNode}
                    disabled={!selectedNode}
                  >
                    <Trash2 className="mr-1 h-4 w-4" /> Delete Node
                  </Button>
                </>
              )}
              <Button variant="default" size="sm" onClick={saveWorkflow}>
                <Save className="mr-1 h-4 w-4" /> Save Workflow
              </Button>
            </div>
          </Panel>

          {!previewMode && (
            <Panel position="bottom-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const position = project({
                    x: 250,
                    y: 250,
                  });
                  setNodeSelectorPosition(position);
                  setShowNodeSelector(true);
                }}
              >
                <Plus className="mr-1 h-4 w-4" /> Add Node
              </Button>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {selectedNode && !previewMode && (
        <Card className="mt-4 p-4">
          <PropertiesPanel
            node={selectedNode}
            onChange={(properties) =>
              updateNodeProperties(selectedNode.id, properties)
            }
          />
        </Card>
      )}
    </div>
  );
}

// ReactFlow provider wrapper for the editor
export function WorkflowEditorProvider() {
  return (
    <ReactFlowProvider>
      <WorkflowEditor />
    </ReactFlowProvider>
  );
}
