"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  AlertTriangle, 
  RefreshCw, 
  UserMinus, 
  BarChart, 
  Calendar, 
  ArrowUpRight, 
  Search 
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Placeholder mock data for churn predictions
const mockChurnPredictions = [
  {
    contactId: "c1",
    contactName: "John Smith",
    email: "john@example.com",
    score: 0.82,
    riskLevel: "HIGH",
    topFactors: [
      "No activity in 45 days",
      "Low email open rate (5.2%)"
    ],
    nextActionDate: "2023-08-15"
  },
  {
    contactId: "c2",
    contactName: "Jane Doe",
    email: "jane@example.com",
    score: 0.91,
    riskLevel: "VERY_HIGH",
    topFactors: [
      "No activity in 63 days",
      "Low email open rate (2.1%)",
      "Low click engagement (0.5%)"
    ],
    nextActionDate: "2023-08-10"
  },
  {
    contactId: "c3",
    contactName: "Michael Johnson",
    email: "michael@example.com",
    score: 0.45,
    riskLevel: "MEDIUM",
    topFactors: [
      "Declining engagement pattern"
    ],
    nextActionDate: "2023-08-20"
  },
  {
    contactId: "c4",
    contactName: "Sarah Williams",
    email: "sarah@example.com",
    score: 0.22,
    riskLevel: "LOW",
    topFactors: [
      "Regular engagement",
      "High open rates"
    ],
    nextActionDate: null
  },
  {
    contactId: "c5",
    contactName: "Robert Brown",
    email: "robert@example.com",
    score: 0.78,
    riskLevel: "HIGH",
    topFactors: [
      "Decreasing click rates",
      "Reduced activity"
    ],
    nextActionDate: "2023-08-16"
  }
];

export default function ChurnPredictionDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState(mockChurnPredictions);
  const router = useRouter();
  
  // Handle schedule re-engagement campaign
  const handleScheduleReengagement = () => {
    router.push("/workflows/new-workflow?template=advanced-re-engagement");
  };
  
  // Filter predictions based on search and risk level
  const filteredPredictions = predictions.filter(prediction => {
    // Check search term
    const searchMatch = 
      prediction.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prediction.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check risk level filter
    const riskMatch = 
      riskFilter === "all" || 
      prediction.riskLevel.toLowerCase() === riskFilter.toLowerCase();
    
    return searchMatch && riskMatch;
  });
  
  // Calculate stats
  const totalContacts = predictions.length;
  const highRiskCount = predictions.filter(p => 
    p.riskLevel === "HIGH" || p.riskLevel === "VERY_HIGH"
  ).length;
  const highRiskPercentage = Math.round((highRiskCount / totalContacts) * 100);
  
  // Handle prediction request for a specific contact
  const handlePredictContact = async () => {
    setIsLoading(true);
    
    try {
      // Normally would call API here
      // const response = await fetch("/api/predictive-analytics", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     contactId: "c6",
      //     predictionType: "CHURN"
      //   })
      // });
      // const data = await response.json();
      
      // Mock response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock new prediction
      const newPrediction = {
        contactId: "c6",
        contactName: "Emily Johnson",
        email: "emily@example.com",
        score: 0.34,
        riskLevel: "MEDIUM",
        topFactors: [
          "Moderate engagement pattern",
          "Average open rate (15.2%)"
        ],
        nextActionDate: "2023-08-25"
      };
      
      setPredictions([newPrediction, ...predictions]);
      toast.success("Churn prediction generated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate churn prediction");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get color for risk level
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "LOW": return "bg-green-500";
      case "MEDIUM": return "bg-yellow-500";
      case "HIGH": return "bg-orange-500";
      case "VERY_HIGH": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };
  
  const getProgressColor = (score: number) => {
    if (score < 0.3) return "bg-green-500";
    if (score < 0.5) return "bg-yellow-500";
    if (score < 0.7) return "bg-orange-500";
    return "bg-red-500";
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Risk Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold">{highRiskCount}</div>
              <div className="text-sm text-muted-foreground">
                {highRiskPercentage}% of all contacts
              </div>
            </div>
            <div className="mt-4">
              <Progress value={highRiskPercentage} className="h-2 bg-gray-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-xs">
              <div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-green-500 mr-1"></div>
                  <span>Low</span>
                </div>
                <div className="font-medium mt-1">
                  {predictions.filter(p => p.riskLevel === "LOW").length} contacts
                </div>
              </div>
              <div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-yellow-500 mr-1"></div>
                  <span>Medium</span>
                </div>
                <div className="font-medium mt-1">
                  {predictions.filter(p => p.riskLevel === "MEDIUM").length} contacts
                </div>
              </div>
              <div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-orange-500 mr-1"></div>
                  <span>High</span>
                </div>
                <div className="font-medium mt-1">
                  {predictions.filter(p => p.riskLevel === "HIGH").length} contacts
                </div>
              </div>
              <div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-red-500 mr-1"></div>
                  <span>Very High</span>
                </div>
                <div className="font-medium mt-1">
                  {predictions.filter(p => p.riskLevel === "VERY_HIGH").length} contacts
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button className="w-full" onClick={handlePredictContact} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <BarChart className="mr-2 h-4 w-4" />
                    Generate New Prediction
                  </>
                )}
              </Button>
              
              <Button className="w-full" variant="outline" onClick={handleScheduleReengagement}>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Re-engagement Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Churn Risk Analysis</CardTitle>
          <CardDescription>
            View and manage contacts at risk of churning based on their engagement patterns
          </CardDescription>
          
          <div className="flex items-center justify-between mt-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <Label htmlFor="risk-filter" className="sr-only">
                Filter by risk
              </Label>
              <Select
                value={riskFilter}
                onValueChange={setRiskFilter}
              >
                <SelectTrigger id="risk-filter" className="w-[160px]">
                  <SelectValue placeholder="Filter by risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All risk levels</SelectItem>
                  <SelectItem value="low">Low risk</SelectItem>
                  <SelectItem value="medium">Medium risk</SelectItem>
                  <SelectItem value="high">High risk</SelectItem>
                  <SelectItem value="very_high">Very high risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPredictions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <UserMinus className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No matching contacts found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Churn Score</TableHead>
                  <TableHead>Top Factors</TableHead>
                  <TableHead>Next Action</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPredictions.map((prediction) => (
                  <TableRow key={prediction.contactId}>
                    <TableCell>
                      <div className="font-medium">{prediction.contactName}</div>
                      <div className="text-sm text-muted-foreground">{prediction.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${getRiskColor(prediction.riskLevel)}`}></div>
                        <span>
                          {prediction.riskLevel === "VERY_HIGH"
                            ? "Very High"
                            : prediction.riskLevel.charAt(0) + prediction.riskLevel.slice(1).toLowerCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-full">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">{(prediction.score * 100).toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={prediction.score * 100} 
                          className={`h-2 ${getProgressColor(prediction.score)}`} 
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <ul className="text-sm list-disc pl-4">
                        {prediction.topFactors.map((factor, index) => (
                          <li key={index}>{factor}</li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell>
                      {prediction.nextActionDate ? (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>{prediction.nextActionDate}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No action needed</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader className="pb-3">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            <CardTitle className="text-sm font-medium text-amber-800">Re-engagement Tips</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>• Send personalized re-engagement emails to high-risk contacts</li>
            <li>• Offer special promotions or incentives to restart engagement</li>
            <li>• Consider a brief survey to understand disengagement reasons</li>
            <li>• Create a targeted win-back campaign for very high risk segments</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 