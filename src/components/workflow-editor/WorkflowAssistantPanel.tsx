"use client";

import { useState, useEffect } from "react";
import { useReactFlow, type Node, type Edge } from "reactflow";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Lightbulb,
  Sparkles,
  PlusCircle,
  Wand2,
  ArrowRight,
  ShieldCheck,
  InfoIcon,
  RefreshCw,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getWorkflowRecommendations, suggestWorkflowTemplate, type WorkflowRecommendation, type WorkflowGoal } from "@/lib/advanced-ai/workflow-assistant-client";

interface WorkflowAssistantPanelProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Impact badge component
const ImpactBadge = ({ impact }: { impact: 'HIGH' | 'MEDIUM' | 'LOW' }) => {
  const colorMap = {
    HIGH: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    LOW: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
  };
  
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colorMap[impact]}`}>
      {impact} IMPACT
    </span>
  );
};

export default function WorkflowAssistantPanel({
  isOpen = false,
  onOpenChange,
}: WorkflowAssistantPanelProps) {
  try {
    const { getNodes, getEdges, setNodes, setEdges, addNodes, addEdges } = useReactFlow();
    const [recommendations, setRecommendations] = useState<WorkflowRecommendation[]>([]);
    const [selectedGoal, setSelectedGoal] = useState<WorkflowGoal>("GENERAL");
    const [selectedIndustry, setSelectedIndustry] = useState<string>("any");
    const [isLoading, setIsLoading] = useState(false);
    const [featuredRecommendation, setFeaturedRecommendation] = useState<WorkflowRecommendation | null>(null);
    
    // Get recommendations whenever nodes/edges change or goals change
    useEffect(() => {
      if (isOpen) {
        refreshRecommendations();
      }
    }, [isOpen, selectedGoal, selectedIndustry]);
    
    const refreshRecommendations = async () => {
      setIsLoading(true);
      try {
        const nodes = getNodes();
        const edges = getEdges();
        
        // Get local recommendations first
        const localRecommendations = await getWorkflowRecommendations(nodes, edges, {
          goal: selectedGoal,
          industry: selectedIndustry === "any" ? undefined : selectedIndustry
        });
        
        // Try to get AI-enhanced recommendations if we have a workflow context
        let aiRecommendations: WorkflowRecommendation[] = [];
        try {
          // Check if we're in a workflow editing context
          const workflowElement = document.querySelector('[data-workflow-id]');
          const workflowId = workflowElement?.getAttribute('data-workflow-id');
          
          if (workflowId) {
            const response = await fetch('/api/v2/ai/workflows/enhance', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                workflowId,
                action: 'analyze'
              })
            });
            
            if (response.ok) {
              const aiData = await response.json();
              
              // Convert AI recommendations to our format
              aiRecommendations = aiData.analytics?.recommendations?.map((rec: string, index: number) => ({
                id: `ai-rec-${index}`,
                type: 'GENERAL' as const,
                priority: 'HIGH' as const,
                title: 'AI-Powered Insight',
                description: rec,
                impact: 'HIGH' as const,
                category: 'ai_enhancement',
                actionData: null,
              })) || [];
            }
          }
        } catch (aiError) {
          console.log('AI recommendations unavailable, using local recommendations only');
        }
        
        // Combine local and AI recommendations
        const combinedRecommendations = [...aiRecommendations, ...localRecommendations];
        setRecommendations(combinedRecommendations);
        
        // Set featured recommendation (prioritize AI recommendations)
        if (combinedRecommendations.length > 0) {
          setFeaturedRecommendation(combinedRecommendations[0]);
        } else {
          setFeaturedRecommendation(null);
        }
      } catch (error) {
        console.error("Failed to get workflow recommendations:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Apply a recommendation to the workflow
    const applyRecommendation = (recommendation: WorkflowRecommendation) => {
      try {
        const nodes = getNodes();
        const edges = getEdges();
        
        if (recommendation.type === 'ADD_NODE' && recommendation.actionData) {
          const { nodeType, nodeName, nodeIcon, nodeDescription, nodePosition, properties } = recommendation.actionData;
          
          if (!nodeType || !nodeName) return;
          
          // Generate a unique ID for the new node
          const newNodeId = `${nodeType.replace('Node', '')}-${Date.now()}`;
          
          // Create the new node
          const newNode: Node = {
            id: newNodeId,
            type: nodeType,
            position: nodePosition || { x: 250, y: 250 },
            data: {
              label: nodeName,
              description: nodeDescription || '',
              icon: nodeIcon || '',
              properties: properties || {}
            }
          };
          
          // Add the node to the workflow
          addNodes(newNode);
        }
        
        else if (recommendation.type === 'ADD_CONNECTION' && recommendation.actionData) {
          const { sourceNodeId, targetNodeId } = recommendation.actionData;
          
          if (!sourceNodeId || !targetNodeId) return;
          
          // Create the new edge
          const newEdge: Edge = {
            id: `e-${sourceNodeId}-${targetNodeId}`,
            source: sourceNodeId,
            target: targetNodeId
          };
          
          // Add the edge to the workflow
          addEdges(newEdge);
        }
        
        else if (recommendation.type === 'MODIFY_NODE' && recommendation.actionData) {
          const { nodeType, properties } = recommendation.actionData;
          
          if (!nodeType || !properties) return;
          
          // Find a matching node to modify
          const nodeToModify = nodes.find(node => node.type === nodeType);
          
          if (nodeToModify) {
            // Update the node with new properties
            const updatedNodes = nodes.map(node => {
              if (node.id === nodeToModify.id) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    properties: {
                      ...node.data.properties,
                      ...properties
                    }
                  }
                };
              }
              return node;
            });
            
            setNodes(updatedNodes);
          }
        }
        
        // Refresh recommendations after applying one
        refreshRecommendations();
        
      } catch (error) {
        console.error("Failed to apply recommendation:", error);
      }
    };
    
    // Apply a template to the workflow
    const applyTemplate = async () => {
      try {
        setIsLoading(true);
        
        // Get template based on selected goal
        const template = await suggestWorkflowTemplate(selectedGoal, {
          industry: selectedIndustry === "any" ? undefined : selectedIndustry
        });
        
        // Replace current workflow with template
        setNodes(template.nodes);
        setEdges(template.edges);
        
        // Update recommendations
        refreshRecommendations();
      } catch (error) {
        console.error("Failed to apply template:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col">
          <SheetHeader className="p-6 pb-2">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Workflow Assistant
            </SheetTitle>
            <SheetDescription>
              Get intelligent recommendations to improve your workflow
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex items-center gap-3 px-6 mb-2">
            <div className="flex-1">
              <label htmlFor="goal-select" className="text-xs font-medium mb-1 block">
                Workflow Goal
              </label>
              <Select value={selectedGoal} onValueChange={(value: WorkflowGoal) => setSelectedGoal(value)}>
                <SelectTrigger id="goal-select" className="w-full">
                  <SelectValue placeholder="Select a goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General Automation</SelectItem>
                  <SelectItem value="LEAD_NURTURING">Lead Nurturing</SelectItem>
                  <SelectItem value="ONBOARDING">User Onboarding</SelectItem>
                  <SelectItem value="ABANDONED_CART_RECOVERY">Abandoned Cart Recovery</SelectItem>
                  <SelectItem value="CUSTOMER_RETENTION">Customer Retention</SelectItem>
                  <SelectItem value="EVENT_REGISTRATION">Event Registration</SelectItem>
                  <SelectItem value="RE_ENGAGEMENT">Re-engagement Campaign</SelectItem>
                  <SelectItem value="FEEDBACK_COLLECTION">Feedback Collection</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label htmlFor="industry-select" className="text-xs font-medium mb-1 block">
                Industry (Optional)
              </label>
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger id="industry-select" className="w-full">
                  <SelectValue placeholder="Select an industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Industry</SelectItem>
                  <SelectItem value="retail">Retail / E-commerce</SelectItem>
                  <SelectItem value="saas">SaaS / Software</SelectItem>
                  <SelectItem value="finance">Finance / Banking</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="travel">Travel / Hospitality</SelectItem>
                  <SelectItem value="realestate">Real Estate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="px-6">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full flex items-center gap-2 mb-4"
              onClick={refreshRecommendations}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh Recommendations
            </Button>
          </div>
          
          {featuredRecommendation && (
            <div className="px-6 mb-4">
              <Card className="p-4 border-primary/20 bg-primary/5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{featuredRecommendation.title}</div>
                      <ImpactBadge impact={featuredRecommendation.impact} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {featuredRecommendation.description}
                    </p>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        onClick={() => applyRecommendation(featuredRecommendation)}
                        className="w-full"
                      >
                        Apply This Recommendation
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
          
          <div className="px-6 pb-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">
                All Recommendations ({recommendations.length})
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-1 text-xs"
                onClick={applyTemplate}
                title="This will replace your current workflow with an AI-suggested template optimized for your selected goal and industry."
              >
                <Wand2 className="h-3.5 w-3.5" />
                Apply Template
                <InfoIcon className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pb-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No recommendations available for your current workflow.</p>
                <p className="text-sm mt-2">Try selecting a different goal or industry.</p>
              </div>
            ) : (
              <Accordion type="multiple" className="px-6">
                {recommendations.map((recommendation) => (
                  <AccordionItem 
                    key={recommendation.id} 
                    value={recommendation.id}
                    className="py-2 border-b border-border/50"
                  >
                    <AccordionTrigger className="flex items-start hover:no-underline py-2 pr-1">
                      <div className="flex items-start gap-3 text-left">
                        <div className={`mt-0.5 p-1.5 rounded-full 
                          ${recommendation.type === 'ADD_NODE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                            recommendation.type === 'MODIFY_NODE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                            recommendation.type === 'ADD_CONNECTION' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                            'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`
                        }>
                          {recommendation.type === 'ADD_NODE' ? <PlusCircle className="h-4 w-4" /> : 
                           recommendation.type === 'MODIFY_NODE' ? <RefreshCw className="h-4 w-4" /> : 
                           recommendation.type === 'ADD_CONNECTION' ? <ArrowRight className="h-4 w-4" /> : 
                           <Lightbulb className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{recommendation.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {recommendation.description}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-3">
                      <p className="text-sm mb-3">{recommendation.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <ImpactBadge impact={recommendation.impact} />
                          {recommendation.confidence >= 0.9 && (
                            <Badge variant="outline" className="flex items-center gap-1 text-xs border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400">
                              <ShieldCheck className="h-3 w-3" />
                              High Confidence
                            </Badge>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => applyRecommendation(recommendation)}
                          className="gap-1"
                        >
                          <Wand2 className="h-3.5 w-3.5" />
                          Apply
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  } catch (error) {
    // Provide a fallback UI for Docker environments where imports might fail
    console.error("Error rendering WorkflowAssistantPanel:", error);
    
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col">
          <SheetHeader className="p-6">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Workflow Assistant
            </SheetTitle>
            <SheetDescription>
              Unable to load workflow assistant in this environment. 
              This feature may not be available in Docker containers.
            </SheetDescription>
          </SheetHeader>
          <div className="p-6">
            <p className="text-sm text-muted-foreground">
              The AI Workflow Assistant requires additional dependencies that may not be available in your current environment.
              Please try accessing this feature from the main application.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }
} 