'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  Star,
  Award,
  Brain,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  Building,
  MapPin,
  Activity,
  Filter,
  Search,
  RefreshCw,
  Settings,
  Plus,
  Edit3,
  Save,
  BarChart3,
  PieChart as PieChartIcon,
  Lightbulb,
  Crown,
  ThumbsUp,
  ThumbsDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  DollarSign,
  User
} from 'lucide-react';

interface LeadScoreCriteria {
  id: string;
  category: 'demographic' | 'behavioral' | 'engagement' | 'firmographic' | 'intent';
  name: string;
  description: string;
  weight: number;
  conditions: {
    field: string;
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in_range';
    value: string | number | string[];
    points: number;
  }[];
  enabled: boolean;
}

interface LeadScore {
  leadId: string;
  leadName: string;
  leadEmail: string;
  company?: string;
  location: string;
  
  // Score Breakdown
  totalScore: number;
  maxPossibleScore: number;
  scorePercentage: number;
  scoreGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  
  // Category Scores
  categoryScores: {
    demographic: number;
    behavioral: number;
    engagement: number;
    firmographic: number;
    intent: number;
  };
  
  // Qualification Status
  qualificationStatus: 'qualified' | 'marketing_qualified' | 'sales_qualified' | 'unqualified';
  qualificationReason: string;
  
  // Predictive Metrics
  conversionProbability: number;
  timeToConversion: number; // days
  estimatedValue: number;
  churnRisk: 'low' | 'medium' | 'high';
  
  // Attribution
  source: string;
  campaign?: string;
  firstTouchDate: string;
  lastActivityDate: string;
  
  // Scoring History
  scoreHistory: {
    date: string;
    score: number;
    change: number;
    reason: string;
  }[];
  
  // AI Insights
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  nextBestActions: string[];
}

interface QualificationRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  conditions: {
    type: 'score_threshold' | 'category_score' | 'field_value' | 'activity_count';
    field: string;
    operator: string;
    value: number | string;
  }[];
  action: 'qualify_marketing' | 'qualify_sales' | 'disqualify' | 'assign_rep' | 'trigger_workflow';
  enabled: boolean;
}

interface LeadScoringDashboardProps {
  className?: string;
}

export default function LeadScoringDashboard({ className }: LeadScoringDashboardProps) {
  const [leads, setLeads] = useState<LeadScore[]>([]);
  const [scoringCriteria, setScoringCriteria] = useState<LeadScoreCriteria[]>([]);
  const [qualificationRules, setQualificationRules] = useState<QualificationRule[]>([]);
  const [selectedLead, setSelectedLead] = useState<LeadScore | null>(null);
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'totalScore' | 'conversionProbability' | 'estimatedValue'>('totalScore');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCriteriaDialog, setShowCriteriaDialog] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<LeadScoreCriteria | null>(null);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  useEffect(() => {
    fetchLeadScoringData();
  }, [filterGrade, filterStatus, sortBy]);

  const fetchLeadScoringData = async () => {
    try {
      setIsLoading(true);
      const [leadsRes, criteriaRes, rulesRes] = await Promise.all([
        fetch(`/api/leadpulse/lead-scoring?grade=${filterGrade}&status=${filterStatus}&sort=${sortBy}&search=${searchQuery}`),
        fetch('/api/leadpulse/scoring-criteria'),
        fetch('/api/leadpulse/qualification-rules')
      ]);

      if (leadsRes.ok && criteriaRes.ok && rulesRes.ok) {
        const leadsData = await leadsRes.json();
        const criteriaData = await criteriaRes.json();
        const rulesData = await rulesRes.json();
        
        setLeads(leadsData.leads);
        setScoringCriteria(criteriaData.criteria);
        setQualificationRules(rulesData.rules);
        
        if (leadsData.leads.length > 0 && !selectedLead) {
          setSelectedLead(leadsData.leads[0]);
        }
      } else {
        // Use mock data for demo
        const mockLeads = generateMockLeads();
        const mockCriteria = generateMockCriteria();
        const mockRules = generateMockRules();
        
        setLeads(mockLeads);
        setScoringCriteria(mockCriteria);
        setQualificationRules(mockRules);
        
        if (mockLeads.length > 0) {
          setSelectedLead(mockLeads[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching lead scoring data:', error);
      const mockLeads = generateMockLeads();
      const mockCriteria = generateMockCriteria();
      const mockRules = generateMockRules();
      
      setLeads(mockLeads);
      setScoringCriteria(mockCriteria);
      setQualificationRules(mockRules);
      
      if (mockLeads.length > 0) {
        setSelectedLead(mockLeads[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockCriteria = (): LeadScoreCriteria[] => {
    return [
      {
        id: 'company_size',
        category: 'firmographic',
        name: 'Company Size',
        description: 'Points based on company employee count',
        weight: 20,
        conditions: [
          { field: 'employees', operator: 'greater_than', value: 1000, points: 20 },
          { field: 'employees', operator: 'in_range', value: [100, 1000], points: 15 },
          { field: 'employees', operator: 'in_range', value: [10, 100], points: 10 },
          { field: 'employees', operator: 'less_than', value: 10, points: 5 }
        ],
        enabled: true
      },
      {
        id: 'job_title',
        category: 'demographic',
        name: 'Job Title',
        description: 'Points based on decision-making authority',
        weight: 15,
        conditions: [
          { field: 'jobTitle', operator: 'contains', value: ['CEO', 'CTO', 'Founder'], points: 15 },
          { field: 'jobTitle', operator: 'contains', value: ['Director', 'VP', 'Head'], points: 12 },
          { field: 'jobTitle', operator: 'contains', value: ['Manager', 'Lead'], points: 8 },
          { field: 'jobTitle', operator: 'contains', value: ['Analyst', 'Coordinator'], points: 5 }
        ],
        enabled: true
      },
      {
        id: 'page_views',
        category: 'behavioral',
        name: 'Page Views',
        description: 'Points based on website engagement',
        weight: 10,
        conditions: [
          { field: 'pageViews', operator: 'greater_than', value: 20, points: 10 },
          { field: 'pageViews', operator: 'in_range', value: [10, 20], points: 7 },
          { field: 'pageViews', operator: 'in_range', value: [5, 10], points: 5 },
          { field: 'pageViews', operator: 'less_than', value: 5, points: 2 }
        ],
        enabled: true
      },
      {
        id: 'email_engagement',
        category: 'engagement',
        name: 'Email Engagement',
        description: 'Points based on email interaction rates',
        weight: 12,
        conditions: [
          { field: 'emailOpenRate', operator: 'greater_than', value: 0.8, points: 12 },
          { field: 'emailOpenRate', operator: 'greater_than', value: 0.5, points: 8 },
          { field: 'emailOpenRate', operator: 'greater_than', value: 0.2, points: 5 },
          { field: 'emailOpenRate', operator: 'less_than', value: 0.2, points: 1 }
        ],
        enabled: true
      },
      {
        id: 'location',
        category: 'demographic',
        name: 'Geographic Location',
        description: 'Points based on target market presence',
        weight: 8,
        conditions: [
          { field: 'country', operator: 'equals', value: 'Nigeria', points: 8 },
          { field: 'country', operator: 'equals', value: 'Kenya', points: 7 },
          { field: 'country', operator: 'equals', value: 'South Africa', points: 6 },
          { field: 'country', operator: 'equals', value: 'Ghana', points: 5 }
        ],
        enabled: true
      },
      {
        id: 'pricing_page_visits',
        category: 'intent',
        name: 'Pricing Page Visits',
        description: 'Strong purchase intent indicator',
        weight: 15,
        conditions: [
          { field: 'pricingPageVisits', operator: 'greater_than', value: 5, points: 15 },
          { field: 'pricingPageVisits', operator: 'greater_than', value: 2, points: 10 },
          { field: 'pricingPageVisits', operator: 'equals', value: 1, points: 7 }
        ],
        enabled: true
      }
    ];
  };

  const generateMockRules = (): QualificationRule[] => {
    return [
      {
        id: 'mql_rule',
        name: 'Marketing Qualified Lead',
        description: 'Basic qualification for marketing nurturing',
        priority: 1,
        conditions: [
          { type: 'score_threshold', field: 'totalScore', operator: 'greater_than', value: 40 },
          { type: 'category_score', field: 'engagement', operator: 'greater_than', value: 5 }
        ],
        action: 'qualify_marketing',
        enabled: true
      },
      {
        id: 'sql_rule',
        name: 'Sales Qualified Lead',
        description: 'High-value leads ready for sales contact',
        priority: 2,
        conditions: [
          { type: 'score_threshold', field: 'totalScore', operator: 'greater_than', value: 70 },
          { type: 'category_score', field: 'intent', operator: 'greater_than', value: 10 },
          { type: 'field_value', field: 'jobTitle', operator: 'contains', value: 'CEO|CTO|Director' }
        ],
        action: 'qualify_sales',
        enabled: true
      },
      {
        id: 'enterprise_rule',
        name: 'Enterprise Lead Assignment',
        description: 'Large company leads assigned to enterprise team',
        priority: 3,
        conditions: [
          { type: 'score_threshold', field: 'totalScore', operator: 'greater_than', value: 60 },
          { type: 'field_value', field: 'employees', operator: 'greater_than', value: 500 }
        ],
        action: 'assign_rep',
        enabled: true
      }
    ];
  };

  const generateMockLeads = (): LeadScore[] => {
    const companies = ['Flutterwave', 'Paystack', 'Interswitch', 'Kuda Bank', 'Carbon', 'PiggyVest', 'Cowrywise', 'Chipper Cash'];
    const locations = ['Lagos, Nigeria', 'Nairobi, Kenya', 'Cape Town, South Africa', 'Accra, Ghana', 'Abuja, Nigeria'];
    const sources = ['Google Organic', 'LinkedIn', 'Twitter', 'Direct', 'Email Campaign', 'Referral'];
    const jobTitles = ['CEO', 'CTO', 'Product Manager', 'Marketing Director', 'Operations Manager', 'VP Engineering'];

    return Array.from({ length: 25 }, (_, i) => {
      const totalScore = Math.floor(Math.random() * 100) + 1;
      const maxScore = 100;
      const scorePercentage = (totalScore / maxScore) * 100;
      
      const getGrade = (percentage: number): 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F' => {
        if (percentage >= 95) return 'A+';
        if (percentage >= 90) return 'A';
        if (percentage >= 85) return 'B+';
        if (percentage >= 80) return 'B';
        if (percentage >= 75) return 'C+';
        if (percentage >= 70) return 'C';
        if (percentage >= 60) return 'D';
        return 'F';
      };

      const getQualificationStatus = (score: number) => {
        if (score >= 70) return 'sales_qualified';
        if (score >= 40) return 'marketing_qualified';
        return 'unqualified';
      };

      const conversionProb = Math.floor(Math.random() * 100);
      const estimatedValue = Math.floor(Math.random() * 50000) + 5000;

      return {
        leadId: `lead_${i}`,
        leadName: `Lead ${i + 1}`,
        leadEmail: `lead${i + 1}@example.com`,
        company: companies[Math.floor(Math.random() * companies.length)],
        location: locations[Math.floor(Math.random() * locations.length)],
        totalScore,
        maxPossibleScore: maxScore,
        scorePercentage,
        scoreGrade: getGrade(scorePercentage),
        categoryScores: {
          demographic: Math.floor(Math.random() * 20),
          behavioral: Math.floor(Math.random() * 15),
          engagement: Math.floor(Math.random() * 12),
          firmographic: Math.floor(Math.random() * 20),
          intent: Math.floor(Math.random() * 15)
        },
        qualificationStatus: getQualificationStatus(totalScore) as any,
        qualificationReason: totalScore >= 70 ? 'High score with strong intent signals' : 
                           totalScore >= 40 ? 'Good engagement, needs nurturing' : 
                           'Below minimum threshold',
        conversionProbability: conversionProb,
        timeToConversion: Math.floor(Math.random() * 30) + 1,
        estimatedValue,
        churnRisk: conversionProb > 70 ? 'low' : conversionProb > 40 ? 'medium' : 'high',
        source: sources[Math.floor(Math.random() * sources.length)],
        campaign: Math.random() > 0.5 ? 'Q1 Growth Campaign' : undefined,
        firstTouchDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastActivityDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        scoreHistory: Array.from({ length: 5 }, (_, j) => ({
          date: new Date(Date.now() - j * 7 * 24 * 60 * 60 * 1000).toISOString(),
          score: totalScore + Math.floor(Math.random() * 20) - 10,
          change: Math.floor(Math.random() * 10) - 5,
          reason: ['Form submission', 'Email click', 'Pricing page visit', 'Demo request', 'Content download'][j % 5]
        })),
        strengths: [
          'High engagement rate',
          'Target company size',
          'Decision maker role',
          'Repeat visitor'
        ].slice(0, Math.floor(Math.random() * 3) + 1),
        weaknesses: [
          'Low email engagement',
          'Limited page views',
          'No pricing page visits',
          'Incomplete profile'
        ].slice(0, Math.floor(Math.random() * 2) + 1),
        recommendations: [
          'Send targeted pricing information',
          'Schedule personalized demo',
          'Share relevant case studies',
          'Connect with sales team'
        ].slice(0, Math.floor(Math.random() * 2) + 1),
        nextBestActions: [
          'Send welcome email sequence',
          'Invite to upcoming webinar',
          'Offer free consultation',
          'Provide product trial'
        ].slice(0, Math.floor(Math.random() * 2) + 1)
      };
    });
  };

  const getGradeColor = (grade: string) => {
    const colors = {
      'A+': 'bg-green-100 text-green-800 border-green-300',
      'A': 'bg-green-100 text-green-800 border-green-300',
      'B+': 'bg-blue-100 text-blue-800 border-blue-300',
      'B': 'bg-blue-100 text-blue-800 border-blue-300',
      'C+': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'C': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'D': 'bg-orange-100 text-orange-800 border-orange-300',
      'F': 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[grade as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getQualificationColor = (status: string) => {
    const colors = {
      sales_qualified: 'bg-green-100 text-green-800',
      marketing_qualified: 'bg-blue-100 text-blue-800',
      qualified: 'bg-yellow-100 text-yellow-800',
      unqualified: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getChurnRiskColor = (risk: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[risk as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  // Filter leads based on search and filters
  const filteredLeads = leads
    .filter(lead => {
      const matchesSearch = !searchQuery || 
        lead.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.leadEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.company?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesGrade = filterGrade === 'all' || lead.scoreGrade === filterGrade;
      const matchesStatus = filterStatus === 'all' || lead.qualificationStatus === filterStatus;
      
      return matchesSearch && matchesGrade && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'conversionProbability':
          return b.conversionProbability - a.conversionProbability;
        case 'estimatedValue':
          return b.estimatedValue - a.estimatedValue;
        case 'totalScore':
        default:
          return b.totalScore - a.totalScore;
      }
    });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 animate-pulse" />
            <span>Loading lead scoring data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const scoreDistribution = leads.reduce((acc, lead) => {
    const grade = lead.scoreGrade;
    acc[grade] = (acc[grade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const scoreDistributionData = Object.entries(scoreDistribution).map(([grade, count]) => ({
    grade,
    count,
    percentage: (count / leads.length) * 100
  }));

  const qualificationDistribution = leads.reduce((acc, lead) => {
    const status = lead.qualificationStatus;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const qualificationData = Object.entries(qualificationDistribution).map(([status, count]) => ({
    status,
    count,
    percentage: (count / leads.length) * 100
  }));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Lead Scoring & Qualification
            </CardTitle>
            <div className="flex items-center gap-2">
              <Dialog open={showCriteriaDialog} onOpenChange={setShowCriteriaDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Scoring
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Scoring Criteria Configuration</DialogTitle>
                    <DialogDescription>
                      Configure the criteria and weights used for lead scoring
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {scoringCriteria.map((criteria) => (
                      <Card key={criteria.id} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{criteria.name}</h4>
                            <p className="text-sm text-gray-600">{criteria.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{criteria.category}</Badge>
                            <Button size="sm" variant="outline">
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Weight: {criteria.weight} points</Label>
                            <div className="w-32">
                              <Slider
                                value={[criteria.weight]}
                                max={25}
                                step={1}
                                className="w-full"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {criteria.conditions.slice(0, 2).map((condition, index) => (
                              <div key={index} className="bg-gray-50 p-2 rounded">
                                <span className="font-medium">{condition.points} pts</span> - {condition.field} {condition.operator} {Array.isArray(condition.value) ? condition.value.join('-') : condition.value}
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCriteriaDialog(false)}>
                      Cancel
                    </Button>
                    <Button>
                      <Save className="w-4 h-4 mr-2" />
                      Save Configuration
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" size="sm" onClick={fetchLeadScoringData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Sales Qualified</p>
                <p className="text-xl font-semibold">{qualificationDistribution.sales_qualified || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Marketing Qualified</p>
                <p className="text-xl font-semibold">{qualificationDistribution.marketing_qualified || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Score</p>
                <p className="text-xl font-semibold">{Math.round(leads.reduce((sum, l) => sum + l.totalScore, 0) / leads.length)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Pipeline</p>
                <p className="text-xl font-semibold">{formatCurrency(leads.reduce((sum, l) => sum + l.estimatedValue, 0))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={scoreDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="grade" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Qualification Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={qualificationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percentage }) => `${status}: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {qualificationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Leads List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Leads ({filteredLeads.length})</CardTitle>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Select value={filterGrade} onValueChange={setFilterGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C+">C+</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                    <SelectItem value="F">F</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="totalScore">Score</SelectItem>
                    <SelectItem value="conversionProbability">Conversion</SelectItem>
                    <SelectItem value="estimatedValue">Value</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Leads List */}
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.leadId}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedLead?.leadId === lead.leadId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedLead(lead)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{lead.leadName}</h3>
                        <p className="text-xs text-gray-600 truncate">{lead.company}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={`text-xs border ${getGradeColor(lead.scoreGrade)}`}>
                          {lead.scoreGrade}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs mb-2">
                      <Badge className={getQualificationColor(lead.qualificationStatus)}>
                        {lead.qualificationStatus.replace('_', ' ')}
                      </Badge>
                      <span className="text-gray-500">{formatTimeAgo(lead.lastActivityDate)}</span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Score:</span>
                        <span className="font-medium">{lead.totalScore}/{lead.maxPossibleScore}</span>
                      </div>
                      <Progress value={lead.scorePercentage} className="h-1" />
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Conversion:</span>
                        <span className="font-medium text-green-600">{lead.conversionProbability}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Value:</span>
                        <span className="font-medium">{formatCurrency(lead.estimatedValue)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Lead Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedLead ? (
                <>
                  <Target className="w-5 h-5" />
                  {selectedLead.leadName} - Score Analysis
                </>
              ) : (
                'Select a lead to view scoring details'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedLead ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="breakdown">Score Breakdown</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="insights">AI Insights</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-3">Lead Information</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span>{selectedLead.leadEmail}</span>
                          </div>
                          {selectedLead.company && (
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-gray-500" />
                              <span>{selectedLead.company}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span>{selectedLead.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>First seen: {formatTimeAgo(selectedLead.firstTouchDate)}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium mb-3">Lead Score</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">{selectedLead.totalScore}</span>
                            <Badge className={`text-lg px-3 py-1 border ${getGradeColor(selectedLead.scoreGrade)}`}>
                              {selectedLead.scoreGrade}
                            </Badge>
                          </div>
                          <Progress value={selectedLead.scorePercentage} className="h-3" />
                          <p className="text-sm text-gray-600">
                            {selectedLead.totalScore} out of {selectedLead.maxPossibleScore} possible points
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-3">Qualification Status</h3>
                        <div className="space-y-2">
                          <Badge className={`text-sm px-3 py-1 ${getQualificationColor(selectedLead.qualificationStatus)}`}>
                            {selectedLead.qualificationStatus.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <p className="text-sm text-gray-600">{selectedLead.qualificationReason}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium mb-3">Predictive Metrics</h3>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">Conversion Probability</span>
                              <span className="font-medium">{selectedLead.conversionProbability}%</span>
                            </div>
                            <Progress value={selectedLead.conversionProbability} className="h-2" />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Time to Convert:</span>
                              <span className="font-medium ml-1">{selectedLead.timeToConversion} days</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Estimated Value:</span>
                              <span className="font-medium ml-1 text-green-600">{formatCurrency(selectedLead.estimatedValue)}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Churn Risk:</span>
                              <Badge className={`ml-1 text-xs ${getChurnRiskColor(selectedLead.churnRisk)}`}>
                                {selectedLead.churnRisk}
                              </Badge>
                            </div>
                            <div>
                              <span className="text-gray-600">Source:</span>
                              <span className="font-medium ml-1">{selectedLead.source}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="breakdown" className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-3">Score by Category</h3>
                    <div className="space-y-4">
                      {Object.entries(selectedLead.categoryScores).map(([category, score]) => {
                        const maxScore = scoringCriteria
                          .filter(c => c.category === category)
                          .reduce((sum, c) => sum + c.weight, 0);
                        const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
                        
                        return (
                          <div key={category} className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium capitalize">{category.replace('_', ' ')}</span>
                              <span className="text-sm">{score}/{maxScore} pts</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Applied Scoring Rules</h3>
                    <div className="space-y-3">
                      {scoringCriteria.filter(c => c.enabled).map((criteria) => (
                        <Card key={criteria.id} className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-sm">{criteria.name}</h4>
                              <p className="text-xs text-gray-600">{criteria.description}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {selectedLead.categoryScores[criteria.category as keyof typeof selectedLead.categoryScores]} pts
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {criteria.conditions.slice(0, 2).map((condition, index) => (
                              <div key={index} className="bg-gray-50 p-2 rounded">
                                <span className="font-medium">{condition.points} pts</span> - {condition.field} {condition.operator} {Array.isArray(condition.value) ? condition.value.join('-') : condition.value}
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-3">Score History</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={selectedLead.scoreHistory.reverse()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Recent Score Changes</h3>
                    <div className="space-y-3">
                      {selectedLead.scoreHistory.slice(0, 5).map((entry, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{entry.reason}</p>
                            <p className="text-xs text-gray-600">{formatTimeAgo(entry.date)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{entry.score} pts</span>
                            <div className={`flex items-center gap-1 ${
                              entry.change > 0 ? 'text-green-600' : entry.change < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {entry.change > 0 ? <ArrowUp className="w-3 h-3" /> : 
                               entry.change < 0 ? <ArrowDown className="w-3 h-3" /> : null}
                              <span className="text-xs">{entry.change > 0 ? '+' : ''}{entry.change}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="insights" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ThumbsUp className="w-5 h-5 text-green-600" />
                          Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {selectedLead.strengths.map((strength, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-yellow-200 bg-yellow-50">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ThumbsDown className="w-5 h-5 text-yellow-600" />
                          Areas for Improvement
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {selectedLead.weaknesses.map((weakness, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <AlertTriangle className="w-3 h-3 text-yellow-600" />
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-blue-600" />
                        AI Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedLead.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium mt-0.5">
                              {index + 1}
                            </div>
                            <p className="text-sm">{recommendation}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-200 bg-purple-50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="w-5 h-5 text-purple-600" />
                        Next Best Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedLead.nextBestActions.map((action, index) => (
                          <Button key={index} variant="outline" size="sm" className="w-full justify-start">
                            <Activity className="w-4 h-4 mr-2" />
                            {action}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-80 text-gray-500">
                <div className="text-center">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a lead from the left to view scoring details</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}