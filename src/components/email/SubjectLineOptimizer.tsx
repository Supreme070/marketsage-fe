"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Sparkles, Plus, X, Check, BarChart2, RefreshCw, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SubjectLineOptimizerProps {
  campaignId: string;
  campaignName: string;
  initialSubject: string;
  onSubjectSelected?: (subject: string) => void;
}

interface SubjectLineAnalysis {
  predictedOpenRate: number;
  length: {
    characters: number;
    words: number;
    score: number;
  };
  personalityScore: number;
  urgencyScore: number;
  curiosityScore: number;
  emotionScore: number;
  improvements: string[];
}

export default function SubjectLineOptimizer({
  campaignId,
  campaignName,
  initialSubject,
  onSubjectSelected
}: SubjectLineOptimizerProps) {
  const [currentSubject, setCurrentSubject] = useState<string>(initialSubject);
  const [variants, setVariants] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<SubjectLineAnalysis | null>(null);
  
  // Load existing test data if available
  useEffect(() => {
    fetchExistingTest();
  }, [campaignId]);
  
  const fetchExistingTest = async () => {
    try {
      const response = await fetch(`/api/ai-features/subject-line-test?campaignId=${campaignId}`);
      
      if (!response.ok) {
        return; // No test exists yet
      }
      
      const tests = await response.json();
      
      // If there are tests, use the most recent one
      if (tests.length > 0) {
        const latestTest = tests[0];
        setVariants(latestTest.variants.slice(1)); // First one is original subject
      }
    } catch (error) {
      console.error("Error fetching subject line test:", error);
    }
  };
  
  const analyzeSubjectLine = async (subject: string) => {
    setIsAnalyzing(true);
    
    try {
      const response = await fetch("/api/ai-features/content-intelligence/subject-line", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to analyze subject line");
      }
      
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error("Error analyzing subject line:", error);
      toast.error("Failed to analyze subject line");
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const generateVariants = async () => {
    setIsGenerating(true);
    
    try {
      // Generate 3 alternative subject line variants
      const suggestions = await generateSubjectVariants(currentSubject);
      
      // Add the variants
      setVariants(suggestions);
      
      // Create a subject line test in the backend
      await createSubjectLineTest(suggestions);
      
      toast.success("Generated subject line variants");
    } catch (error) {
      console.error("Error generating variants:", error);
      toast.error("Failed to generate subject line variants");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const createSubjectLineTest = async (variants: string[]) => {
    try {
      const response = await fetch("/api/ai-features/subject-line-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId,
          originalSubject: currentSubject,
          variants
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create subject line test");
      }
    } catch (error) {
      console.error("Error creating subject line test:", error);
      // Don't show toast here, as we already show one for variant generation
    }
  };
  
  // Generate subject line variants (simplified for demo)
  const generateSubjectVariants = async (subject: string): Promise<string[]> => {
    // Note: In a production app, this would call a real AI service
    // For this demo, we'll use pre-defined patterns to generate variants
    
    // Simulate API call with a delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const words = subject.split(/\s+/);
    
    // Variant 1: Add urgency
    const urgencyWords = ["Limited Time:", "Act Fast:", "Today Only:", "Ending Soon:"];
    const urgencyVariant = `${urgencyWords[Math.floor(Math.random() * urgencyWords.length)]} ${subject}`;
    
    // Variant 2: Add personalization
    const personalizationVariant = `[firstName], ${subject}`;
    
    // Variant 3: Add curiosity
    const curiosityPhrases = [
      "The Secret to",
      "Discover How",
      "You Won't Believe",
      "Here's What Happens When"
    ];
    const randomPhrase = curiosityPhrases[Math.floor(Math.random() * curiosityPhrases.length)];
    
    // Build a curiosity variant
    let curiosityVariant = "";
    if (words.length > 3) {
      // Use first half of original subject with curiosity phrase
      const firstHalf = words.slice(0, Math.ceil(words.length / 2)).join(" ");
      curiosityVariant = `${randomPhrase} ${firstHalf}`;
    } else {
      curiosityVariant = `${randomPhrase} ${subject}`;
    }
    
    return [urgencyVariant, personalizationVariant, curiosityVariant];
  };
  
  const selectSubject = (subject: string) => {
    if (onSubjectSelected) {
      onSubjectSelected(subject);
    }
    
    setCurrentSubject(subject);
    toast.success("Subject line selected");
  };
  
  const addVariant = () => {
    setVariants([...variants, ""]);
  };
  
  const removeVariant = (index: number) => {
    const newVariants = [...variants];
    newVariants.splice(index, 1);
    setVariants(newVariants);
  };
  
  const updateVariant = (index: number, value: string) => {
    const newVariants = [...variants];
    newVariants[index] = value;
    setVariants(newVariants);
  };
  
  // Format a percentage
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subject Line Optimizer</CardTitle>
              <CardDescription>
                Create and test variations to increase open rates
              </CardDescription>
            </div>
            <Sparkles className="h-8 w-8 text-blue-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="current-subject">Current Subject Line</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  id="current-subject"
                  value={currentSubject}
                  onChange={(e) => setCurrentSubject(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => analyzeSubjectLine(currentSubject)}
                  disabled={isAnalyzing || currentSubject.trim().length === 0}
                >
                  {isAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BarChart2 className="h-4 w-4" />}
                  {isAnalyzing ? "Analyzing..." : "Analyze"}
                </Button>
              </div>
            </div>
            
            {analysis && (
              <Card className="bg-gray-50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <BarChart2 className="h-4 w-4 mr-2 text-blue-500" />
                    Subject Line Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Predicted Open Rate</span>
                      <span className="text-sm font-bold">
                        {formatPercent(analysis.predictedOpenRate)}
                      </span>
                    </div>
                    <Progress value={analysis.predictedOpenRate * 100} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Length</div>
                      <div>
                        {analysis.length.characters} chars, {analysis.length.words} words
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Personalization</div>
                      <div className="flex">
                        <Progress value={analysis.personalityScore * 100} className="h-2 w-20 mt-2 mr-2" />
                        {formatPercent(analysis.personalityScore)}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Urgency</div>
                      <div className="flex">
                        <Progress value={analysis.urgencyScore * 100} className="h-2 w-20 mt-2 mr-2" />
                        {formatPercent(analysis.urgencyScore)}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Curiosity</div>
                      <div className="flex">
                        <Progress value={analysis.curiosityScore * 100} className="h-2 w-20 mt-2 mr-2" />
                        {formatPercent(analysis.curiosityScore)}
                      </div>
                    </div>
                  </div>
                  
                  {analysis.improvements.length > 0 && (
                    <div>
                      <div className="font-medium text-sm mb-1">Suggested Improvements</div>
                      <ul className="text-xs space-y-1">
                        {analysis.improvements.map((improvement, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-amber-500 mr-1">•</span>
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <Label>Alternative Variations</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateVariants}
                  disabled={isGenerating || currentSubject.trim().length === 0}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Variations
                    </>
                  )}
                </Button>
              </div>
              
              <div className="space-y-3">
                {variants.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm border rounded-md">
                    No variants created yet. Click "Generate Variations" to create some alternatives.
                  </div>
                ) : (
                  variants.map((variant, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={variant}
                        onChange={(e) => updateVariant(index, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVariant(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => selectSubject(variant)}
                      >
                        <Star className="h-4 w-4 text-amber-400" />
                      </Button>
                    </div>
                  ))
                )}
                
                {variants.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={addVariant}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Variant
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 border-t px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-primary">Pro Tip:</span> Adding personalization and urgency can increase open rates by up to 30%.
            </div>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => selectSubject(currentSubject)}
            >
              <Check className="h-4 w-4 mr-2" />
              Use Current Subject
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 