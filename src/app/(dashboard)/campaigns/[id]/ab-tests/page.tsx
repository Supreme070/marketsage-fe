"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Play,
  Pause,
  BarChart3,
  Settings,
  Target,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  Copy,
  MoreHorizontal,
  Brain,
  Zap,
  Activity,
  Award,
  Percent,
  Calendar,
  Filter,
  Search,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useUnifiedCampaigns, ABTestStatus, WinnerCriteria, VariantType } from "@/lib/api/hooks/useUnifiedCampaigns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ABTest {
  id: string;
  name: string;
  description?: string;
  status: ABTestStatus;
  testType: string;
  winnerMetric: string;
  winnerThreshold: number;
  distributionPercent: number;
  winnerVariantId?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  variants: ABTestVariant[];
  results?: ABTestResult[];
}

interface ABTestVariant {
  id: string;
  name: string;
  description?: string;
  variantType: VariantType;
  content: string;
  trafficPercent: number;
  isControl: boolean;
  weight?: number;
  createdAt: string;
}

interface ABTestResult {
  id: string;
  variantId: string;
  metric: string;
  value: number;
  sampleSize: number;
  confidence: number;
  createdAt: string;
}

export default function CampaignABTestsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  
  const { getABTests, createABTest, updateABTest, deleteABTest, startABTest, pauseABTest, completeABTest } = useUnifiedCampaigns();
  
  const [abTests, setABTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTest, setEditingTest] = useState<ABTest | null>(null);

  // Create AB Test Form State
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    winnerCriteria: WinnerCriteria.OPEN_RATE,
    confidenceLevel: 95,
    testElements: ["subject", "content"],
    distributionPercent: 50,
  });

  // Variants State
  const [variants, setVariants] = useState([
    { name: "Control", content: "", trafficPercent: 50, isControl: true },
    { name: "Variant A", content: "", trafficPercent: 50, isControl: false },
  ]);

  useEffect(() => {
    fetchABTests();
  }, [campaignId]);

  const fetchABTests = async () => {
    try {
      setLoading(true);
      const tests = await getABTests(campaignId);
      setABTests(tests);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch A/B tests');
      console.error('Failed to fetch A/B tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateABTest = async () => {
    try {
      const testData = {
        name: createForm.name,
        description: createForm.description,
        winnerCriteria: createForm.winnerCriteria,
        confidenceLevel: createForm.confidenceLevel,
        testElements: createForm.testElements,
        distributionPercent: createForm.distributionPercent,
        variants: variants.map(v => ({
          name: v.name,
          content: v.content,
          trafficPercent: v.trafficPercent,
          isControl: v.isControl,
          variantType: VariantType.CONTENT,
        })),
      };

      await createABTest(campaignId, testData);
      toast({
        title: "A/B Test Created",
        description: "Your A/B test has been created successfully.",
      });
      setShowCreateDialog(false);
      resetForm();
      fetchABTests();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create A/B test",
        variant: "destructive",
      });
    }
  };

  const handleStartTest = async (testId: string) => {
    try {
      await startABTest(testId);
      toast({
        title: "A/B Test Started",
        description: "Your A/B test is now running.",
      });
      fetchABTests();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to start A/B test",
        variant: "destructive",
      });
    }
  };

  const handlePauseTest = async (testId: string) => {
    try {
      await pauseABTest(testId);
      toast({
        title: "A/B Test Paused",
        description: "Your A/B test has been paused.",
      });
      fetchABTests();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to pause A/B test",
        variant: "destructive",
      });
    }
  };

  const handleCompleteTest = async (testId: string) => {
    try {
      await completeABTest(testId);
      toast({
        title: "A/B Test Completed",
        description: "Your A/B test has been completed.",
      });
      fetchABTests();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to complete A/B test",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setCreateForm({
      name: "",
      description: "",
      winnerCriteria: WinnerCriteria.OPEN_RATE,
      confidenceLevel: 95,
      testElements: ["subject", "content"],
      distributionPercent: 50,
    });
    setVariants([
      { name: "Control", content: "", trafficPercent: 50, isControl: true },
      { name: "Variant A", content: "", trafficPercent: 50, isControl: false },
    ]);
  };

  const addVariant = () => {
    setVariants([...variants, {
      name: `Variant ${String.fromCharCode(65 + variants.length - 1)}`,
      content: "",
      trafficPercent: 0,
      isControl: false,
    }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 2) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const updateVariantTraffic = (index: number, trafficPercent: number) => {
    const newVariants = [...variants];
    newVariants[index].trafficPercent = trafficPercent;
    setVariants(newVariants);
  };

  const getStatusBadge = (status: ABTestStatus) => {
    switch (status) {
      case ABTestStatus.DRAFT:
        return <Badge variant="outline">Draft</Badge>;
      case ABTestStatus.RUNNING:
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Running</Badge>;
      case ABTestStatus.PAUSED:
        return <Badge variant="secondary"><Pause className="mr-1 h-3 w-3" />Paused</Badge>;
      case ABTestStatus.COMPLETED:
        return <Badge variant="default" className="bg-gray-500 hover:bg-gray-600">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getWinnerCriteriaLabel = (criteria: WinnerCriteria) => {
    switch (criteria) {
      case WinnerCriteria.OPEN_RATE:
        return "Open Rate";
      case WinnerCriteria.CLICK_RATE:
        return "Click Rate";
      case WinnerCriteria.CONVERSION_RATE:
        return "Conversion Rate";
      case WinnerCriteria.REVENUE:
        return "Revenue";
      default:
        return criteria;
    }
  };

  const filteredTests = abTests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         test.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || test.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalTrafficPercent = variants.reduce((sum, variant) => sum + variant.trafficPercent, 0);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">A/B Tests</h2>
          <p className="text-muted-foreground">
            Test different versions of your campaigns to optimize performance
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create A/B Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create A/B Test</DialogTitle>
              <DialogDescription>
                Set up an A/B test to compare different versions of your campaign
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Test Name</Label>
                  <Input
                    id="name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g., Subject Line Test"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Describe what you're testing..."
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              {/* Test Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Test Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="winnerCriteria">Winner Criteria</Label>
                    <Select
                      value={createForm.winnerCriteria}
                      onValueChange={(value) => setCreateForm({ ...createForm, winnerCriteria: value as WinnerCriteria })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={WinnerCriteria.OPEN_RATE}>Open Rate</SelectItem>
                        <SelectItem value={WinnerCriteria.CLICK_RATE}>Click Rate</SelectItem>
                        <SelectItem value={WinnerCriteria.CONVERSION_RATE}>Conversion Rate</SelectItem>
                        <SelectItem value={WinnerCriteria.REVENUE}>Revenue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="confidenceLevel">Confidence Level (%)</Label>
                    <Input
                      id="confidenceLevel"
                      type="number"
                      min="80"
                      max="99"
                      value={createForm.confidenceLevel}
                      onChange={(e) => setCreateForm({ ...createForm, confidenceLevel: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="distributionPercent">Traffic Distribution (%)</Label>
                  <Input
                    id="distributionPercent"
                    type="number"
                    min="10"
                    max="100"
                    value={createForm.distributionPercent}
                    onChange={(e) => setCreateForm({ ...createForm, distributionPercent: parseInt(e.target.value) })}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Percentage of your audience to include in this test
                  </p>
                </div>
              </div>

              <Separator />

              {/* Variants */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Test Variants</h3>
                  <Button variant="outline" size="sm" onClick={addVariant}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Variant
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {variants.map((variant, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            {variant.name}
                            {variant.isControl && (
                              <Badge variant="secondary" className="ml-2">Control</Badge>
                            )}
                          </CardTitle>
                          {variants.length > 2 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeVariant(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor={`variant-name-${index}`}>Variant Name</Label>
                          <Input
                            id={`variant-name-${index}`}
                            value={variant.name}
                            onChange={(e) => {
                              const newVariants = [...variants];
                              newVariants[index].name = e.target.value;
                              setVariants(newVariants);
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`variant-content-${index}`}>Content</Label>
                          <Textarea
                            id={`variant-content-${index}`}
                            value={variant.content}
                            onChange={(e) => {
                              const newVariants = [...variants];
                              newVariants[index].content = e.target.value;
                              setVariants(newVariants);
                            }}
                            placeholder="Enter the content for this variant..."
                            rows={4}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`variant-traffic-${index}`}>Traffic %</Label>
                            <Input
                              id={`variant-traffic-${index}`}
                              type="number"
                              min="0"
                              max="100"
                              value={variant.trafficPercent}
                              onChange={(e) => updateVariantTraffic(index, parseInt(e.target.value))}
                            />
                          </div>
                          <div className="flex items-center space-x-2 pt-6">
                            <Switch
                              id={`variant-control-${index}`}
                              checked={variant.isControl}
                              onCheckedChange={(checked) => {
                                const newVariants = [...variants];
                                newVariants[index].isControl = checked;
                                // Ensure only one control variant
                                if (checked) {
                                  newVariants.forEach((v, i) => {
                                    if (i !== index) v.isControl = false;
                                  });
                                }
                                setVariants(newVariants);
                              }}
                            />
                            <Label htmlFor={`variant-control-${index}`}>Control Variant</Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {totalTrafficPercent !== 100 && (
                  <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                    <AlertCircle className="inline mr-2 h-4 w-4" />
                    Traffic distribution must equal 100% (currently {totalTrafficPercent}%)
                  </div>
                )}
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateABTest}
                  disabled={!createForm.name || totalTrafficPercent !== 100}
                >
                  Create A/B Test
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{abTests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All A/B tests
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Running Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {abTests.filter(t => t.status === ABTestStatus.RUNNING).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {abTests.filter(t => t.status === ABTestStatus.COMPLETED).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Finished tests
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {abTests.filter(t => t.status === ABTestStatus.COMPLETED && t.winnerVariantId).length > 0 
                ? `${Math.round((abTests.filter(t => t.status === ABTestStatus.COMPLETED && t.winnerVariantId).length / Math.max(abTests.filter(t => t.status === ABTestStatus.COMPLETED).length, 1)) * 100)}%`
                : "0%"
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tests with winners
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search A/B tests..."
              className="pl-8 w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter || ""} onValueChange={(value) => setStatusFilter(value || null)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value={ABTestStatus.DRAFT}>Draft</SelectItem>
              <SelectItem value={ABTestStatus.RUNNING}>Running</SelectItem>
              <SelectItem value={ABTestStatus.PAUSED}>Paused</SelectItem>
              <SelectItem value={ABTestStatus.COMPLETED}>Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* A/B Tests Table */}
      <Card>
        <CardHeader>
          <CardTitle>A/B Tests</CardTitle>
          <CardDescription>
            Manage and monitor your campaign A/B tests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Winner Criteria</TableHead>
                  <TableHead>Variants</TableHead>
                  <TableHead>Traffic</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                        Loading A/B tests...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-destructive">
                      Error: {error}
                    </TableCell>
                  </TableRow>
                ) : filteredTests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No A/B tests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{test.name}</span>
                          {test.description && (
                            <span className="text-xs text-muted-foreground">{test.description}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(test.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Target className="mr-2 h-4 w-4 text-muted-foreground" />
                          {getWinnerCriteriaLabel(test.winnerCriteria as WinnerCriteria)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                          {test.variants.length} variants
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Percent className="mr-2 h-4 w-4 text-muted-foreground" />
                          {test.distributionPercent}%
                        </div>
                      </TableCell>
                      <TableCell>
                        {test.status === ABTestStatus.RUNNING ? (
                          <div className="flex items-center">
                            <Activity className="mr-2 h-4 w-4 text-green-500" />
                            <span className="text-sm">Running</span>
                          </div>
                        ) : test.status === ABTestStatus.COMPLETED ? (
                          <div className="flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                            <span className="text-sm">Completed</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Not started</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BarChart3 className="mr-2 h-4 w-4" /> View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {test.status === ABTestStatus.DRAFT && (
                              <DropdownMenuItem onClick={() => handleStartTest(test.id)}>
                                <Play className="mr-2 h-4 w-4" /> Start Test
                              </DropdownMenuItem>
                            )}
                            {test.status === ABTestStatus.RUNNING && (
                              <>
                                <DropdownMenuItem onClick={() => handlePauseTest(test.id)}>
                                  <Pause className="mr-2 h-4 w-4" /> Pause Test
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCompleteTest(test.id)}>
                                  <CheckCircle className="mr-2 h-4 w-4" /> Complete Test
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
