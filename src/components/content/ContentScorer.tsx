"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, RefreshCw, BarChart2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ContentScorerProps {
  initialContent?: string;
  onContentImproved?: (content: string) => void;
}

interface ContentScore {
  overallScore: number;
  readabilityScore: number;
  engagementScore: number;
  conversionScore: number;
  sentimentScore: number;
  improvements: string[];
  strengths: string[];
}

interface ContentRecommendation {
  type: string;
  originalContent: string;
  suggestedContent: string;
  reason: string;
  impactScore: number;
}

export default function ContentScorer({
  initialContent = "",
  onContentImproved
}: ContentScorerProps) {
  const [content, setContent] = useState<string>(initialContent);
  const [contentType, setContentType] = useState<string>("EMAIL_BODY");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState<boolean>(false);
  const [score, setScore] = useState<ContentScore | null>(null);
  const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);
  const [activeTab, setActiveTab] = useState<"score" | "recommendations">("score");
  
  const analyzeContent = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content to analyze");
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      const response = await fetch("/api/ai-features/content-intelligence/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          contentType
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to analyze content");
      }
      
      const data = await response.json();
      setScore(data);
    } catch (error) {
      console.error("Error analyzing content:", error);
      toast.error("Failed to analyze content");
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const generateRecommendations = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content to improve");
      return;
    }
    
    setIsGeneratingRecommendations(true);
    
    try {
      const response = await fetch("/api/ai-features/content-intelligence/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          contentType
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate recommendations");
      }
      
      const data = await response.json();
      setRecommendations(data);
      setActiveTab("recommendations");
    } catch (error) {
      console.error("Error generating recommendations:", error);
      toast.error("Failed to generate recommendations");
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };
  
  const applyRecommendation = (recommendation: ContentRecommendation) => {
    setContent(recommendation.suggestedContent);
    
    if (onContentImproved) {
      onContentImproved(recommendation.suggestedContent);
    }
    
    toast.success("Applied recommendation to content");
    
    // Re-analyze the content with the recommendation applied
    analyzeContent();
  };
  
  // Get a color for a score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };
  
  // Get a background color for score progress
  const getScoreBackground = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Content Effectiveness Scorer</CardTitle>
              <CardDescription>
                Analyze and improve your content for better engagement
              </CardDescription>
            </div>
            <BarChart2 className="h-8 w-8 text-blue-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 sm:col-span-2">
                <Label htmlFor="content-type">Content Type</Label>
                <Select 
                  value={contentType} 
                  onValueChange={setContentType}
                >
                  <SelectTrigger id="content-type" className="mt-1">
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL_SUBJECT">Email Subject</SelectItem>
                    <SelectItem value="EMAIL_BODY">Email Body</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    <SelectItem value="PUSH_NOTIFICATION">Push Notification</SelectItem>
                    <SelectItem value="LANDING_PAGE">Landing Page</SelectItem>
                    <SelectItem value="SOCIAL_POST">Social Post</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-3 sm:col-span-1 flex items-end">
                <div className="flex space-x-2 w-full">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={analyzeContent}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <BarChart2 className="h-4 w-4 mr-2" />
                        Analyze
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="default" 
                    className="flex-1"
                    onClick={generateRecommendations}
                    disabled={isGeneratingRecommendations}
                  >
                    {isGeneratingRecommendations ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Improve
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="content" className="mb-1 block">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px]"
                placeholder="Enter your content here to analyze its effectiveness..."
              />
            </div>
            
            {(score || recommendations.length > 0) && (
              <div className="mt-4">
                <div className="flex border-b mb-4">
                  <button
                    className={`px-4 py-2 font-medium text-sm ${activeTab === "score" ? "border-b-2 border-primary" : "text-muted-foreground"}`}
                    onClick={() => setActiveTab("score")}
                  >
                    Content Score
                  </button>
                  <button
                    className={`px-4 py-2 font-medium text-sm ${activeTab === "recommendations" ? "border-b-2 border-primary" : "text-muted-foreground"}`}
                    onClick={() => setActiveTab("recommendations")}
                  >
                    Recommendations
                  </button>
                </div>
                
                {activeTab === "score" && score && (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center">
                      <div className="text-4xl font-bold mb-1">{score.overallScore}</div>
                      <div className="text-sm text-muted-foreground">Overall Content Score</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <Label className="text-sm">Readability</Label>
                          <span className={`text-sm font-medium ${getScoreColor(score.readabilityScore)}`}>
                            {score.readabilityScore}
                          </span>
                        </div>
                        <Progress 
                          value={score.readabilityScore} 
                          className={`h-2 ${getScoreBackground(score.readabilityScore)}`} 
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <Label className="text-sm">Engagement</Label>
                          <span className={`text-sm font-medium ${getScoreColor(score.engagementScore)}`}>
                            {score.engagementScore}
                          </span>
                        </div>
                        <Progress 
                          value={score.engagementScore} 
                          className={`h-2 ${getScoreBackground(score.engagementScore)}`} 
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <Label className="text-sm">Conversion</Label>
                          <span className={`text-sm font-medium ${getScoreColor(score.conversionScore)}`}>
                            {score.conversionScore}
                          </span>
                        </div>
                        <Progress 
                          value={score.conversionScore} 
                          className={`h-2 ${getScoreBackground(score.conversionScore)}`} 
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <Label className="text-sm">Sentiment</Label>
                          <span className={`text-sm font-medium ${getScoreColor(score.sentimentScore)}`}>
                            {score.sentimentScore}
                          </span>
                        </div>
                        <Progress 
                          value={score.sentimentScore} 
                          className={`h-2 ${getScoreBackground(score.sentimentScore)}`} 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {score.improvements.length > 0 && (
                        <Collapsible>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-amber-500">
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              <h4 className="text-sm font-medium">Improvements Needed</h4>
                            </div>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                          <CollapsibleContent>
                            <div className="pl-6 mt-1 space-y-1">
                              {score.improvements.map((improvement, i) => (
                                <div key={i} className="text-sm">• {improvement}</div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                      
                      {score.strengths.length > 0 && (
                        <Collapsible>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-green-500">
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              <h4 className="text-sm font-medium">Content Strengths</h4>
                            </div>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                          <CollapsibleContent>
                            <div className="pl-6 mt-1 space-y-1">
                              {score.strengths.map((strength, i) => (
                                <div key={i} className="text-sm">• {strength}</div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  </div>
                )}
                
                {activeTab === "recommendations" && (
                  <div>
                    {recommendations.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        No recommendations available. Click "Improve" to generate suggestions.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recommendations.map((rec, index) => (
                          <Card key={index} className="overflow-hidden">
                            <CardHeader className="bg-gray-50 py-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
                                  <CardTitle className="text-sm font-medium">{rec.type.replace('_', ' ')} Improvement</CardTitle>
                                </div>
                                <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded text-xs">
                                  <span>Impact:</span>
                                  <span className="font-medium">
                                    {rec.impactScore >= 0.7 ? 'High' : rec.impactScore >= 0.4 ? 'Medium' : 'Low'}
                                  </span>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="py-3">
                              <p className="text-sm mb-3">{rec.reason}</p>
                              
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <div className="flex items-center text-sm text-muted-foreground cursor-pointer">
                                    <ChevronDown className="h-4 w-4 mr-1" />
                                    <span>View suggested change</span>
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                                    <div className="font-medium mb-1">Suggested Content:</div>
                                    <p>{rec.suggestedContent}</p>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                              
                              <div className="mt-3 text-right">
                                <Button 
                                  size="sm"
                                  onClick={() => applyRecommendation(rec)}
                                >
                                  Apply This Suggestion
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 border-t px-6 py-4">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-primary">Pro Tip:</span> Content with a score above 70 typically sees 2-3x higher engagement rates.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 